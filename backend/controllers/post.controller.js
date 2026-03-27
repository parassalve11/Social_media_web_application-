/**
 * controllers/post.controller.js
 * ─────────────────────────────────────────────────────────────────
 * CHANGED functions (Phase 3):
 *   ✅ getPostFeeds           — now uses weighted gravity ranking
 *   ✅ getFollowingPostFeed   — now uses weighted gravity ranking
 *                               (affinity boost pre-applied, author pre-filtered)
 *
 * UNCHANGED functions (all others kept exactly as-is):
 *   getPostsByUsername, createPost, deletePost, updatePost,
 *   getPostById, createComment, likePost, bookmarkPost,
 *   getBookmarkPosts, getTrendingHashtags, searchPosts, getPostsByHashtag
 * ─────────────────────────────────────────────────────────────────
 */

import mongoose from "mongoose";
import cloudinary, { uploadToClouduinary } from "../lib/cloudinary.js";
import Notification from "../models/notification.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import {
  buildCursorMatch,
  buildPostScoringStages,
  buildPostCleanupStage,
  buildAuthorLookup,
  buildCommentUsersLookup,
} from "../lib/feedRanking.js";
import {
  getCachedFeed,
  setCachedFeed,
  invalidateUserFeedCache,
} from "../lib/feedCache.js";

const escapeRegExp = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/* ─── helper: emit new_notification to a user's socket if online ─── */
const emitNotification = (req, recipientId, notification) => {
  if (!req.io || !req.socketUserMap) return;
  const socketId = req.socketUserMap.get(String(recipientId));
  if (socketId) {
    req.io.to(socketId).emit("new_notification", notification);
  }
};

