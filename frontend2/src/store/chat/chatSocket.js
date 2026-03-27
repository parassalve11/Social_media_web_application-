// src/store/chat/chatSocket.js
import { store } from "../index";
import { getSocket } from "../../services/chat.service";
import {
  addMessage,
  updateMessageStatus,
  deleteMessageLocal,
  updateReactions,
  setTypingUser,
  setUserStatus,
} from "./chatSlice";

export const initializeChatSocket = () => {
  const socket = getSocket();
  if (!socket) return;

  // prevent duplicate listeners
  socket.off("send_message");
  socket.off("receive_message");
  socket.off("message_status_update");
  socket.off("reaction_update");
  socket.off("mesage_delected");
  socket.off("message_deleted");
  socket.off("message_error");
  socket.off("user_typing");
  socket.off("user_status");

  socket.on("receive_message", (message) => {
    if (!message?._id) return;
    const state = store.getState();
    const currentConversation = state.chat.currentConversation;
    const conversationId = message?.conversation?._id ?? message?.conversation;
    if (currentConversation && conversationId) {
      if (String(conversationId) !== String(currentConversation)) return;
    }

    const exists = state.chat.messages?.some(
      (m) => String(m._id) === String(message._id)
    );
    if (!exists) {
      store.dispatch(addMessage(message));
    }
  });

  socket.on("message_status_update", ({ messageId, messageStatus }) => {
    store.dispatch(
      updateMessageStatus({ messageId, messageStatus })
    );
  });

  socket.on("reaction_update", ({ messageId, reactions }) => {
    if (messageId && Array.isArray(reactions)) {
      store.dispatch(updateReactions({ messageId, reactions }));
    }
  });

  const handleMessageDeleted = (payload) => {
    const messageId =
      typeof payload === "string"
        ? payload
        : payload?.messageId || payload?.deletetMessageId;
    if (messageId) {
      store.dispatch(deleteMessageLocal(messageId));
    }
  };

  socket.on("mesage_delected", handleMessageDeleted);
  socket.on("message_deleted", handleMessageDeleted);

  socket.on("user_typing", (payload) => {
    store.dispatch(setTypingUser(payload));
  });

  socket.on("user_status", (payload) => {
  console.log("🟢 USER STATUS SOCKET PAYLOAD:", payload);
  store.dispatch(setUserStatus(payload));
});


  socket.on("message_error", (err) => {
    console.error("socket message error", err);
  });
};
