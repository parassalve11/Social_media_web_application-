/**
 * controllers/reel.controller.js
 * ─────────────────────────────────────────────────────────────────
 * CHANGED functions (Phase 4):
 *   ✅ getReelFeed  — now uses weighted gravity ranking
 *                     with ×1.2 reel-format boost + affinity boost
 *
 * UNCHANGED functions (all others kept exactly as-is):
 *   getUserReels, createReel, deleteReel, likeReel,
 *   commentReel, viewReel, getReelComments
 * ─────────────────────────────────────────────────────────────────
 */

import mongoose from "mongoose";
import Reel from "../models/reel.model.js";
import { uploadToClouduinary } from "../lib/cloudinary.js";
import response from "../lib/responeHandler.js";
import {
  buildCursorMatch,
  buildReelScoringStages,
  buildReelCleanupStage,
  buildReelAuthorLookup,
  buildReelCommentUsersLookup,
} from "../lib/feedRanking.js";
import {
  getCachedFeed,
  setCachedFeed,
  invalidateUserFeedCache,
} from "../lib/feedCache.js";

/* ─── helpers ─── */
const POPULATE_AUTHOR  = "name username avatar bio";
const POPULATE_COMMENT = "name username avatar";

/* ═══════════════════════════════════════════════════════════════
   ✅ CHANGED — REEL FEED  (Weighted Gravity Ranking + Reel Boost)
   GET /reels/feed?cursor=&limit=
   ─────────────────────────────────────────────────────────────
   Single aggregate() call:
     1. $match           — public reels + cursor pagination
     2–6. scoring        — gravity formula, ×1.2 reel boost, affinity boost
     7. $sort            — finalScore DESC
     8. $limit           — limit + 1
     9. $lookup/$unwind  — hydrate author
    10. $lookup + zip    — hydrate comments.user
    11. $unset           — strip internal _ fields

   Score formula:
     rawScore  = (likes + comments×2 + viewCount×0.3) / (age + 2)^1.5
     finalScore = rawScore × 1.2 × affinityBoost(1.0 or 1.2)
═══════════════════════════════════════════════════════════════ */
export const getReelFeed = async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit || "10", 10), 20);
    const cursor = req.query.cursor || null;
    const userId = req.user._id.toString();

    /* ── Cache read (Phase 7) ── */
    const cached = await getCachedFeed("reels", userId, cursor);
    if (cached) return response(res, 200, "Reels fetched", cached);

    // Affinity boost uses the logged-in user's following list
    const followingIds = req.user?.following || [];

    const pipeline = [
      /* ── 1. Pre-filter: only public reels + cursor ── */
      {
        $match: {
          isPublic: true,
          ...buildCursorMatch(cursor),
        },
      },

      /* ── 2–6. Gravity scoring with reel-format boost ── */
      ...buildReelScoringStages(followingIds),

      /* ── 7. Best score first ── */
      { $sort: { _finalScore: -1, _id: -1 } },

      /* ── 8. One extra for hasMore detection ── */
      { $limit: limit + 1 },

      /* ── 9. Hydrate author via $lookup ── */
      ...buildReelAuthorLookup(),

      /* ── 10. Hydrate comments.user ── */
      ...buildReelCommentUsersLookup(),

      /* ── 11. Strip internal scoring fields ── */
      buildReelCleanupStage(),
    ];

    const reels   = await Reel.aggregate(pipeline);
    const hasMore = reels.length > limit;
    const data    = hasMore ? reels.slice(0, limit) : reels;
    const nextCursor = hasMore ? data[data.length - 1]._id : null;

    const result = { reels: data, nextCursor, hasMore };

    /* ── Cache write (Phase 7) ── */
    await setCachedFeed("reels", userId, cursor, result);

    return response(res, 200, "Reels fetched", result);
  } catch (err) {
    console.error("getReelFeed error", err.stack);
    return response(res, 500, "Internal server error");
  }
};

/* ═══════════════════════════════════════════════════════════════
   ALL UNCHANGED FUNCTIONS BELOW
   (copied verbatim — no logic changes)
═══════════════════════════════════════════════════════════════ */

export const getUserReels = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId)) {
      return response(res, 400, "Invalid user id");
    }

    const reels = await Reel.find({ author: userId, isPublic: true })
      .sort({ createdAt: -1 })
      .populate("author", POPULATE_AUTHOR)
      .lean();

    return response(res, 200, "User reels fetched", reels);
  } catch (err) {
    console.error("getUserReels error", err.message);
    return response(res, 500, "Internal server error");
  }
};

