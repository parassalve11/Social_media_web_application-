// src/store/chat/chatSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  conversations: null,
  currentConversation: null,
  currentUser: null,
  messages: [],
  loading: false,
  error: null,

  // maps replaced with plain objects (redux-safe)
  onlineUsers: {},
  typingUsers: {},
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setCurrentUser: (state, action) => {
      state.currentUser = action.payload;
    },

    setConversations: (state, action) => {
      state.conversations = action.payload;
    },

    setMessages: (state, action) => {
      state.messages = action.payload;
    },

    setCurrentConversation: (state, action) => {
      state.currentConversation = action.payload;
    },

    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },

    replaceMessage: (state, action) => {
      const { tempId, message } = action.payload;
      state.messages = state.messages.map((m) =>
        m._id === tempId ? message : m
      );
    },

    updateMessageStatus: (state, action) => {
      const { messageId, messageStatus } = action.payload;
      state.messages = state.messages.map((m) =>
        m._id === messageId ? { ...m, messageStatus } : m
      );
    },
    updateMediaProgress: (state, action) => {
      const { messageId, index, progress } = action.payload;

      const msg = state.messages.find((m) => m._id === messageId);
      if (!msg || !msg.uploadProgress) return;

      msg.uploadProgress[index].progress = progress;
    },

    deleteMessageLocal: (state, action) => {
      state.messages = state.messages.filter((m) => m._id !== action.payload);
    },

    updateReactions: (state, action) => {
      const { messageId, reactions } = action.payload;
      state.messages = state.messages.map((m) =>
        m._id?.toString() === messageId?.toString() ? { ...m, reactions } : m
      );
    },

    setTypingUser: (state, action) => {
      const { conversationId, userId, isTyping } = action.payload;

      if (!state.typingUsers[conversationId]) {
        state.typingUsers[conversationId] = [];
      }

      state.typingUsers[conversationId] = isTyping
        ? Array.from(new Set([...state.typingUsers[conversationId], userId]))
        : state.typingUsers[conversationId].filter((id) => id !== userId);
    },

    setUserStatus: (state, action) => {
      const { userId, isOnline, lastSeen } = action.payload;
      state.onlineUsers[userId] = { isOnline, lastSeen };
    },

    resetChat: () => initialState,
    clearMessages: (state) => {
      state.messages = [];
      state.currentConversation = null;
    },
  },
});

export const {
  setCurrentUser,
  setConversations,
  setMessages,
  setCurrentConversation,
  addMessage,
  replaceMessage,
  updateMessageStatus,
  deleteMessageLocal,
  updateReactions,
  setTypingUser,
  setUserStatus,
  updateMediaProgress,
  resetChat,
  clearMessages,
} = chatSlice.actions;

export default chatSlice.reducer;
