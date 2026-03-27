import { io } from "socket.io-client";
import { store } from "../store";

let socket = null;

export const initializeSocket = () => {
  if (socket) return socket;

  const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

  socket = io(BACKEND_URL, {
    withCredentials: true,
    transports: ["websocket", "polling"],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    console.log("Socket is connected on", socket.id);

    const state = store.getState();
    const user = state.user?.user;

    if (user?._id) {
      socket.emit("user_connected", user._id);
    } else {
      console.warn("User not ready, socket connected without userId");
    }
  });

  socket.on("connect_error", (error) => {
    console.log("Socket error", error);
  });

  socket.on("disconnect", (reason) => {
    console.log("Scoket is disconnected", reason);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
