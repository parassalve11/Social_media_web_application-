import { uploadToClouduinary } from "../lib/cloudinary.js";
import Status from "../models/status.model.js";
import response from "../lib/responeHandler.js";

export const createStatus = async (req, res) => {
  try {
    const { content, contentType } = req.body;
    const userId = req.user._id;
    const file = req.file || (Array.isArray(req.files) ? req.files[0] : null);

    let mediaUrl = null;
    let finalContentType = contentType || "text";

    if (file) {
      const uploadFile = await uploadToClouduinary(file);
      if (!uploadFile?.secure_url) {
        return response(res, 400, "Failed to Upload file");
      }
      mediaUrl = uploadFile.secure_url;

      // FIX: was startswith (lowercase), must be startsWith
      if (file.mimetype.startsWith("video")) {
        finalContentType = "video";
      } else if (file.mimetype.startsWith("image")) {
        finalContentType = "image";
      } else {
        return response(res, 400, "Unsupported file type");
      }
    } else if (content && content.trim()) {
      finalContentType = "text";
    } else {
      return response(res, 400, "Message content is required");
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const status = new Status({
      user: userId,
      content: mediaUrl || content,
      contentType: finalContentType || "text",
      expiresAt,
    });

    await status.save();

    const populateStatus = await Status.findById(status._id)
      .populate("user", "username avatar profilePicture")
      .populate("viewers", "username avatar profilePicture");

    // Broadcast to connected users
    if (req.io && req.socketUserMap) {
      for (const [connectedUserId, socketId] of req.socketUserMap) {
        if (connectedUserId !== String(userId)) {
          req.io.to(socketId).emit("new_status", populateStatus);
        }
      }
    }

    return response(res, 201, "Status created successfully", populateStatus);
  } catch (error) {
    console.log("Error on createStatus controller", error.message);
    return response(res, 500, "Internal server Error");
  }
};

export const getStatuses = async (req, res) => {
  try {
    const statuses = await Status.find({
      expiresAt: { $gt: new Date() },
    })
      .populate("user", "username avatar profilePicture")
      .populate("viewers", "username avatar profilePicture")
      .sort({ createdAt: -1 });

    return response(res, 200, "status retrieved", statuses);
  } catch (error) {
    console.log("Error on getStatuses controller", error.message);
    return response(res, 500, "Internal server Error");
  }
};

export const viewStatus = async (req, res) => {
  try {
    const { statusId } = req.params;
    const userId = req.user._id;

    const status = await Status.findById(statusId);

    if (!status) {
      return response(res, 404, "Status not found");
    }

    const alreadyViewed = status.viewers?.some(
      (viewerId) => String(viewerId) === String(userId)
    );

    if (!alreadyViewed) {
      status.viewers.push(userId);
      await status.save();

      const updateStatus = await Status.findById(statusId)
        .populate("user", "username avatar profilePicture")
        .populate("viewers", "username avatar profilePicture");

      if (req.io && req.socketUserMap) {
        const statusOwnerSocketId = req.socketUserMap.get(
          status.user.toString()
        );

        if (statusOwnerSocketId) {
          req.io.to(statusOwnerSocketId).emit("status_viewed", {
            statusId,
            viewerId: userId,
            totalViewers: updateStatus.viewers.length,
            viewers: updateStatus.viewers,
          });
        }
      }
    }

    return response(res, 200, "status viewed successfully");
  } catch (error) {
    console.log("Error on viewStatus controller", error.message);
    return response(res, 500, "Internal server Error");
  }
};

export const deleteStatus = async (req, res) => {
  try {
    const { statusId } = req.params;
    const userId = req.user._id;

    const status = await Status.findById(statusId);

    if (!status) {
      return response(res, 404, "Status not found");
    }

    // FIX: was comparing .toString() !== userId (missing toString on userId)
    if (status.user.toString() !== userId.toString()) {
      return response(res, 403, "You are not authorized to delete this status");
    }

    await status.deleteOne();

    if (req.io && req.socketUserMap) {
      for (const [connectedUserId, socketId] of req.socketUserMap) {
        if (connectedUserId !== String(userId)) {
          req.io.to(socketId).emit("status_deleted", statusId);
        }
      }
    }

    // FIX: was return res.status(res, 201, ...) — res.status takes a number not res
    return response(res, 200, "Status deleted successfully");
  } catch (error) {
    console.log("Error on deleteStatus controller", error.message);
    return response(res, 500, "Internal server Error");
  }
};
