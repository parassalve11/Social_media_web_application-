// frontend/src/store/notifications/useNotifications.js
"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../lib/axiosIntance";
import { getSocket } from "../../services/chat.service";

/* ─── fetch all notifications ─── */
export const useNotifications = () =>
  useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await axiosInstance.get("/notifications");
      return res.data ?? [];
    },
    staleTime: 30_000,
  });

/* ─── unread count ─── */
export const useUnreadCount = () =>
  useQuery({
    queryKey: ["unreadNotifications"],
    queryFn: async () => {
      const res = await axiosInstance.get("/notifications/unread-count");
      return res.data?.count ?? 0;
    },
    refetchInterval: 60_000,
  });

/* ─── mark one as read ─── */
export const useMarkAsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => axiosInstance.put(`/notifications/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["unreadNotifications"] });
    },
  });
};

/* ─── mark ALL as read ─── */
export const useMarkAllAsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => axiosInstance.put("/notifications/mark-all-read"),
    // Optimistic update — flip every item in cache immediately
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["notifications"] });
      const prev = qc.getQueryData(["notifications"]);
      qc.setQueryData(["notifications"], (old) =>
        Array.isArray(old) ? old.map((n) => ({ ...n, read: true })) : old
      );
      qc.setQueryData(["unreadNotifications"], 0);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      qc.setQueryData(["notifications"], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["unreadNotifications"] });
    },
  });
};

/* ─── delete one ─── */
export const useDeleteNotification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => axiosInstance.delete(`/notifications/${id}`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["notifications"] });
      const prev = qc.getQueryData(["notifications"]);
      qc.setQueryData(["notifications"], (old) =>
        Array.isArray(old) ? old.filter((n) => n._id !== id) : old
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      qc.setQueryData(["notifications"], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["unreadNotifications"] });
    },
  });
};

/* ─── Real-time socket listener ─── 
   Mount once at app level or inside NotificationPage.
   Injects new_notification straight into the query cache — no refetch. */
export const useNotificationSocket = (onNewNotification) => {
  const qc      = useQueryClient();
  const socket  = getSocket();             // shared app socket

  useEffect(() => {
    if (!socket) return;

    const handler = (notification) => {
      // Prepend to existing cache
      qc.setQueryData(["notifications"], (old) =>
        Array.isArray(old) ? [notification, ...old] : [notification]
      );
      // Bump unread count
      qc.setQueryData(["unreadNotifications"], (old) =>
        typeof old === "number" ? old + 1 : 1
      );
      // Trigger toast callback if provided
      onNewNotification?.(notification);
    };

    socket.on("new_notification", handler);
    return () => socket.off("new_notification", handler);
  }, [socket, qc, onNewNotification]);
};
