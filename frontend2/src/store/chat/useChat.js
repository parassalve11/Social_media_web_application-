//useChat
"use client";

import { useDispatch, useSelector } from "react-redux";
import {
  setCurrentUser,
  setCurrentConversation,
  resetChat,
  clearMessages,
} from "./chatSlice";

import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  deleteMessage,
  markMessagesAsRead,
} from "./chatThunks";

import { getSocket } from "../../services/chat.service";

export const useChat = () => {
  const dispatch = useDispatch();

  // ✅ entire chat state (like Zustand)
  const chat = useSelector((state) => state.chat);

  return {
    /* ---------- STATE ---------- */
    conversations: chat.conversations,
    currentConversation: chat.currentConversation,
    currentUser: chat.currentUser,
    messages: chat.messages,
    loading: chat.loading,
    error: chat.error,
    typingUsers: chat.typingUsers,
    onlineUsers: chat.onlineUsers,

    /* ---------- ACTIONS ---------- */
    setCurrentUser: (user) => dispatch(setCurrentUser(user)),

    setCurrentConversation: (conversationId) =>
      dispatch(setCurrentConversation(conversationId)),

    fetchConversations: () => dispatch(fetchConversations()),

    fetchMessages: (conversationId) => dispatch(fetchMessages(conversationId)),

    sendMessage: (formData) => dispatch(sendMessage(formData)).unwrap(),

    deleteMessage: (messageId) => dispatch(deleteMessage(messageId)),

    markMessageAsRead: () => dispatch(markMessagesAsRead()),

    cleanUp: () => dispatch(resetChat()),
    clearMessages: () => dispatch(clearMessages()),

    /* ---------- SOCKET HELPERS ---------- */
    addReaction: (messageId, emoji) => {
      const socket = getSocket();
      if (!socket || !chat.currentUser) return;

      socket.emit("add_reaction", {
        messageId,
        emoji,
        userId: chat.currentUser._id,
      });
    },

    startTyping: (receiverId) => {
      const socket = getSocket();
      if (!socket || !chat.currentConversation) return;

      socket.emit("typing_start", {
        conversationId: chat.currentConversation,
        receiverId,
      });
    },
    deleteMessageSocket: (messageId) => {
      const socket = getSocket();
      const conversationId = chat.currentConversation;
      socket?.emit("delete_message", { messageId, conversationId });
    },

    stopTyping: (receiverId) => {
      const socket = getSocket();
      if (!socket || !chat.currentConversation) return;

      socket.emit("typing_stop", {
        conversationId: chat.currentConversation,
        receiverId,
      });
    },

    isTypingUser: (userId) => {
      const list = chat.typingUsers?.[chat.currentConversation] || [];
      return list.includes(userId);
    },

    isUserOnline: (userId) => {
      return chat.onlineUsers?.[userId]?.isOnline || false;
    },

    getUserLastSeen: (userId) => {
      return chat.onlineUsers?.[userId]?.lastSeen || null;
    },
  };
};
