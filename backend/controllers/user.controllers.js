/**
 * controllers/user.controllers.js
 * ─────────────────────────────────────────────────────────────────
 * ADDED (Phase 5):
 *   ✅ getRecommendedUsers  — weighted recommendation pipeline
 *                             with mutual-follower scoring, recency
 *                             boost, and 5-minute cache layer
 *
 * UNCHANGED:
 *   getSuggestions, getProfile, updateProfile,
 *   getUserByUsername, searchUsers, getAllUsers
 * ─────────────────────────────────────────────────────────────────
 */

import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import Post from "../models/post.model.js";
import Conversation from "../models/conversation.model.js";
import response from "../lib/responeHandler.js";
import { buildRecommendedUsersPipeline } from "../lib/feedRanking.js";
import { getCachedRecommended, setCachedRecommended } from "../lib/feedCache.js";

/* ═══════════════════════════════════════════════════════════════
   UNCHANGED FUNCTIONS
═══════════════════════════════════════════════════════════════ */

export const getSuggestions = async (req, res) => {
  try {
    const userId    = req.user._id;
    const followers = req.user.followers;
    const following = req.user.following;
    const user = await User.find({
      _id: {
        $ne:  userId,
        $nin: [...followers, ...following],
      },
    }).limit(3);

    if (!user) {
      return res.status(400).json({ message: "User not Found" });
    }

    res.json(user);
  } catch (error) {
    console.log("Error in getSuggestions controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select(
      "-password"
    );

    if (!user) {
      return res.status(400).json({ message: "User not Found" });
    }

    const postsCount = await Post.countDocuments({ author: user._id });
    const userObj    = user.toObject();
    userObj.postsCount = postsCount;

    res.json(userObj);
  } catch (error) {
    console.log("Error in getProfile controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const isDataUrl = (value) =>
      typeof value === "string" && value.startsWith("data:image");

    const allowedFields = [
      "name",
      "username",
      "avatar",
      "bannerImage",
      "bio",
      "location",
      "website",
    ];

    const updatedData = {};

    for (const field of allowedFields) {
      if (req.body[field]) {
        updatedData[field] = req.body[field];
      }
    }

    if (req.body.avatar) {
      if (isDataUrl(req.body.avatar)) {
        const result = await cloudinary.uploader.upload(req.body.avatar);
        updatedData.avatar = result.secure_url;
      } else {
        updatedData.avatar = req.body.avatar;
      }
    }

    const bannerValue =
      req.body.bannerImage || req.body.bannerImg || req.body.bannarImg;
    if (bannerValue) {
      if (isDataUrl(bannerValue)) {
        const result = await cloudinary.uploader.upload(bannerValue);
        updatedData.bannerImage = result.secure_url;
      } else {
        updatedData.bannerImage = bannerValue;
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updatedData },
      { new: true }
    ).select("-password");

    res.status(200).json(user);
  } catch (error) {
    console.log("Error in updateProfile controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUserByUsername = async (req, res) => {
  try {
    const username = req.params.username;
    const user = await User.findOne({ username }).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.log("Error in getUserByUsername controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: "i" } },
        { name:     { $regex: q, $options: "i" } },
      ],
      _id: { $ne: req.user._id },
    })
      .select("-password")
      .limit(10);

    res.json(users);
  } catch (error) {
    console.log("Error in searchUsers controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const loggedUser = req.user._id;

    const users = await User.find({ _id: { $ne: loggedUser } })
      .select("username avatar lastSeen isOnline bio")
      .lean();

    const userWithConversation = await Promise.all(
      users.map(async (user) => {
        const conversation = await Conversation.findOne({
          participants: { $all: [loggedUser, user._id] },
        })
          .populate({
            path: "lastMessage",
            select: "content createdAt sender receiver",
          })
          .lean();

        return {
          ...user,
          conversation,
        };
      })
    );

    return response(res, 200, "users retrieved successfully", userWithConversation);
  } catch (error) {
    console.error("Error in getAllUsers controller:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ═══════════════════════════════════════════════════════════════
   ✅ NEW — RECOMMENDED USERS  (Phase 5)
   GET /api/v1/users/recommended?limit=10
   ─────────────────────────────────────────────────────────────
   Single aggregate() call scored by:

     UserScore = (mutualFollowers × 10)
               + (postsCount     × 0.5)
               + recencyBoost  (up to +3 for accounts < 30 days old)

   Results are cached for FEED_CACHE_REC_TTL seconds (default 300s).
   Cache is NOT invalidated on follow/unfollow — slight staleness is
   acceptable for recommendations (they refresh naturally on TTL).
═══════════════════════════════════════════════════════════════ */
export const getRecommendedUsers = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const limit  = Math.min(parseInt(req.query.limit || "10", 10), 20);

    /* ── 1. Cache read ── */
    const cached = await getCachedRecommended(userId);
    if (cached) {
      return response(res, 200, "Recommended users fetched", cached);
    }

    /* ── 2. Build and run the aggregation pipeline ── */
    const pipeline = buildRecommendedUsersPipeline(req.user, limit);
    const users    = await User.aggregate(pipeline);

    /* ── 3. Cache write (5-minute TTL by default) ── */
    await setCachedRecommended(userId, users);

    return response(res, 200, "Recommended users fetched", users);
  } catch (error) {
    console.error("Error in getRecommendedUsers controller", error.stack);
    return res.status(500).json({ message: "Server error" });
  }
};