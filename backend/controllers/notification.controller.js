import Notification from "../models/notification.model.js";

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const notifications = await Notification.find({ recipient: userId })
      .populate("relatedUser", "name username avatar")
      .populate("relatedPost", "content image")
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    console.log("Error in getNotifications Controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { read: true },
      { new: true }
    );

    res.json(notification);
  } catch (error) {
    console.log("Error in markNotificationAsRead Controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

/* ── NEW: mark ALL unread notifications as read at once ── */
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      { recipient: userId, read: false },
      { $set: { read: true } }
    );

    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.log("Error in markAllNotificationsAsRead Controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user._id;

    await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId,
    });

    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.log("Error in deleteNotification Controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUnreadNotificationsCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      read: false,
    });

    res.status(200).json({ count: unreadCount });
  } catch (error) {
    console.error("Error fetching unread notifications count:", error);
    res.status(500).json({ message: "Server error" });
  }
};