// src/store/chat/chatThunks.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from '../../lib/axiosIntance'
import {
  setConversations,
  setMessages,
  setCurrentConversation,
  addMessage,
  replaceMessage,
  updateMessageStatus,
  updateMediaProgress,
} from "./chatSlice";
import { getSocket } from "../../services/chat.service";

export const fetchConversations = createAsyncThunk(
  "chat/fetchConversations",
  async (_, { dispatch }) => {
    const { data } = await axiosInstance.get("/message/conversations");
    const conversations = data?.data || data || [];
    dispatch(setConversations(conversations));
    return conversations;
  }
);

export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async (conversationId, { dispatch }) => {
    const { data } = await axiosInstance.get(
      `/message/conversation/${conversationId}/messages`
    );

    const messages = data?.data || data || [];
    dispatch(setMessages(messages));
    dispatch(setCurrentConversation(conversationId));
    return messages;
  }
);

export const sendMessage = createAsyncThunk(
  "chat/sendMessage",
  async (formData, { dispatch, getState }) => {
    const { currentConversation } = getState().chat;

    const senderId = formData.get("senderId");
    const receiverId = formData.get("receiverId");
    const content = formData.get("content");
    const messageStatus = formData.get("messageStatus") || "send";

    const mediaFiles = formData.getAll("media");
    const hasMedia = mediaFiles.length > 0;
    const tempId = `temp-${Date.now()}`;

    // Optimistic preview
    const previewUrls = hasMedia
      ? mediaFiles.map((file) => URL.createObjectURL(file))
      : [];

    const contentType = hasMedia
      ? mediaFiles[0].type.startsWith("video/")
        ? "video"
        : "image"
      : "text";

    dispatch(
      addMessage({
        _id: tempId,
        sender: senderId,
        receiver: receiverId,
        conversation: currentConversation,
        imageOrVideoUrl: previewUrls,
        content,
        contentType,
        createdAt: new Date().toISOString(),
        messageStatus,
        isOptimistic: true,
        isUploading: hasMedia,
        uploadProgress: hasMedia
          ? mediaFiles.map((_, i) => ({ index: i, progress: 0 }))
          : [],
      })
    );

    try {
      const { data } = await axiosInstance.post(
        "/message/send-message",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (event) => {
            if (!event.total || !hasMedia) return;
            const percent = Math.round((event.loaded * 100) / event.total);
            for (let i = 0; i < mediaFiles.length; i++) {
              dispatch(
                updateMediaProgress({
                  messageId: tempId,
                  index: i,
                  progress: percent,
                })
              );
            }
          },
        }
      );

      const savedMessage = data?.data || null;
      const finalMessage = savedMessage || {
        _id: tempId,
        sender: senderId,
        receiver: receiverId,
        conversation: currentConversation,
        imageOrVideoUrl: [],
        content,
        contentType,
        createdAt: new Date().toISOString(),
        messageStatus: "send",
      };

      if (
        savedMessage?.conversation &&
        (!currentConversation ||
          String(savedMessage.conversation) !== String(currentConversation))
      ) {
        dispatch(setCurrentConversation(savedMessage.conversation));
      }

      dispatch(
        replaceMessage({
          tempId,
          message: { ...finalMessage, isUploading: false },
        })
      );

      // cleanup preview URLs
      previewUrls.forEach((url) => URL.revokeObjectURL(url));

      return finalMessage;
    } catch (error) {
      dispatch(
        updateMessageStatus({
          messageId: tempId,
          messageStatus: "failed",
        })
      );
      throw error;
    }
  }
);

export const deleteMessage = createAsyncThunk(
  "chat/deleteMessage",
  async (messageId) => {
    await axiosInstance.delete(`/message/messages/${messageId}`);
    return messageId;
  }
);

export const markMessagesAsRead = createAsyncThunk(
  "chat/markRead",
  async (_, { getState }) => {
    const { messages, currentUser } = getState().chat;

    const unread = messages.filter(
      (m) =>
        m.messageStatus !== "read" &&
        m?.receiver?._id === currentUser?._id
    );

    if (!unread.length) return;

    await axiosInstance.put("/message/messages/read", {
      messageIds: unread.map((m) => m._id),
    });

    const socket = getSocket();
    socket?.emit("message_read", {
      messageIds: unread.map((m) => m._id),
      senderId: messages[0]?.sender?._id,
    });
  }
);
