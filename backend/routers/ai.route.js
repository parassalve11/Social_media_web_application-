import { Router } from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { generateMessageDraft, generatePostDraft } from "../controllers/ai.controller.js";

const router = Router();

router.post("/posts/draft", protectRoute, generatePostDraft);
router.post("/messages/draft", protectRoute, generateMessageDraft);

export default router;
