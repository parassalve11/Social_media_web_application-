import Follow from "../models/follow.model.js";
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";

/* ─── helper ─── */
const emitNotification = (req, recipientId, notification) => {
  if (!req.io || !req.socketUserMap) return;
  const socketId = req.socketUserMap.get(String(recipientId));
  if (socketId) req.io.to(socketId).emit("new_notification", notification);
};

export const followUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user._id;

    if (followerId.toString() === userId) {
      return res.status(401).json({ message: "You cannot follow yourself" });
    }

    const follower = await User.findById(followerId);
    const following = await User.findById(userId);

    if (!follower || !following) {
      return res.status(400).json({ message: "User not found" });
    }

    const existingFollow = await Follow.findOne({ follower: followerId, followed: userId });
    if (existingFollow) {
      return res.status(400).json({ message: "Already following this user" });
    }

    await new Follow({ follower: followerId, followed: userId }).save();
    await User.findByIdAndUpdate(followerId, { $addToSet: { following: userId } });
    await User.findByIdAndUpdate(userId, { $addToSet: { followers: followerId } });

    // Create notification
    const notification = new Notification({
      recipient: userId,
      type: "follow",
      relatedUser: followerId,
    });
    await notification.save();

    // ── Real-time emit ──
    const populatedNotification = await Notification.findById(notification._id)
      .populate("relatedUser", "name username avatar");

    emitNotification(req, userId, populatedNotification);

    res.status(200).json({
      message: "Successfully followed user",
      followerId: followerId.toString(),
      followedId: userId.toString(),
    });
  } catch (error) {
    console.log("Error in followUser Controller", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

export const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user._id;

    const followers = await User.findById(followerId);
    const following = await User.findById(userId);

    if (!followers || !following) {
      return res.status(400).json({ message: "User not found" });
    }

    const existingFollow = await Follow.findOne({ follower: followerId, followed: userId });
    if (!existingFollow) {
      return res.status(401).json({ message: "You are not following this user" });
    }

    await Follow.deleteOne({ follower: followerId, followed: userId });
    await User.findByIdAndUpdate(followerId, { $pull: { following: userId } });
    await User.findByIdAndUpdate(userId, { $pull: { followers: followerId } });

    await Notification.deleteOne({ recipient: userId, type: "follow", relatedUser: followerId });

    res.status(200).json({
      message: "Successfully unfollowed user",
      followerId: followerId.toString(),
      followedId: userId.toString(),
    });
  } catch (error) {
    console.log("Error in unfollowUser Controller", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getfollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate("followers", "name username avatar bio");
    if (!user) return res.status(400).json({ message: "User not found" });
    res.json(user.followers);
  } catch (error) {
    console.log("Error in getfollowers Controller", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getfollowing = async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId).populate("following", "name username avatar bio");
  if (!user) return res.status(400).json({ message: "User not found" });
  res.json(user?.following);
  try {
  } catch (error) {
    console.log("Error in getfollowing Controller", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};