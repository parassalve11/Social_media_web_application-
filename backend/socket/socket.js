import { Server } from "socket.io";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import Post from "../models/post.model.js";

// Map to find user is online or not -> userId, socketId
let onlineUsers = new Map();

// Map to track typing status of users in conversation --> userId, [conversation]
let typingStatus = new Map();

// Map to track active calls -> callId, { callerId, receiverId, callType, status }
let activeCalls = new Map();

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
      methods: ["GET", "PUT", "POST", "DELETE", "OPTIONS"],
    },
    pingTimeout: 60000,
  });

  io.on("connection", (socket) => {
    console.log("User is connected to SocketId", socket.id);

    let userId = null;

    // ══════════════════════════════════════════════════
    //  USER CONNECTION
    // ══════════════════════════════════════════════════
    try {
      socket.on("user_connected", async (connectionUserId) => {
        if (!connectionUserId) {
          console.warn("❌ user_connected called without userId");
          return;
        }

        userId = connectionUserId;
        onlineUsers.set(userId, socket.id);
        socket.join(userId);

        await User.findByIdAndUpdate(userId, {
          isOnline: true,
          lastSeen: new Date(),
        });

        io.emit("user_status", {
          userId,
          isOnline: true,
          lastSeen: null,
        });
      });
    } catch (error) {
      console.error("Error while establishing user connection in socket", error.message);
    }

    // ══════════════════════════════════════════════════
    //  ONLINE STATUS
    // ══════════════════════════════════════════════════
    socket.on("get_user_status", (requestUserId, callback) => {
      const isOnline = onlineUsers.has(requestUserId);
      callback({
        userId: requestUserId,
        isOnline,
        lastSeen: isOnline ? new Date() : null,
      });
    });

    // ══════════════════════════════════════════════════
    //  MESSAGING
    // ══════════════════════════════════════════════════
    socket.on("send_message", async (message) => {
      try {
        const senderSocketId = onlineUsers.get(message?.sender?._id);
        const receiverSocketId = onlineUsers.get(message?.receiver?._id);
        if (senderSocketId) io.to(senderSocketId).emit("send_message", message);
        if (receiverSocketId) io.to(receiverSocketId).emit("receive_message", message);
      } catch (error) {
        console.error("Error while sending message in socket", error.message);
        socket.emit("message_error", { error: "Failed to send message" });
      }
    });

    socket.on("message_read", async ({ messageIds, senderId }) => {
      try {
        await Message.updateMany(
          { _id: { $in: messageIds } },
          { $set: { messageStatus: "read" } }
        );
        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId) {
          messageIds.forEach((messageId) => {
            io.to(senderSocketId).emit("message_status_update", {
              messageId,
              messageStatus: "read",
            });
          });
        }
      } catch (error) {
        console.error("Error updating message status in socket", error.message);
      }
    });

    // ══════════════════════════════════════════════════
    //  TYPING
    // ══════════════════════════════════════════════════
    socket.on("typing_start", ({ conversationId, receiverId }) => {
      if (!userId || !conversationId || !receiverId) return;
      if (!typingStatus.has(userId)) typingStatus.set(userId, {});
      const userTyping = typingStatus.get(userId);
      userTyping[conversationId] = true;
      if (userTyping[`${conversationId}_timeout`]) {
        clearTimeout(userTyping[`${conversationId}_timeout`]);
      }
      userTyping[`${conversationId}_timeout`] = setTimeout(() => {
        userTyping[conversationId] = false;
        socket.to(receiverId).emit("user_typing", { userId, conversationId, isTyping: false });
      }, 2000);
      socket.to(receiverId).emit("user_typing", { userId, conversationId, isTyping: true });
    });

    socket.on("typing_stop", ({ conversationId, receiverId }) => {
      if (!userId || !conversationId || !receiverId) return;
      if (typingStatus.has(userId)) {
        const userTyping = typingStatus.get(userId);
        userTyping[conversationId] = false;
        if (userTyping[`${conversationId}_timeout`]) {
          clearTimeout(userTyping[`${conversationId}_timeout`]);
          delete userTyping[`${conversationId}_timeout`];
        }
      }
      socket.to(receiverId).emit("user_typing", { userId, conversationId, isTyping: false });
    });

    // ══════════════════════════════════════════════════
    //  MESSAGE ACTIONS (delete, react)
    // ══════════════════════════════════════════════════
    socket.on("delete_message", async ({ messageId, conversationId }) => {
      try {
        await Message.findByIdAndDelete(messageId);
        const users = io.socketUserMap;
        users.forEach((socketId) => {
          io.to(socketId).emit("message_deleted", { messageId, conversationId });
        });
      } catch (err) {
        console.error("Delete message socket error", err.message);
      }
    });

    socket.on("add_reaction", async ({ messageId, emoji, userId: reactionUserId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;
        const existingIndex = message.reactions.findIndex(
          (r) => r.user.toString() === reactionUserId
        );
        if (existingIndex > -1) {
          if (message.reactions[existingIndex].emoji === emoji) {
            message.reactions.splice(existingIndex, 1);
          } else {
            message.reactions[existingIndex].emoji = emoji;
          }
        } else {
          message.reactions.push({ user: reactionUserId, emoji });
        }
        await message.save();
        const populatedMessage = await Message.findById(message._id)
          .populate("sender", "username profilePhoto")
          .populate("receiver", "username profilePhoto")
          .populate("reactions.user", "username profilePhoto");
        const payload = { messageId: populatedMessage._id, reactions: populatedMessage.reactions };
        const senderSocket = onlineUsers.get(populatedMessage.sender._id.toString());
        const receiverSocket = onlineUsers.get(populatedMessage.receiver._id.toString());
        if (senderSocket) io.to(senderSocket).emit("reaction_update", payload);
        if (receiverSocket) io.to(receiverSocket).emit("reaction_update", payload);
      } catch (error) {
        console.error("Error handling reactions in socket", error.message);
      }
    });

    // ══════════════════════════════════════════════════
    //  FOLLOW / UNFOLLOW
    // ══════════════════════════════════════════════════
    socket.on("follow_user", async ({ followerId, followedId }) => {
      try {
        if (!followedId || !followerId) return;
        const followedSocketId = onlineUsers.get(followedId);
        if (followedSocketId) {
          io.to(followedSocketId).emit("follow_event", { followerId, followedId, type: "follow" });
        }
      } catch (error) {
        console.error("Socket follow error:", error.message);
      }
    });

    socket.on("unfollow_user", async ({ followerId, followedId }) => {
      try {
        if (!followedId || !followerId) return;
        const followedSocketId = onlineUsers.get(followedId);
        if (followedSocketId) {
          io.to(followedSocketId).emit("unfollow_event", { followerId, followedId, type: "unfollow" });
        }
      } catch (error) {
        console.error("Socket unfollow error:", error.message);
      }
    });

    // ══════════════════════════════════════════════════
    //  POST INTERACTIONS
    // ══════════════════════════════════════════════════
    socket.on("like_post", async ({ postId, userId: likeUserId, action }) => {
      try {
        if (!postId || !likeUserId) return;
        const post = await Post.findById(postId).populate("author", "_id");
        if (!post) return;
        if (post.author._id.toString() !== likeUserId) {
          const authorSocketId = onlineUsers.get(post.author._id.toString());
          if (authorSocketId) {
            io.to(authorSocketId).emit("post_liked", { postId, userId: likeUserId, action, likesCount: post.likes.length });
          }
        }
        socket.broadcast.emit("post_interaction", { postId, userId: likeUserId, type: "like", action, likesCount: post.likes.length });
      } catch (error) {
        console.error("Socket like error:", error.message);
      }
    });

    socket.on("bookmark_post", async ({ postId, userId: bookmarkUserId, action }) => {
      try {
        if (!postId || !bookmarkUserId) return;
        socket.broadcast.emit("post_interaction", { postId, userId: bookmarkUserId, type: "bookmark", action });
      } catch (error) {
        console.error("Socket bookmark error:", error.message);
      }
    });

    socket.on("comment_post", async ({ postId, userId: commentUserId, comment }) => {
      try {
        if (!postId || !commentUserId || !comment) return;
        const post = await Post.findById(postId).populate("author", "_id");
        if (!post) return;
        if (post.author._id.toString() !== commentUserId) {
          const authorSocketId = onlineUsers.get(post.author._id.toString());
          if (authorSocketId) {
            io.to(authorSocketId).emit("post_commented", { postId, userId: commentUserId, comment, commentsCount: post.comments.length });
          }
        }
        socket.broadcast.emit("post_interaction", { postId, userId: commentUserId, type: "comment", comment, commentsCount: post.comments.length });
      } catch (error) {
        console.error("Socket comment error:", error.message);
      }
    });

    // ══════════════════════════════════════════════════
    //  ████  WEBRTC CALL SIGNALING  ████
    // ══════════════════════════════════════════════════

    /**
     * STEP 1 — Caller initiates a call
     * Payload: { callerId, receiverId, callType: 'video' | 'audio', callerInfo: { name, avatar } }
     */
    socket.on("call:initiate", ({ callerId, receiverId, callType, callerInfo }) => {
      try {
        if (!callerId || !receiverId) return;

        const receiverSocketId = onlineUsers.get(receiverId);

        // Generate a unique call ID
        const callId = `${callerId}-${receiverId}-${Date.now()}`;

        // Check if receiver is already in a call
        const receiverInCall = [...activeCalls.values()].some(
          (c) =>
            (c.callerId === receiverId || c.receiverId === receiverId) &&
            c.status !== "ended"
        );

        if (receiverInCall) {
          socket.emit("call:busy", { callId, receiverId });
          return;
        }

        // Register call in map
        activeCalls.set(callId, {
          callId,
          callerId,
          receiverId,
          callType,
          status: "ringing",
        });

        // Forward to receiver
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("call:incoming", {
            callId,
            callerId,
            callType,
            callerInfo,
          });
        } else {
          // Receiver offline
          socket.emit("call:no_answer", { callId, receiverId });
          activeCalls.delete(callId);
        }

        // Confirm to caller that ring was sent
        socket.emit("call:ringing", { callId });

        console.log(`📞 Call initiated: ${callerId} → ${receiverId} [${callType}] callId:${callId}`);
      } catch (err) {
        console.error("call:initiate error", err.message);
      }
    });

    /**
     * STEP 2a — Receiver accepts
     * Payload: { callId, receiverId }
     */
    socket.on("call:accepted", ({ callId, receiverId }) => {
      try {
        const call = activeCalls.get(callId);
        if (!call) return;

        call.status = "connecting";
        activeCalls.set(callId, call);

        const callerSocketId = onlineUsers.get(call.callerId);
        if (callerSocketId) {
          io.to(callerSocketId).emit("call:accepted", { callId, receiverId });
        }

        console.log(`✅ Call accepted: callId:${callId}`);
      } catch (err) {
        console.error("call:accepted error", err.message);
      }
    });

    /**
     * STEP 2b — Receiver rejects
     * Payload: { callId, reason: 'rejected' | 'busy' }
     */
    socket.on("call:rejected", ({ callId, reason }) => {
      try {
        const call = activeCalls.get(callId);
        if (!call) return;

        call.status = "ended";
        activeCalls.set(callId, call);

        const callerSocketId = onlineUsers.get(call.callerId);
        if (callerSocketId) {
          io.to(callerSocketId).emit("call:rejected", { callId, reason });
        }

        activeCalls.delete(callId);
        console.log(`❌ Call rejected: callId:${callId} reason:${reason}`);
      } catch (err) {
        console.error("call:rejected error", err.message);
      }
    });

    /**
     * STEP 3 — Caller sends WebRTC offer to receiver
     * Payload: { callId, to, offer }
     */
    socket.on("webrtc:offer", ({ callId, to, offer }) => {
      try {
        const targetSocketId = onlineUsers.get(to);
        if (targetSocketId) {
          io.to(targetSocketId).emit("webrtc:offer", {
            callId,
            from: userId,
            offer,
          });
        }
      } catch (err) {
        console.error("webrtc:offer error", err.message);
      }
    });

    /**
     * STEP 4 — Receiver sends WebRTC answer back to caller
     * Payload: { callId, to, answer }
     */
    socket.on("webrtc:answer", ({ callId, to, answer }) => {
      try {
        const targetSocketId = onlineUsers.get(to);
        if (targetSocketId) {
          io.to(targetSocketId).emit("webrtc:answer", {
            callId,
            from: userId,
            answer,
          });
          // Mark call as active
          const call = activeCalls.get(callId);
          if (call) { call.status = "active"; activeCalls.set(callId, call); }
        }
      } catch (err) {
        console.error("webrtc:answer error", err.message);
      }
    });

    /**
     * STEP 5 — ICE candidate exchange (both directions)
     * Payload: { callId, to, candidate }
     */
    socket.on("webrtc:ice-candidate", ({ callId, to, candidate }) => {
      try {
        const targetSocketId = onlineUsers.get(to);
        if (targetSocketId) {
          io.to(targetSocketId).emit("webrtc:ice-candidate", {
            callId,
            from: userId,
            candidate,
          });
        }
      } catch (err) {
        console.error("webrtc:ice-candidate error", err.message);
      }
    });

    /**
     * STEP 6 — Either party ends the call
     * Payload: { callId, to }
     */
    socket.on("call:end", ({ callId, to }) => {
      try {
        const call = activeCalls.get(callId);
        if (call) {
          call.status = "ended";
          activeCalls.delete(callId);
        }

        const targetSocketId = onlineUsers.get(to);
        if (targetSocketId) {
          io.to(targetSocketId).emit("call:ended", { callId });
        }

        console.log(`📴 Call ended: callId:${callId}`);
      } catch (err) {
        console.error("call:end error", err.message);
      }
    });

    /**
     * Call media toggle notifications (optional — keeps remote UI in sync)
     * Payload: { callId, to, muted } / { callId, to, videoOff }
     */
    socket.on("call:toggle-audio", ({ callId, to, muted }) => {
      const targetSocketId = onlineUsers.get(to);
      if (targetSocketId) {
        io.to(targetSocketId).emit("call:remote-audio-toggle", { callId, muted });
      }
    });

    socket.on("call:toggle-video", ({ callId, to, videoOff }) => {
      const targetSocketId = onlineUsers.get(to);
      if (targetSocketId) {
        io.to(targetSocketId).emit("call:remote-video-toggle", { callId, videoOff });
      }
    });

    // ══════════════════════════════════════════════════
    //  DISCONNECT
    // ══════════════════════════════════════════════════
    const handleDisconnect = async () => {
      try {
        if (!userId) return;

        // End any active calls involving this user
        for (const [callId, call] of activeCalls.entries()) {
          if (call.callerId === userId || call.receiverId === userId) {
            const otherId = call.callerId === userId ? call.receiverId : call.callerId;
            const otherSocketId = onlineUsers.get(otherId);
            if (otherSocketId) {
              io.to(otherSocketId).emit("call:ended", { callId, reason: "disconnected" });
            }
            activeCalls.delete(callId);
          }
        }

        onlineUsers.delete(userId);

        if (typingStatus.get(userId)) {
          const userTyping = typingStatus.get(userId);
          Object.keys(userTyping).forEach((key) => {
            if (key.endsWith("_timeout")) clearTimeout(userTyping[key]);
          });
          typingStatus.delete(userId);
        }

        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date(),
        });

        io.emit("user_status", {
          userId,
          isOnline: false,
          lastSeen: new Date(),
        });

        socket.leave(userId);
        console.log(`user ${userId} disconnected`);
      } catch (error) {
        console.error("Error handling disconnection", error.message);
      }
    };

    socket.on("disconnect", handleDisconnect);
  });

  io.socketUserMap = onlineUsers;
  return io;
};