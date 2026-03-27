/**
 * routers/user.route.js
 * ─────────────────────────────────────────────────────────────────
 * ADDED (Phase 5):
 *   GET /api/v1/users/recommended   ← weighted recommended users
 *
 * IMPORTANT — Route order matters in Express.
 * Static segments (/all, /search, /recommended) MUST be declared
 * before the dynamic segment (/:username) to prevent Express from
 * treating "recommended" as a username parameter.
 * ─────────────────────────────────────────────────────────────────
 */

import { Router } from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import {
  getProfile,
  getSuggestions,
  updateProfile,
  getUserByUsername,
  searchUsers,
  getAllUsers,
  getRecommendedUsers,   // ← NEW
} from "../controllers/user.controllers.js";

const router = Router();

/* ── Static routes first (must come before /:username) ── */
router.get("/all",         protectRoute, getAllUsers);
router.get("/search",      protectRoute, searchUsers);
router.get("/recommended", protectRoute, getRecommendedUsers);  // ← NEW

/* ── Suggestions (root with query) ── */
router.get("/",            protectRoute, getSuggestions);

/* ── Profile mutations ── */
router.put("/profile",     protectRoute, updateProfile);

/* ── Dynamic username routes (must be LAST) ── */
router.put("/username/:username", protectRoute, getUserByUsername);
router.get("/:username",          protectRoute, getProfile);

export default router;