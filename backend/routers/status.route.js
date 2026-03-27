import { Router } from "express";

import { multerMiddleware } from "../lib/cloudinary.js";

import {
  createStatus,
  deleteStatus,
  getStatuses,
  viewStatus,
} from "../controllers/status.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", protectRoute, multerMiddleware, createStatus);
router.get("/", protectRoute, getStatuses);

router.put("/:statusId/view", protectRoute, viewStatus);

router.delete("/:statusId", protectRoute, deleteStatus);



export default router;