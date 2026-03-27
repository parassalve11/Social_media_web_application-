/**
 * models/post.model.js
 * ────────────────────────────────────────────────────────────────
 * Compound indexes added for Weighted Ranking System:
 *
 *  { createdAt: -1, _id: -1 }          — cursor-based pagination (for-you feed)
 *  { author: 1,  createdAt: -1 }       — filter by author then sort (following feed)
 *  { author: 1,  _id: -1 }             — profile grid query
 *
 * Index strategy note:
 *  MongoDB cannot use a normal index for the gravity score (it is a
 *  computed value).  The compound indexes above let the $match + $sort
 *  stages hit an index BEFORE the expensive $addFields score calculation,
 *  which dramatically reduces the number of documents scanned.
 * ────────────────────────────────────────────────────────────────
 */

import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String },
    media: [
      {
        url:      { type: String },
        type:     { type: String, enum: ["image", "video"] },
        publicId: { type: String },
      },
    ],
    image:     { type: String },
    likes:     [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [
      {
        content:   { type: String },
        user:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    // ── Future-ready: add these when your frontend supports them ──
    // sharesCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

/* ─── Original single-field indexes (keep these) ─── */
postSchema.index({ author: 1 });

/* ─── NEW Compound indexes for ranked feed ─── */

// For-You feed: cursor pagination sorted by _id (proxy for recency pre-filter)
postSchema.index({ createdAt: -1, _id: -1 });

// Following feed: filter by author list, then sort newest first
// MongoDB will use this for  { author: { $in: [...] } } + sort({ createdAt:-1 })
postSchema.index({ author: 1, createdAt: -1 });

// Profile grid query: all posts by one author, newest first
postSchema.index({ author: 1, _id: -1 });

// Hashtag search + recency sort
postSchema.index({ content: "text", createdAt: -1 });

const Post = mongoose.model("Post", postSchema);

export default Post;