import { Router } from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import {
  getReelFeed,
  getUserReels,
  createReel,
  deleteReel,
  likeReel,
  commentReel,
  viewReel,
  getReelComments,
} from "../controllers/reel.controller.js";
import multer from "multer";

// Use disk storage so uploadToClouduinary can read file.path
const upload = multer({ dest: "uploads/" });

const router = Router();

// Feed
router.get("/feed",           protectRoute, getReelFeed);
router.get("/user/:userId",   protectRoute, getUserReels);

// CRUD
router.post("/create",        protectRoute, upload.single("media"), createReel);
router.delete("/:reelId",     protectRoute, deleteReel);

// Interactions
router.post("/:reelId/like",  protectRoute, likeReel);
router.post("/:reelId/comment", protectRoute, commentReel);
router.put("/:reelId/view",   protectRoute, viewReel);
router.get("/:reelId/comments", protectRoute, getReelComments);

export default router;