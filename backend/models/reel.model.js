/**
 * models/reel.model.js
 * ────────────────────────────────────────────────────────────────
 * Compound indexes added for Weighted Ranking System:
 *
 *  { isPublic: 1, createdAt: -1 }      — public feed pre-filter + cursor sort
 *  { isPublic: 1, viewCount: -1 }      — "hot reels" sort (alternative tab)
 *  { author: 1,  createdAt: -1 }       — profile reels grid  (already existed as single)
 *
 * The existing  { createdAt: -1 }  and  { author: 1, createdAt: -1 }
 * indexes are kept (they are extended/replaced by the compound versions).
 * ────────────────────────────────────────────────────────────────
 */

import mongoose from "mongoose";

const reelCommentSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content:   { type: String, required: true, maxlength: 300 },
  createdAt: { type: Date, default: Date.now },
});

const reelSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    videoUrl:     { type: String, required: true },
    thumbnailUrl: { type: String, default: null },
    caption:      { type: String, default: "", maxlength: 500 },
    audioName:    { type: String, default: "Original Audio" },
    hashtags:     [{ type: String, lowercase: true, trim: true }],
    likes:        [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments:     [reelCommentSchema],
    views:        [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    viewCount:    { type: Number, default: 0 }, // anonymous + deduped view counter
    duration:     { type: Number, default: 0 }, // seconds
    isPublic:     { type: Boolean, default: true },
  },
  { timestamps: true }
);

/* ─── Original indexes (keep) ─── */
reelSchema.index({ createdAt: -1 });
reelSchema.index({ author: 1, createdAt: -1 });

/* ─── NEW Compound indexes for ranked feed ─── */

// Public feed filter + cursor pagination
reelSchema.index({ isPublic: 1, createdAt: -1, _id: -1 });

// Public feed filter + "hot" sort by viewCount
reelSchema.index({ isPublic: 1, viewCount: -1, createdAt: -1 });

// Author's public reels (profile grid)
reelSchema.index({ author: 1, isPublic: 1, createdAt: -1 });

/* ─── Pre-save hook: extract hashtags from caption ─── */
reelSchema.pre("save", function (next) {
  if (this.isModified("caption")) {
    const found = this.caption.match(/#\w+/g) || [];
    this.hashtags = found.map((h) => h.toLowerCase().replace("#", ""));
  }
  next();
});

const Reel = mongoose.model("Reel", reelSchema);
export default Reel;