export const createReel = async (req, res) => {
  try {
    const userId = req.user._id;
    const file   = req.file;

    if (!file) {
      return response(res, 400, "Video file is required");
    }

    if (!file.mimetype.startsWith("video/")) {
      return response(res, 400, "Only video files are allowed");
    }

    const upload = await uploadToClouduinary(file);
    if (!upload?.secure_url) {
      return response(res, 500, "Video upload failed");
    }

    const { caption = "", audioName = "Original Audio" } = req.body;

    const reel = new Reel({
      author:    userId,
      videoUrl:  upload.secure_url,
      thumbnailUrl: upload.thumbnail_url || null,
      duration:  upload.duration || 0,
      caption,
      audioName,
    });

    await reel.save();

    /* ── Invalidate reel feed cache so new reel surfaces immediately (Phase 7) ── */
    await invalidateUserFeedCache(userId);

    const populated = await Reel.findById(reel._id)
      .populate("author", POPULATE_AUTHOR)
      .lean();

    return response(res, 201, "Reel created successfully", populated);
  } catch (err) {
    console.error("createReel error", err.message);
    return response(res, 500, "Internal server error");
  }
};

export const deleteReel = async (req, res) => {
  try {
    const { reelId } = req.params;
    const userId     = req.user._id;

    const reel = await Reel.findById(reelId);
    if (!reel) return response(res, 404, "Reel not found");

    if (reel.author.toString() !== userId.toString()) {
      return response(res, 403, "Not authorized to delete this reel");
    }

    await reel.deleteOne();

    /* ── Invalidate reel feed cache (Phase 7) ── */
    await invalidateUserFeedCache(userId);

    return response(res, 200, "Reel deleted successfully");
  } catch (err) {
    console.error("deleteReel error", err.message);
    return response(res, 500, "Internal server error");
  }
};

export const likeReel = async (req, res) => {
  try {
    const { reelId } = req.params;
    const userId     = req.user._id;

    const reel = await Reel.findById(reelId);
    if (!reel) return response(res, 404, "Reel not found");

    const liked = reel.likes.some((id) => id.toString() === userId.toString());

    if (liked) {
      reel.likes = reel.likes.filter((id) => id.toString() !== userId.toString());
    } else {
      reel.likes.push(userId);
    }

    await reel.save();
    // Invalidate viewer's reel feed cache so like count updates immediately
    await invalidateUserFeedCache(userId);
    return response(res, 200, liked ? "Unliked" : "Liked", {
      liked: !liked,
      likesCount: reel.likes.length,
    });
  } catch (err) {
    console.error("likeReel error", err.message);
    return response(res, 500, "Internal server error");
  }
};

export const commentReel = async (req, res) => {
  try {
    const { reelId }  = req.params;
    const userId      = req.user._id;
    const { content } = req.body;

    if (!content?.trim()) return response(res, 400, "Comment content required");

    const reel = await Reel.findByIdAndUpdate(
      reelId,
      { $push: { comments: { user: userId, content: content.trim() } } },
      { new: true }
    ).populate("comments.user", POPULATE_COMMENT);

    if (!reel) return response(res, 404, "Reel not found");

    // Invalidate viewer's reel feed cache so comment count updates immediately
    await invalidateUserFeedCache(userId);

    const newComment = reel.comments[reel.comments.length - 1];
    return response(res, 201, "Comment added", newComment);
  } catch (err) {
    console.error("commentReel error", err.message);
    return response(res, 500, "Internal server error");
  }
};

export const viewReel = async (req, res) => {
  try {
    const { reelId } = req.params;
    const userId     = req.user._id;

    const reel = await Reel.findById(reelId).select("views viewCount");
    if (!reel) return response(res, 404, "Reel not found");

    if (!reel.views.some((id) => id.toString() === userId.toString())) {
      reel.views.push(userId);
      reel.viewCount += 1;
      await reel.save();
    }

    return response(res, 200, "View registered");
  } catch (err) {
    console.error("viewReel error", err.message);
    return response(res, 500, "Internal server error");
  }
};

export const getReelComments = async (req, res) => {
  try {
    const { reelId } = req.params;

    const reel = await Reel.findById(reelId)
      .select("comments")
      .populate("comments.user", POPULATE_COMMENT)
      .lean();

    if (!reel) return response(res, 404, "Reel not found");

    const comments = [...reel.comments].reverse();
    return response(res, 200, "Comments fetched", comments);
  } catch (err) {
    console.error("getReelComments error", err.message);
    return response(res, 500, "Internal server error");
  }
};
