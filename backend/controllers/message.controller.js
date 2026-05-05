import mongoose from "mongoose";
import { uploadToClouduinary } from "../lib/cloudinary.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import response from "../lib/responeHandler.js";

export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user?._id?.toString();
    const { receiverId, content, messageStatus } = req.body;
    const files = req.files;
    const participants = [senderId, String(receiverId || "")].sort();

    if (!senderId) {
      return response(res, 401, "Unauthorized");
    }

    if (!receiverId || !mongoose.isValidObjectId(receiverId)) {
      return response(res, 400, "A valid receiver is required");
    }

    if (senderId === String(receiverId)) {
      return response(res, 400, "You cannot send a message to yourself");
    }

    let conversation = await Conversation.findOne({
      participants: { $all: participants },
    });
    if (!conversation) {
      conversation = await Conversation.create({ participants });
    }

    let imageOrVideoUrl = [];
    let contentType = null;

    if (files && files.length > 0) {
      for (const file of files) {
        const upload = await uploadToClouduinary(file);
        if (!upload?.secure_url) {
          return response(res, 400, "File upload failed");
        }

        imageOrVideoUrl.push(upload.secure_url);

        if (file.mimetype.startsWith("image/")) {
          contentType = "image";
        } else if (file.mimetype.startsWith("video/")) {
          contentType = "video";
        } else {
          return response(res, 400, "Unsupported file type");
        }
      }
    } else if (content?.trim()) {
      contentType = "text";
    } else {
      return response(res, 400, "Message content is required");
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      receiver: receiverId,
      content,
      imageOrVideoUrl,
      contentType,
      messageStatus,
    });

    conversation.lastMessage = message._id;
    conversation.unreadCount += 1;
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "username profilePicture")
      .populate("receiver", "username profilePicture");

    if (req.io && req.socketUserMap) {
      const senderSocketId = req.socketUserMap.get(String(senderId));
      const receiverSocketId = req.socketUserMap.get(String(receiverId));

      if (senderSocketId) {
        req.io.to(senderSocketId).emit("send_message", populatedMessage);
      }

      if (receiverSocketId) {
        req.io.to(receiverSocketId).emit("receive_message", populatedMessage);
      }
    }

    return response(res, 201, "Message sent", populatedMessage);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

export const getConversation = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversation = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "username profilePicture lastSeen isOnline ")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender receiver",
          select: "username profilePicture",
        },
      })
      .sort({ updatedAt: -1 });

    return response(res, 201, "conversation get successfully", conversation);
  } catch (error) {
    console.log("Error on getConversation controller", error.message);
    return response(res, 500, "Internal server Error");
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return response(res, 404, "Conversation not Found");
    }

    const isParticipant = conversation.participants.some(
      (participantId) => participantId.toString() === userId.toString()
    );
    if (!isParticipant) {
      return response(
        res,
        403,
        "Your not authorized to access this conversation"
      );
    }

    const messages = await Message.find({
      conversation: conversationId,
    })
      .populate("sender", "username profilePicture lastSeen isOnline")
      .populate("receiver", "username profilePicture lastSeen isOnline")
      .sort({ createdAt: 1 });

    await Message.updateMany(
      {
        conversation: conversationId,
        receiver: userId,
        messageStatus: { $in: ["send", "delivered"] },
      },
      {
        $set: { messageStatus: "read" },
      }
    );

    conversation.unreadCount = 0;
    await conversation.save();

    return response(res, 201, "Mesages retrived", messages);
  } catch (error) {
    console.log("Error on getMessages controller", error.message);
    return response(res, 500, "Internal server Error");
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { messageIds } = req.body;
    const userId = req.user._id;

    const messages = await Message.find({
      _id: { $in: messageIds },
      receiver: userId,
    });

    await Message.updateMany(
      {
        _id: { $in: messageIds },
        receiver: userId,
      },
      { $set: { messageStatus: "read" } }
    );

    if (req.io && req.socketUserMap) {
      for (const message of messages) {
        const senderSocketId = req.socketUserMap.get(message.sender.toString());
        if (senderSocketId) {
          const updatedMessage = {
            _id: message._id,
            messageStatus: "read",
          };

          req.io.to(senderSocketId).emit("message_read", updatedMessage);

          await message.save();
        }
      }
    }

    return response(res, 201, "mark as readed", messages);
  } catch (error) {
    console.log("Error on markAsRead controller", error.message);
    return response(res, 500, "Internal server Error");
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
      return response(res, 404, "Message not Found");
    }

    if (message.sender.toString() !== userId.toString()) {
      return response(res, 403, "Not authorized to delete this message");
    }

    await message.deleteOne();

    if (req.io && req.socketUserMap) {
      const receiverSocketId = req.socketUserMap.get(message.receiver.toString());
      if (receiverSocketId) {
        req.io.to(receiverSocketId).emit("message_deleted", messageId);
      }
    }

    return response(res, 201, "Message deleted successfully");
  } catch (error) {
    console.log("Error on deleteMessage controller", error.message);
    return response(res, 500, "Internal server Error");
  }
};
