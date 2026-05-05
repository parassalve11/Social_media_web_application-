"use client";

// hooks/usePostActions.js
import { useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../components/UI/ToastManager";
import axiosInstance from "../lib/axiosIntance";
import { getSocket } from "../services/chat.service";
import { useAuthUserSummary } from "../store/user/useUser";

export const usePostActions = (post) => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const authUser = useAuthUserSummary();
  const socket = getSocket();
  const authUserId = authUser?._id ? String(authUser._id) : null;

  const toId = (value) => (value == null ? "" : String(value));
  const hasId = (arr = [], id) => arr.some((item) => toId(item) === toId(id));

  const toggleIdInArray = (arr = [], id) => {
    return hasId(arr, id)
      ? arr.filter((item) => toId(item) !== toId(id))
      : [...arr, id];
  };

  const updatePostCache = (updater) => {
    if (!post?._id) return;
    queryClient.setQueryData(["posts", post._id], (old) =>
      old ? updater(old) : old
    );
  };

  const shouldUpdateList = (queryKey) => {
    const rootKey = Array.isArray(queryKey) ? queryKey[0] : queryKey;
    return ["for-you", "following", "hashtagPosts"].includes(rootKey);
  };

  const updateListCaches = (updater) => {
    const updateInfinite = (data) => {
      if (!data?.pages) return data;
      return {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          posts: Array.isArray(page.posts)
            ? page.posts.map((p) => (p._id === post._id ? updater(p) : p))
            : page.posts,
        })),
      };
    };

    queryClient.setQueriesData(
      { predicate: (query) => shouldUpdateList(query.queryKey) },
      updateInfinite
    );
    queryClient.setQueryData(["bookmark"], (old) => {
      if (!Array.isArray(old)) return old;
      return old.map((p) => (p._id === post._id ? updater(p) : p));
    });
  };

  // Initialize socket listeners
  useEffect(() => {
    if (!socket || !post?._id) return;

    const handlePostLiked = ({ postId }) => {
      if (postId === post._id) {
        queryClient.invalidateQueries({ queryKey: ["posts", postId] });
        queryClient.invalidateQueries({ queryKey: ["for-you"] });
        queryClient.invalidateQueries({ queryKey: ["following"] });
      }
    };

    const handlePostCommented = ({ postId }) => {
      if (postId === post._id) {
        queryClient.invalidateQueries({ queryKey: ["posts", postId] });
        queryClient.invalidateQueries({ queryKey: ["for-you"] });
        queryClient.invalidateQueries({ queryKey: ["following"] });
      }
    };

    const handlePostInteraction = ({ postId }) => {
      if (postId === post._id) {
        queryClient.invalidateQueries({ queryKey: ["posts", postId] });
      }
    };

    socket.on("post_liked", handlePostLiked);
    socket.on("post_commented", handlePostCommented);
    socket.on("post_interaction", handlePostInteraction);

    return () => {
      socket.off("post_liked", handlePostLiked);
      socket.off("post_commented", handlePostCommented);
      socket.off("post_interaction", handlePostInteraction);
    };
  }, [socket, post?._id, queryClient]);

  // Like mutation
  const { mutate: likeMutation, isPending: isLiking } = useMutation({
    mutationFn: async () => await axiosInstance.post(`/posts/${post._id}/like`),
    onMutate: async () => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["posts", post._id] });
      const previousPost = queryClient.getQueryData(["posts", post._id]);
      const previousLists = queryClient.getQueriesData({
        predicate: (query) => shouldUpdateList(query.queryKey),
      });
      const previousBookmarks = queryClient.getQueryData(["bookmark"]);

      if (authUserId) {
        const updater = (p) => ({
          ...p,
          likes: toggleIdInArray(p.likes || [], authUserId),
        });
        updatePostCache(updater);
        updateListCaches(updater);
      }

      return { previousPost, previousLists, previousBookmarks };
    },
    onSuccess: (data) => {
      // Emit socket event
      if (socket && socket.connected && authUserId) {
        const likes = data?.data?.likes;
        const wasLiked = Array.isArray(post?.likes)
          ? post.likes.some((id) => String(id) === authUserId)
          : false;
        const isLiked = Array.isArray(likes)
          ? likes.some((id) => String(id) === authUserId)
          : !wasLiked;
        socket.emit("like_post", {
          postId: post._id,
          userId: authUserId,
          action: isLiked ? "like" : "unlike",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["for-you"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["posts", post._id] });
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousPost) {
        queryClient.setQueryData(["posts", post._id], context.previousPost);
      }
      if (context?.previousLists) {
        context.previousLists.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
      if (context?.previousBookmarks) {
        queryClient.setQueryData(["bookmark"], context.previousBookmarks);
      }
      addToast(error.message || "Failed to like post", {
        type: "error",
        duration: 3000,
      });
    },
  });

  // Bookmark mutation
  const { mutate: bookmarkMutation, isPending: isBookmarking } = useMutation({
    mutationFn: async () => await axiosInstance.post(`/posts/${post._id}/bookmark`),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["posts", post._id] });
      const previousPost = queryClient.getQueryData(["posts", post._id]);
      const previousLists = queryClient.getQueriesData({
        predicate: (query) => shouldUpdateList(query.queryKey),
      });
      const previousBookmarks = queryClient.getQueryData(["bookmark"]);

      if (authUserId) {
        const updater = (p) => ({
          ...p,
          bookmarks: toggleIdInArray(p.bookmarks || [], authUserId),
        });
        updatePostCache(updater);
        updateListCaches(updater);
      }

      return { previousPost, previousLists, previousBookmarks };
    },
    onSuccess: (data) => {
      const bookmarks = data?.data?.bookmarks;
      const wasBookmarked = Array.isArray(post?.bookmarks)
        ? post.bookmarks.some((id) => String(id) === authUserId)
        : false;
      const isBookmarked = Array.isArray(bookmarks)
        ? bookmarks.some((id) => String(id) === authUserId)
        : !wasBookmarked;

      // Emit socket event
      if (socket && socket.connected && authUserId) {
        socket.emit("bookmark_post", {
          postId: post._id,
          userId: authUserId,
          action: isBookmarked ? "bookmark" : "unbookmark",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["for-you"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["posts", post._id] });
      queryClient.invalidateQueries({ queryKey: ["bookmark"] });

      addToast(isBookmarked ? "🔖 Post bookmarked" : "📌 Bookmark removed", {
        type: "success",
        duration: 2000,
      });
    },
    onError: (error, variables, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData(["posts", post._id], context.previousPost);
      }
      if (context?.previousLists) {
        context.previousLists.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
      if (context?.previousBookmarks) {
        queryClient.setQueryData(["bookmark"], context.previousBookmarks);
      }
      addToast(error.message || "Failed to bookmark", {
        type: "error",
        duration: 3000,
      });
    },
  });

  // Comment mutation
  const { mutate: commentMutation, isPending: isCommenting } = useMutation({
    mutationFn: async (content) =>
      await axiosInstance.post(`/posts/${post._id}/comment`, { content }),
    onSuccess: (data, variables) => {
      // Emit socket event
      if (socket && socket.connected) {
        socket.emit("comment_post", {
          postId: post._id,
          userId: authUser._id,
          comment: {
            content: variables,
            user: {
              _id: authUser._id,
              name: authUser.name,
              avatar: authUser.avatar,
            },
          },
        });
      }

      queryClient.invalidateQueries({ queryKey: ["for-you"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["posts", post._id] });

      addToast("✨ Comment added", { type: "success", duration: 2000 });
    },
    onError: (error) => {
      addToast(error.message || "Failed to comment", {
        type: "error",
        duration: 3000,
      });
    },
  });

  // Delete mutation
  const { mutate: deleteMutation, isPending: isDeleting } = useMutation({
    mutationFn: async () => await axiosInstance.delete(`/posts/delete/${post._id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["for-you"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["posts", post._id] });

      addToast("🗑️ Post deleted", { type: "success", duration: 3000 });
    },
    onError: (error) => {
      addToast(error.message || "Failed to delete post", {
        type: "error",
        duration: 3000,
      });
    },
  });

  // Share function
  const sharePost = useCallback(async (platform = "copy") => {
    const postUrl = `${window.location.origin}/post/${post._id}`;
    const shareText = `Check out this post by ${post.author?.name || "someone"}!`;

    try {
      if (platform === "copy") {
        await navigator.clipboard.writeText(postUrl);
        addToast("🔗 Link copied to clipboard!", {
          type: "success",
          duration: 2000,
        });
      } else if (platform === "native" && navigator.share) {
        await navigator.share({
          title: shareText,
          text: post.content?.substring(0, 100) || shareText,
          url: postUrl,
        });
      } else {
        // Social media sharing
        const shareUrls = {
          twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(postUrl)}`,
          facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`,
          linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`,
          whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + " " + postUrl)}`,
        };

        if (shareUrls[platform]) {
          window.open(shareUrls[platform], "_blank", "width=600,height=400");
        }
      }

      // Emit socket event for analytics
      if (socket && socket.connected) {
        socket.emit("share_post", {
          postId: post._id,
          userId: authUser._id,
          platform,
        });
      }
    } catch (error) {
      console.error("Share error:", error);
      addToast("Failed to share", { type: "error", duration: 2000 });
    }
  }, [post, authUser, socket, addToast]);

  return {
    // Actions
    likePost: likeMutation,
    bookmarkPost: bookmarkMutation,
    addComment: commentMutation,
    deletePost: deleteMutation,
    sharePost,

    // Loading states
    isLiking,
    isBookmarking,
    isCommenting,
    isDeleting,

    // Post state
    isLiked: hasId(post?.likes, authUser?._id),
    isBookmarked: hasId(post?.bookmarks, authUser?._id),
    isOwner: toId(authUser?._id) === toId(post?.author?._id),
  };
};