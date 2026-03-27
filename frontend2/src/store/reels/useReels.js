// frontend/src/store/reels/useReels.js
"use client";

import { useCallback } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axiosInstance from "../../lib/axiosIntance";

/* ─────────────────────────────────────────────────────────
   Feed (infinite scroll)
───────────────────────────────────────────────────────── */
export const useReelFeed = () => {
  return useInfiniteQuery({
    queryKey: ["reels", "feed"],
    queryFn: async ({ pageParam = null }) => {
      const params = { limit: 10 };
      if (pageParam) params.cursor = pageParam;
      const res = await axiosInstance.get("/reels/feed", { params });
      return res?.data?.data ?? { reels: [], nextCursor: null, hasMore: false };
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    staleTime: 60_000,
  });
};

/* ─────────────────────────────────────────────────────────
   User reels (profile grid)
───────────────────────────────────────────────────────── */
export const useUserReels = (userId) => {
  return useQuery({
    queryKey: ["reels", "user", userId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/reels/user/${userId}`);
      return res?.data?.data ?? [];
    },
    enabled: Boolean(userId),
    staleTime: 60_000,
  });
};

/* ─────────────────────────────────────────────────────────
   Create reel
───────────────────────────────────────────────────────── */
export const useCreateReel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData) => {
      const res = await axiosInstance.post("/reels/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res?.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reels"] });
    },
  });
};

/* ─────────────────────────────────────────────────────────
   Delete reel
───────────────────────────────────────────────────────── */
export const useDeleteReel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reelId) => {
      await axiosInstance.delete(`/reels/${reelId}`);
      return reelId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reels"] });
    },
  });
};

/* ─────────────────────────────────────────────────────────
   Like reel (optimistic update)
───────────────────────────────────────────────────────── */
export const useLikeReel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reelId) => {
      const res = await axiosInstance.post(`/reels/${reelId}/like`);
      return res?.data?.data;
    },
    onMutate: async (reelId) => {
      await queryClient.cancelQueries({ queryKey: ["reels", "feed"] });
      const previous = queryClient.getQueryData(["reels", "feed"]);
      // Optimistic toggle in infinite pages
      queryClient.setQueryData(["reels", "feed"], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            reels: page.reels.map((r) =>
              r._id === reelId
                ? { ...r, likesCount: (r.likesCount ?? r.likes?.length ?? 0) + 1 }
                : r
            ),
          })),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["reels", "feed"], ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["reels", "feed"] });
    },
  });
};

/* ─────────────────────────────────────────────────────────
   Comment reel
───────────────────────────────────────────────────────── */
export const useCommentReel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ reelId, content }) => {
      const res = await axiosInstance.post(`/reels/${reelId}/comment`, { content });
      return res?.data?.data;
    },
    onSuccess: (_data, { reelId }) => {
      queryClient.invalidateQueries({ queryKey: ["reels", "comments", reelId] });
    },
  });
};

/* ─────────────────────────────────────────────────────────
   View reel
───────────────────────────────────────────────────────── */
export const useViewReel = () => {
  const viewed = new Set();
  return useCallback(
    async (reelId) => {
      if (viewed.has(reelId)) return;
      viewed.add(reelId);
      try {
        await axiosInstance.put(`/reels/${reelId}/view`);
      } catch {
        // silently fail — not critical
      }
    },
    []
  );
};

/* ─────────────────────────────────────────────────────────
   Comments for a reel
───────────────────────────────────────────────────────── */
export const useReelComments = (reelId) => {
  return useQuery({
    queryKey: ["reels", "comments", reelId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/reels/${reelId}/comments`);
      return res?.data?.data ?? [];
    },
    enabled: Boolean(reelId),
  });
};
