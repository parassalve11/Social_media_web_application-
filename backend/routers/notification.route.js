import { Router } from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import {
  deleteNotification,
  getNotifications,
  getUnreadNotificationsCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../controllers/notification.controller.js";

const router = Router();

router.get("/",               protectRoute, getNotifications);
router.get("/unread-count",   protectRoute, getUnreadNotificationsCount);
router.put("/mark-all-read",  protectRoute, markAllNotificationsAsRead);   // ← NEW
router.put("/:id/read",       protectRoute, markNotificationAsRead);
router.delete("/:id",         protectRoute, deleteNotification);

export default router;