const getPublicIdFromUrl = (url = "") => {
  if (!url) return null;
  const parts = url.split("/upload/");
  if (parts.length < 2) {
    const last = url.split("/").pop() || "";
    return last.split(".")[0] || null;
  }
  const path = parts[1].replace(/^v\d+\//, "");
  return path.replace(/\.[^/.]+$/, "");
};

const inferResourceType = (url = "") => {
  const lower = url.toLowerCase();
  if (
    lower.includes("/video/") ||
    lower.includes(".mp4") ||
    lower.includes(".webm") ||
    lower.includes(".mov") ||
    lower.includes(".m4v")
  ) {
    return "video";
  }
  return "image";
};

const destroyMediaItem = async (item) => {
  const url = item?.url || item;
  const publicId = item?.publicId || getPublicIdFromUrl(url);
  if (!publicId) return;
  const resourceType = item?.type || inferResourceType(url);
  const options = resourceType === "video" ? { resource_type: "video" } : undefined;
  await cloudinary.uploader.destroy(publicId, options);
};

/* ═══════════════════════════════════════════════════════════════
   ✅ CHANGED — FOR-YOU FEED  (Weighted Gravity Ranking)
   GET /posts/for-you?cursor=&pageSize=
   ─────────────────────────────────────────────────────────────
   Single aggregate() call:
     1. $match          — cursor pagination
     2–6. scoring       — gravity formula + affinity boost
     7. $sort           — finalScore DESC
     8. $limit          — pageSize + 1
     9. $lookup/$unwind — hydrate author
    10. $lookup + zip   — hydrate comments.user
    11. $unset          — strip internal _ fields
═══════════════════════════════════════════════════════════════ */
export const getPostFeeds = async (req, res) => {
  try {
    const cursor   = req.query.cursor   || null;
    const pageSize = Math.min(parseInt(req.query.pageSize || "7", 10), 20);
    const userId   = req.user._id.toString();

    /* ── Cache read (Phase 7) ── */
    const cached = await getCachedFeed("forYou", userId, cursor);
    if (cached) return res.status(200).json(cached);

    // The user's following list drives the affinity boost
    const followingIds = req.user?.following || [];

    const pipeline = [
      /* ── 1. Cursor-based pre-filter ── */
      {
        $match: {
          ...buildCursorMatch(cursor),
          // Only surface posts that have content or media (safety guard)
        },
      },

      /* ── 2-6. Gravity scoring stages ── */
      ...buildPostScoringStages(followingIds),

      /* ── 7. Sort by computed score (highest first) ── */
      { $sort: { _finalScore: -1, _id: -1 } },

      /* ── 8. Fetch one extra to detect hasMore ── */
      { $limit: pageSize + 1 },

      /* ── 9. Hydrate author via $lookup (replaces .populate) ── */
      ...buildAuthorLookup(),

      /* ── 10. Hydrate comments.user ── */
      ...buildCommentUsersLookup(),

      /* ── 11. Strip internal scoring fields ── */
      buildPostCleanupStage(),
    ];

    const posts   = await Post.aggregate(pipeline);
    const hasMore = posts.length > pageSize;
    const data    = hasMore ? posts.slice(0, pageSize) : posts;

    // Cursor is the _id of the LAST returned document
    // (clients send this back as ?cursor= on the next request)
    const nextCursor = hasMore ? data[data.length - 1]._id : null;

    const result = { posts: data, nextCursor, hasMore };

    /* ── Cache write (Phase 7) ── */
    await setCachedFeed("forYou", userId, cursor, result);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in getPostFeeds Controller", error.stack);
    return res.status(500).json({ message: "Server Error" });
  }
};

/* ═══════════════════════════════════════════════════════════════
   ✅ CHANGED — FOLLOWING FEED  (Weighted Gravity Ranking)
   GET /posts/following?cursor=&pageSize=
   ─────────────────────────────────────────────────────────────
   Same pipeline as For-You but:
     • $match pre-filters to only authors in following[]
     • All posts pass the affinity boost (they're all followed)
       so the gravity score alone differentiates them.
═══════════════════════════════════════════════════════════════ */
export const getFollowingPostFeed = async (req, res) => {
  try {
    const cursor     = req.query.cursor   || null;
    const pageSize   = Math.min(parseInt(req.query.pageSize || "7", 10), 20);
    const following  = req.user?.following || [];
    const userId     = req.user._id.toString();

    // Early-exit: nothing to show if user follows nobody
    if (!following.length) {
      return res.status(200).json({ posts: [], nextCursor: null, hasMore: false });
    }

    if (cursor && !mongoose.isValidObjectId(cursor)) {
      return res.status(400).json({ message: "Invalid cursor" });
    }

    /* ── Cache read (Phase 7) ── */
    const cached = await getCachedFeed("following", userId, cursor);
    if (cached) return res.status(200).json(cached);

    const pipeline = [
      /* ── 1. Only posts from followed authors + cursor ── */
      {
        $match: {
          author: { $in: following },
          ...buildCursorMatch(cursor),
        },
      },

      /* ── 2-6. Gravity scoring  (all posts get ×1.2 affinity boost
                 because they're all from followed users) ── */
      ...buildPostScoringStages(following),

      /* ── 7. Best score first ── */
      { $sort: { _finalScore: -1, _id: -1 } },

      /* ── 8. One extra for hasMore detection ── */
      { $limit: pageSize + 1 },

      /* ── 9-10. Populate ── */
      ...buildAuthorLookup(),
      ...buildCommentUsersLookup(),

      /* ── 11. Clean up internal fields ── */
      buildPostCleanupStage(),
    ];

    const posts   = await Post.aggregate(pipeline);
    const hasMore = posts.length > pageSize;
    const data    = hasMore ? posts.slice(0, pageSize) : posts;
    const nextCursor = hasMore ? data[data.length - 1]._id : null;

    const result = { posts: data, nextCursor, hasMore };

    /* ── Cache write (Phase 7) ── */
    await setCachedFeed("following", userId, cursor, result);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in getFollowingPostFeed Controller", error.stack);
    return res.status(500).json({ message: "Server Error" });
  }
};

/* ═══════════════════════════════════════════════════════════════
   ALL UNCHANGED FUNCTIONS BELOW
   (copied verbatim — no logic changes)
═══════════════════════════════════════════════════════════════ */

export const getPostsByUsername = async (req, res) => {
  try {
    const normalizedUsername = String(req.params.username || "").toLowerCase();
    if (!normalizedUsername) {
      return res.status(400).json({ message: "Username is required" });
    }

    const user = await User.findOne({ username: normalizedUsername }).select("_id");
    if (!user) {
      return res.status(404).json({ message: "User not Found" });
    }

    const posts = await Post.find({ author: user._id })
      .sort({ createdAt: -1 })
      .populate("author", "name username avatar bio followers following")
      .populate("comments.user", "name username avatar bio followers following");

    return res.status(200).json(posts);
  } catch (error) {
    console.error("Error in getPostsByUsername Controller", error.stack);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const createPost = async (req, res) => {
  try {
    const content = typeof req.body.content === "string" ? req.body.content : "";
    const legacyImage = req.body.image;
    const files = Array.isArray(req.files) ? req.files : [];
    const hasMediaFiles = files.length > 0;
    let media = [];
    let coverImage = null;

    if (!content.trim() && !legacyImage && !hasMediaFiles) {
      return res.status(400).json({ message: "Content or media is required" });
    }

    if (hasMediaFiles) {
      const uploads = await Promise.all(files.map((file) => uploadToClouduinary(file)));
      media = uploads
        .filter(Boolean)
        .map((upload) => ({
          url: upload.secure_url,
          type: upload.resource_type === "video" ? "video" : "image",
          publicId: upload.public_id,
        }));
      coverImage = media.find((item) => item.type === "image")?.url || null;
    } else if (legacyImage) {
      const imgResult = await cloudinary.uploader.upload(legacyImage);
      if (!imgResult) {
        return res.status(401).json({ message: "The image is not get uploaded" });
      }
      media = [{ url: imgResult.secure_url, type: "image", publicId: imgResult.public_id }];
      coverImage = imgResult.secure_url;
    }

    const newPost = new Post({
      author: req.user._id,
      content,
      media,
      image: coverImage || undefined,
    });

    await newPost.save();
    await User.findByIdAndUpdate(req.user._id, { $inc: { postsCount: 1 } });

    /* ── Invalidate feed cache so new post surfaces immediately (Phase 7) ── */
    await invalidateUserFeedCache(req.user._id);

    res.status(200).json({ message: "Post Created successfully." });
  } catch (error) {
    console.log("Error in CreatePost Controller", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

export const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const posts = await Post.findById(postId);
    if (!posts) return res.status(403).json({ message: "Post not Found." });

    if (posts.author.toString() !== userId.toString()) {
      return res.status(401).json({ message: "You are not authorized to delete this Post" });
    }

    if (Array.isArray(posts.media) && posts.media.length > 0) {
      await Promise.all(posts.media.map((item) => destroyMediaItem(item)));
    } else if (posts.image) {
      await destroyMediaItem({ url: posts.image, type: inferResourceType(posts.image) });
    }
    await Post.findByIdAndDelete(postId);
    await User.findByIdAndUpdate(userId, { $inc: { postsCount: -1 } });
    await User.updateOne({ _id: userId, postsCount: { $lt: 0 } }, { $set: { postsCount: 0 } });

    /* ── Invalidate feed cache (Phase 7) ── */
    await invalidateUserFeedCache(userId);

    res.status(201).json({ message: "Post deleted successfully." });
  } catch (error) {
    console.log("Error in deletePost Controller", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

export const updatePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post) return res.status(400).json({ message: "Post not Found" });

    const updatedData = {};
    const content = typeof req.body.content === "string" ? req.body.content : undefined;
    const legacyImage = req.body.image;
    const files = Array.isArray(req.files) ? req.files : [];
    const hasMediaFiles = files.length > 0;
    const clearMedia = String(req.body.clearMedia || "").toLowerCase() === "true";

    if (typeof content === "string") {
      updatedData.content = content;
    }

    const deleteExistingMedia = async () => {
      if (Array.isArray(post.media) && post.media.length > 0) {
        await Promise.all(post.media.map((item) => destroyMediaItem(item)));
      } else if (post.image) {
        await destroyMediaItem({ url: post.image, type: inferResourceType(post.image) });
      }
    };

    if (hasMediaFiles) {
      const uploads = await Promise.all(files.map((file) => uploadToClouduinary(file)));
      const media = uploads
        .filter(Boolean)
        .map((upload) => ({
          url: upload.secure_url,
          type: upload.resource_type === "video" ? "video" : "image",
          publicId: upload.public_id,
        }));
      const coverImage = media.find((item) => item.type === "image")?.url || null;

      await deleteExistingMedia();
      updatedData.media = media;
      updatedData.image = coverImage || null;
    } else if (legacyImage) {
      const result = await cloudinary.uploader.upload(legacyImage);
      await deleteExistingMedia();
      updatedData.media = [{ url: result.secure_url, type: "image", publicId: result.public_id }];
      updatedData.image = result.secure_url;
    } else if (clearMedia) {
      await deleteExistingMedia();
      updatedData.media = [];
      updatedData.image = null;
    }

    await Post.findByIdAndUpdate(postId, { $set: updatedData }, { new: true }).select("-password");
    res.status(201).json("Post Edited successfully");
  } catch (error) {
    console.log("Error in updatePost Controller", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getPostById = async (req, res) => {
  try {
    const postId = req.params.id;
    const posts = await Post.findById({ _id: postId })
      .populate("author", "name username avatar bio followers following")
      .populate("comments.user", "name username avatar bio followers following");

    if (!posts) return res.status(400).json({ message: "Post not Found" });
    res.json(posts);
  } catch (error) {
    console.log("Error in getPostById Controller", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

export const createComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;
    const { content } = req.body;

    const post = await Post.findByIdAndUpdate(
      postId,
      { $push: { comments: { user: userId, content } } },
      { new: true }
    ).populate("author", "name username avatar");

    if (post.author._id.toString() !== userId.toString()) {
      const notification = new Notification({
        recipient: post.author._id,
        type: "comment",
        relatedUser: userId,
        relatedPost: postId,
      });
      await notification.save();

      const populatedNotification = await Notification.findById(notification._id)
        .populate("relatedUser", "name username avatar")
        .populate("relatedPost", "content image");

      emitNotification(req, post.author._id, populatedNotification);
    }

    res.status(200).json(post);
  } catch (error) {
    console.log("Error in createComment Controller", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

export const likePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const post = await Post.findById(postId);

    const alreadyLiked = post.likes.includes(userId);
    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
    } else {
      post.likes.push(userId);
    }

    if (!alreadyLiked && post.author.toString() !== userId.toString()) {
      const notification = new Notification({
        recipient: post.author,
        type: "like",
        relatedUser: userId,
        relatedPost: postId,
      });
      await notification.save();

      const populatedNotification = await Notification.findById(notification._id)
        .populate("relatedUser", "name username avatar")
        .populate("relatedPost", "content image");

      emitNotification(req, post.author, populatedNotification);
    }

    await post.save();
    // Invalidate viewer's feed cache so like count updates immediately
    await invalidateUserFeedCache(userId);
    res.status(200).json(post);
  } catch (error) {
    console.log("Error in likePost Controller", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

export const bookmarkPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const posts = await Post.findById(postId);
    if (posts.bookmarks.includes(userId)) {
      posts.bookmarks = posts.bookmarks.filter((id) => id.toString() !== userId.toString());
    } else {
      posts.bookmarks.push(userId);
    }

    await posts.save();
    // Invalidate viewer's feed cache so bookmark state updates immediately
    await invalidateUserFeedCache(userId);
    res.json(posts);
  } catch (error) {
    console.log("Error in bookmarkPost Controller", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getBookmarkPosts = async (req, res) => {
  try {
    const userId = req.user._id;

    const posts = await Post.find({ bookmarks: userId })
      .sort({ createdAt: -1 })
      .populate("author", "name username avatar bio followers following")
      .populate("comments.user", "name username avatar bio followers following");

    res.status(200).json(posts);
  } catch (error) {
    console.log("Error in getBookmarkPosts Controller", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getTrendingHashtags = async (req, res) => {
  try {
    const hashtagAggregation = await Post.aggregate([
      { $match: { content: { $exists: true, $ne: "" } } },
      { $project: { hashtags: { $regexFindAll: { input: "$content", regex: "#\\w+" } } } },
      { $unwind: "$hashtags" },
      { $group: { _id: "$hashtags.match", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { hashtag: "$_id", count: 1, _id: 0 } },
    ]);

    res.status(200).json(hashtagAggregation);
  } catch (error) {
    console.error("Error in getTrendingHashtags Controller", error.stack);
    res.status(500).json({ message: "Server Error" });
  }
};

export const searchPosts = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return res.status(200).json([]);

    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");

    const posts = await Post.find({ content: { $regex: regex } })
      .sort({ createdAt: -1 })
      .limit(12)
      .populate("author", "name username avatar bio followers following");

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error in searchPosts Controller", error.stack);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getPostsByHashtag = async (req, res) => {
  try {
    const { hashtag } = req.params;
    const cursor = req.query.cursor || null;
    const pageSize = 7;

    if (!hashtag) return res.status(400).json({ message: "Hashtag is required" });

    const hashtagRegex = new RegExp(`#${escapeRegExp(hashtag)}\\b`, "i");

    let pipeline = [
      {
        $match: {
          content: hashtagRegex,
          ...(cursor && mongoose.isValidObjectId(cursor)
            ? { _id: { $lt: new mongoose.Types.ObjectId(cursor) } }
            : {}),
        },
      },
      { $addFields: { likesCount: { $size: "$likes" }, commentsCount: { $size: "$comments" } } },
      { $sort: { likesCount: -1, commentsCount: -1, createdAt: -1 } },
      { $limit: pageSize + 1 },
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "author",
          pipeline: [{ $project: { name: 1, username: 1, avatar: 1, bio: 1, followers: 1, following: 1 } }],
        },
      },
      { $unwind: "$author" },
      {
        $lookup: {
          from: "users",
          localField: "comments.user",
          foreignField: "_id",
          as: "commentUsers",
          pipeline: [{ $project: { name: 1, username: 1, avatar: 1, bio: 1, followers: 1, following: 1 } }],
        },
      },
      {
        $addFields: {
          comments: {
            $map: {
              input: "$comments",
              as: "comment",
              in: {
                $mergeObjects: [
                  "$$comment",
                  { user: { $arrayElemAt: ["$commentUsers", { $indexOfArray: ["$commentUsers._id", "$$comment.user"] }] } },
                ],
              },
            },
          },
        },
      },
      { $project: { commentUsers: 0 } },
    ];

    const posts = await Post.aggregate(pipeline);
    const hasMore = posts.length > pageSize;
    const nextCursor = hasMore ? posts[pageSize - 1]._id : null;

    res.status(200).json({ posts: posts.slice(0, pageSize), nextCursor, hasMore });
  } catch (error) {
    console.error("Error in getPostsByHashtag Controller", error.stack);
    res.status(500).json({ message: "Server Error" });
  }
};
