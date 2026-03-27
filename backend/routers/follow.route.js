import { Router } from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { followUser, getfollowers, getfollowing , unfollowUser} from "../controllers/follow.controller.js";



const router = Router();

router.get('/:userId/followers' , protectRoute , getfollowers);
router.post('/:userId/follow' , protectRoute , followUser);
router.post('/:userId/unfollow' , protectRoute , unfollowUser);

router.get('/:userId/following' , protectRoute , getfollowing);

export default router;