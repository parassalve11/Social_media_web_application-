import { Router } from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import {
  bookmarkPost,
  createComment,
  createPost,
  deletePost,
  getBookmarkPosts,
  getFollowingPostFeed,
  getPostById,
  getPostFeeds,
  getPostsByHashtag,
  getPostsByUsername,
  getTrendingHashtags,
  likePost,
  searchPosts,
  updatePost,
} from "../controllers/post.controller.js";
import { multerMiddleware } from "../lib/cloudinary.js";


const router = Router();
router.get("/hashtag/:hashtag", getPostsByHashtag);
router.get("/trending-hashtags", getTrendingHashtags);
router.get("/search", protectRoute, searchPosts);
router.get("/bookmarks",protectRoute,getBookmarkPosts)
router.get("/for-you", protectRoute, getPostFeeds);
router.get("/following", protectRoute, getFollowingPostFeed);
router.get("/user/:username", protectRoute, getPostsByUsername);
router.post("/create", protectRoute, multerMiddleware, createPost);
router.delete("/delete/:id", protectRoute, deletePost);
router.put("/edit/:id" , protectRoute , multerMiddleware , updatePost);
router.get("/:id", protectRoute, getPostById);
router.post("/:id/like", protectRoute, likePost);
router.post("/:id/comment", protectRoute, createComment);
router.post("/:id/bookmark", protectRoute, bookmarkPost);



export default router;
