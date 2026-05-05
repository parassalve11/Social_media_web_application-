"use client";

import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { initializeSocket, disconnectSocket } from "../services/chat.service";
import { initializeChatSocket } from "../store/chat/chatSocket";
import { useChat } from "../store/chat/useChat";

const SocketInitializer = () => {
  const user = useSelector((state) => state.user.user);
  const { setCurrentUser, cleanUp } = useChat();
  const startedRef = useRef(false);
  const prevUserIdRef = useRef(null);

  useEffect(() => {
    const userId = user?._id ?? null;

    // If there is a logged-in user and socket not started yet -> start
    if (userId && !startedRef.current) {
      const socket = initializeSocket();
      if (socket) {
        startedRef.current = true;
        setCurrentUser(user);
        initializeChatSocket();
      }
      prevUserIdRef.current = userId;
      return;
    }

    // If socket already started and only user details changed (same id) -> update current user in chat store
    if (startedRef.current && userId && prevUserIdRef.current === userId) {
      setCurrentUser(user); // do NOT disconnect/re-init socket
      return;
    }

    // If user logged out (no userId) and socket was running -> cleanup and disconnect
    if (!userId && startedRef.current) {
      cleanUp();
      disconnectSocket();
      startedRef.current = false;
      prevUserIdRef.current = null;
      return;
    }

    // update previous user id for future comparisons
    prevUserIdRef.current = userId;

    // On unmount: only disconnect if we started
    return () => {
      if (startedRef.current) {
        cleanUp();
        disconnectSocket();
        startedRef.current = false;
        prevUserIdRef.current = null;
      }
    };
  }, [user?._id, setCurrentUser, cleanUp]);

  return null;
};

export default SocketInitializer;
