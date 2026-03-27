"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../lib/axiosIntance";
import { getSocket } from "../../services/chat.service";

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */

/** Group flat status array by user._id */
export const groupStatusesByUser = (statuses = []) => {
  const map = new Map();

  for (const s of statuses) {
    const uid = s.user?._id ?? s.user;
    if (!uid) continue;

    if (!map.has(uid)) {
      map.set(uid, {
        user: s.user,
        statuses: [],
        hasUnseen: false,
      });
    }

    const entry = map.get(uid);
    entry.statuses.push(s);
  }

  return Array.from(map.values());
};

/** Returns true if the current user has NOT viewed all statuses for this group */
export const hasUnseenStatus = (group, currentUserId) =>
  group.statuses.some(
    (s) =>
      !s.viewers?.some(
        (v) => String(v?._id ?? v) === String(currentUserId)
      )
  );

/* ─────────────────────────────────────────────
   Hook
───────────────────────────────────────────── */

export const useStatus = (currentUserId) => {
  const queryClient = useQueryClient();

  /* ── Fetch all active statuses ── */
  const {
    data: statuses = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["statuses"],
    queryFn: async () => {
      const res = await axiosInstance.get("/status");
      return res?.data?.data ?? [];
    },
    staleTime: 30_000,
    refetchInterval: 60_000, // re-poll every minute (statuses expire in 24h)
  });

  /* ── Grouped by user ── */
  const grouped = groupStatusesByUser(statuses).map((g) => ({
    ...g,
    hasUnseen: hasUnseenStatus(g, currentUserId),
  }));

  /* ── Create status ── */
  const { mutateAsync: createStatus, isPending: isCreating } = useMutation({
    mutationFn: async (formData) => {
      const res = await axiosInstance.post("/status", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res?.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["statuses"] });
    },
  });

  /* ── View status ── */
  const { mutateAsync: viewStatus } = useMutation({
    mutationFn: async (statusId) => {
      const res = await axiosInstance.put(`/status/${statusId}/view`);
      return res?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["statuses"] });
    },
  });

  /* ── Delete status ── */
  const { mutateAsync: deleteStatus } = useMutation({
    mutationFn: async (statusId) => {
      const res = await axiosInstance.delete(`/status/${statusId}`);
      return res?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["statuses"] });
    },
  });

  /* ── Real-time socket updates ── */
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onNewStatus = () => {
      queryClient.invalidateQueries({ queryKey: ["statuses"] });
    };
    const onStatusDeleted = () => {
      queryClient.invalidateQueries({ queryKey: ["statuses"] });
    };
    const onStatusViewed = () => {
      queryClient.invalidateQueries({ queryKey: ["statuses"] });
    };

    socket.on("new_status", onNewStatus);
    socket.on("status_deleted", onStatusDeleted);
    socket.on("status_viewed", onStatusViewed);

    return () => {
      socket.off("new_status", onNewStatus);
      socket.off("status_deleted", onStatusDeleted);
      socket.off("status_viewed", onStatusViewed);
    };
  }, [queryClient]);

  return {
    statuses,
    grouped,
    isLoading,
    error,
    refetch,
    createStatus,
    isCreating,
    viewStatus,
    deleteStatus,
  };
};
