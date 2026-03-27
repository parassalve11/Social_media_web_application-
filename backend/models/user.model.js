/**
 * models/user.model.js
 * ────────────────────────────────────────────────────────────────
 * Compound indexes added for Weighted Ranking System:
 *
 *  { following: 1 }              — affinity boost lookup in feed pipeline
 *  { postsCount: -1 }            — recommended users sort (Phase 5)
 *  { followers: 1, _id: -1 }     — mutual followers calculation (Phase 5)
 *
 * All original auth-flow indexes are preserved.
 * ────────────────────────────────────────────────────────────────
 */

import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: false,
      select: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    authSource: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerifiedAt: { type: Date },
    verificationTokenHash: {
      type: String,
      select: false,
    },
    verificationTokenExpiresAt: {
      type: Date,
      select: false,
    },
    passwordResetTokenHash: {
      type: String,
      select: false,
    },
    passwordResetTokenExpiresAt: {
      type: Date,
      select: false,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockoutUntil: { type: Date },
    refreshTokenHash: {
      type: String,
      select: false,
    },
    refreshTokenExpiresAt: {
      type: Date,
      select: false,
    },
    passwordChangedAt: { type: Date },
    avatar: {
      type: String,
      default:
        "https://cdn.pixabay.com/photo/2017/07/18/23/23/user-2517430_1280.png",
    },
    lastSeen:  { type: Date },
    isOnline:  { type: Boolean, default: false },
    bannerImage: {
      type: String,
      default:
        "https://cdn.pixabay.com/photo/2020/05/21/11/08/banner-5200272_1280.jpg",
    },
    bio:      { type: String, default: "", maxlength: 160 },
    location: { type: String, default: "", maxlength: 50 },
    website:  { type: String, default: "", trim: true },
    isVerified: {
      type: Boolean,
      default: false,
    },
    postsCount: {
      type: Number,
      default: 0,
    },
    followers: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ],
    following: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ],
  },
  { timestamps: true }
);

/* ─── Original auth-flow indexes (keep) ─── */
userSchema.index({ verificationTokenHash: 1 });
userSchema.index({ passwordResetTokenHash: 1 });

/* ─── NEW indexes for ranking & recommendations ─── */

// Feed affinity boost: quickly resolve "is author in following[]?"
// Used in aggregation $lookup / $in comparisons
userSchema.index({ following: 1 });

// Recommended users (Phase 5): sort by engagement signal
userSchema.index({ postsCount: -1 });

// Mutual followers calculation (Phase 5)
userSchema.index({ followers: 1, _id: -1 });

// Username search (already used in controllers, making it explicit)
userSchema.index({ username: 1 });

const User = mongoose.model("User", userSchema);

export default User;