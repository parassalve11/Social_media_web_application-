"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNowStrict } from "date-fns";
import {
  ArrowUpRight,
  Hash,
  Search as SearchIcon,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import axiosInstance from "../lib/axiosIntance";
import { getPostMedia } from "../lib/postMedia";
import { useToast } from "../components/UI/ToastManager";
import FollowButton from "../components/FollowButton";
import { store } from "../store"; // read initial snapshot without subscribing

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const TABS = [
  { id: "users", label: "Users", icon: Users },
  { id: "hashtags", label: "Hashtags", icon: Hash },
  { id: "content", label: "Content", icon: Sparkles },
];

function ContentResultCard({ post }) {
  const mediaItems = getPostMedia(post);
  const preview = mediaItems[0];

  return (
    <Link
      to={`/post/${post._id}`}
      className="group flex flex-col sm:flex-row gap-4 py-4 transition-colors hover:bg-gray-50"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <img
            src={post.author?.avatar || "/placeholder.png"}
            alt={post.author?.name || "User"}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
            loading="lazy"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {post.author?.name || "Unknown User"}
            </p>
            <p className="text-xs text-gray-500 truncate">
              @{post.author?.username || "user"} -{" "}
              {formatDistanceToNowStrict(new Date(post.createdAt))} ago
            </p>
          </div>
        </div>

        <p className="mt-2 text-sm text-gray-700 leading-relaxed line-clamp-3">
          {post.content || "No content"}
        </p>

        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
          <span>{post.likes?.length || 0} likes</span>
          <span>{post.comments?.length || 0} comments</span>
        </div>
      </div>

      {preview && (
        <div className="w-full sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gray-100 relative">
          {preview.type === "video" ? (
            <video
              src={preview.url}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              muted
              playsInline
              preload="metadata"
            />
          ) : (
            <img
              src={preview.url}
              alt="Post media"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          )}
          {preview.type === "video" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <span className="text-white text-xs font-semibold px-2 py-0.5 rounded-full bg-black/60">
                Video
              </span>
            </div>
          )}
        </div>
      )}
    </Link>
  );
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("users");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const normalizedQuery = debouncedSearchQuery.trim();
  const hashtagQuery = normalizedQuery.replace(/^#/, "");
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  // ---------- local following map (no subscription to Redux)
  const initialFollowingMapRef = useRef(
    Object.fromEntries(
      (store.getState().user.user?.following || []).map((id) => [id, true])
    )
  );
  const [localFollowingMap, setLocalFollowingMap] = useState(
    initialFollowingMapRef.current
  );

  const {
    data: searchResults = [],
    isLoading: isSearchLoading,
    isError: isSearchError,
    error: searchError,
  } = useQuery({
    queryKey: ["searchUsers", normalizedQuery],
    queryFn: async () => {
      if (!normalizedQuery) return [];
      const res = await axiosInstance.get(
        `/users/search?q=${encodeURIComponent(normalizedQuery)}`
      );
      return res.data;
    },
    enabled: !!normalizedQuery && activeTab === "users",
    keepPreviousData: true,
    onError: (err) => {
      console.error("Error fetching search results:", err.message);
      addToast("Failed to load search results", {
        type: "error",
        duration: 3000,
      });
    },
  });

  const {
    data: trendingHashtags = [],
    isLoading: isTrendingLoading,
    isError: isTrendingError,
  } = useQuery({
    queryKey: ["trendingHashtags"],
    queryFn: async () => {
      const res = await axiosInstance.get("/posts/trending-hashtags");
      return res.data || [];
    },
    staleTime: 5 * 60 * 1000,
    onError: (err) => {
      console.error("Error fetching trending hashtags:", err.message);
      addToast("Failed to load trending hashtags", {
        type: "error",
        duration: 3000,
      });
    },
  });

  const {
    data: suggestedUsers = [],
    isLoading: isSuggestedLoading,
    isError: isSuggestedError,
  } = useQuery({
    queryKey: ["suggestedUsers"],
    queryFn: async () => {
      const res = await axiosInstance.get("/users");
      return res.data || [];
    },
    staleTime: 2 * 60 * 1000,
    onError: (err) => {
      console.error("Error fetching suggested users:", err.message);
      addToast("Failed to load suggestions", {
        type: "error",
        duration: 3000,
      });
    },
  });

  const {
    data: contentResults = [],
    isLoading: isContentLoading,
    isError: isContentError,
    error: contentError,
  } = useQuery({
    queryKey: ["searchPosts", normalizedQuery],
    queryFn: async () => {
      if (!normalizedQuery) return [];
      const res = await axiosInstance.get(
        `/posts/search?q=${encodeURIComponent(normalizedQuery)}`
      );
      return res.data || [];
    },
    enabled: !!normalizedQuery && activeTab === "content",
    keepPreviousData: true,
    onError: (err) => {
      console.error("Error fetching content results:", err.message);
      addToast("Failed to load posts", {
        type: "error",
        duration: 3000,
      });
    },
  });

  const filteredHashtags = useMemo(() => {
    if (!hashtagQuery) return trendingHashtags;
    const needle = hashtagQuery.toLowerCase();
    return (trendingHashtags || []).filter((item) => {
      const tag = String(item?.hashtag || "")
        .replace(/^#/, "")
        .toLowerCase();
      return tag.includes(needle);
    });
  }, [trendingHashtags, hashtagQuery]);

  // ---------- Follow mutation (optimistic local update)
  const followMutation = useMutation({
    mutationFn: async (userId) => {
      return axiosInstance.post(`/follows/${userId}/follow`);
    },
    onMutate: async (userId) => {
      await queryClient.cancelQueries({
        queryKey: ["searchUsers", normalizedQuery],
      });

      const previousSearch = queryClient.getQueryData([
        "searchUsers",
        normalizedQuery,
      ]);

      queryClient.setQueryData(["searchUsers", normalizedQuery], (old = []) =>
        old.map((u) => (u._id === userId ? { ...u, __isFollowing: true } : u))
      );

      setLocalFollowingMap((prev) => ({ ...prev, [userId]: true }));

      return { previousSearch };
    },
    onError: (err, userId, context) => {
      queryClient.setQueryData(
        ["searchUsers", normalizedQuery],
        context.previousSearch
      );
      setLocalFollowingMap((prev) => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
      console.error("Follow error:", err.message);
      addToast("Failed to follow user", { type: "error", duration: 3000 });
    },
    onSettled: () => {
      // keep local UI stable, no forced refetch
    },
    onSuccess: () => {
      addToast("Followed user", { type: "success", duration: 2000 });
    },
  });

  // ---------- Unfollow mutation (optimistic local update)
  const unFollowMutation = useMutation({
    mutationFn: async (userId) =>
      await axiosInstance.post(`/follows/${userId}/unfollow`),
    onMutate: async (userId) => {
      await queryClient.cancelQueries({
        queryKey: ["searchUsers", normalizedQuery],
      });
      const previousSearch = queryClient.getQueryData([
        "searchUsers",
        normalizedQuery,
      ]);

      queryClient.setQueryData(["searchUsers", normalizedQuery], (old = []) =>
        old.map((u) => (u._id === userId ? { ...u, __isFollowing: false } : u))
      );

      setLocalFollowingMap((prev) => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });

      return { previousSearch };
    },
    onError: (err, userId, context) => {
      queryClient.setQueryData(
        ["searchUsers", normalizedQuery],
        context.previousSearch
      );
      setLocalFollowingMap((prev) => ({ ...prev, [userId]: true }));
      console.error("Unfollow error:", err.message);
      addToast("Failed to unfollow user", { type: "error", duration: 3000 });
    },
    onSettled: () => {
      // keep local UI stable, no forced refetch
    },
    onSuccess: () => {
      addToast("Unfollowed user", { type: "success", duration: 2000 });
    },
  });

  const isDisabled = followMutation.isLoading || unFollowMutation.isLoading;

  const handleFollow = (userId) => followMutation.mutate(userId);
  const handleUnfollow = (userId) => unFollowMutation.mutate(userId);
  const handleSearch = (e) => setSearchQuery(e.target.value);

  const isFollowingFor = (user) => {
    const cached =
      queryClient.getQueryData(["searchUsers", normalizedQuery]) || [];
    const item = cached.find((u) => u._id === user._id);
    if (item && typeof item.__isFollowing !== "undefined") {
      return !!item.__isFollowing;
    }
    return !!localFollowingMap[user._id];
  };

  const renderUsersTab = () => {
    if (!normalizedQuery) {
      return (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Start typing to discover people. Try searching by name or username.
          </p>
        </div>
      );
    }

    if (isSearchLoading) {
      return (
        <div className="space-y-3">
          {[...Array(4)].map((_, index) => (
            <div
              key={`user-skeleton-${index}`}
              className="h-16 rounded-2xl bg-gray-100 shimmer"
            />
          ))}
        </div>
      );
    }

    if (isSearchError) {
      return (
        <div className="text-center text-red-600">
          {searchError?.message || "Could not load search results"}
        </div>
      );
    }

    if (!searchResults.length) {
      return (
        <div className="text-center text-sm text-gray-500">
          No users found. Try a different search.
        </div>
      );
    }

    return (
      <ul className="divide-y divide-gray-100">
        {searchResults.map((user) => {
          const isFollowing = isFollowingFor(user);
          const followersCount = Array.isArray(user.followers)
            ? user.followers.length
            : null;
          return (
            <li key={user._id} className="py-3">
              <div className="flex items-center justify-between gap-3">
                <Link
                  to={`/profile/${user.username}`}
                  className="flex items-center gap-3 min-w-0 flex-1 hover:bg-gray-50 rounded-xl px-2 py-2 transition-colors"
                >
                  <img
                    src={user.avatar || "/placeholder.png"}
                    alt={`${user.username}'s avatar`}
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow-sm"
                    loading="lazy"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">
                      {user.name || user.username}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      @{user.username}
                      {followersCount !== null && (
                        <>
                          {" "}
                          - {followersCount.toLocaleString()} followers
                        </>
                      )}
                    </p>
                    {user.bio && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {user.bio}
                      </p>
                    )}
                  </div>
                </Link>

                {user._id !== store.getState().user.user?._id && (
                  <FollowButton
                    userId={user._id}
                    isFollowing={isFollowing}
                    onFollow={() => handleFollow(user._id)}
                    onUnfollow={() => handleUnfollow(user._id)}
                    disabled={isDisabled}
                    className="px-3 py-1 text-xs"
                  />
                )}
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  const renderHashtagsTab = () => {
    if (isTrendingLoading) {
      return (
        <div className="space-y-3">
          {[...Array(4)].map((_, index) => (
            <div
              key={`tag-skeleton-${index}`}
              className="h-14 rounded-2xl bg-gray-100 shimmer"
            />
          ))}
        </div>
      );
    }

    if (isTrendingError) {
      return (
        <div className="text-center text-red-600">
          Could not load hashtags
        </div>
      );
    }

    const tagsToShow = normalizedQuery ? filteredHashtags : trendingHashtags;

    return (
      <div className="space-y-3">
        {normalizedQuery && hashtagQuery && (
          <Link
            to={`/hashtag/${hashtagQuery}`}
            className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3 text-blue-700 transition-all hover:shadow-sm"
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Hash size={16} />
              Explore #{hashtagQuery}
            </div>
            <ArrowUpRight size={18} />
          </Link>
        )}

        {tagsToShow?.length ? (
          <ul className="divide-y divide-gray-100">
            {tagsToShow.map(({ hashtag, count }, index) => {
              const tag = String(hashtag || "");
              const tagSlug = tag.replace(/^#/, "");
              return (
                <li key={`${tag}-${index}`} className="py-3">
                  <Link
                    to={`/hashtag/${tagSlug}`}
                    className="group flex items-center justify-between rounded-xl px-2 py-2 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-bold text-white">
                        #{index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {tag}
                        </p>
                        <p className="text-xs text-gray-500">
                          {count?.toLocaleString?.() || 0} posts
                        </p>
                      </div>
                    </div>
                    <ArrowUpRight
                      size={18}
                      className="text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="text-center text-sm text-gray-500">
            No hashtags found. Try another keyword.
          </div>
        )}
      </div>
    );
  };

  const renderContentTab = () => {
    if (!normalizedQuery) {
      return (
        <p className="text-sm text-gray-500">
          Search posts by keywords or hashtags. Example: travel tips, #design, or
          morning routine.
        </p>
      );
    }

    if (isContentLoading) {
      return (
        <div className="space-y-3">
          {[...Array(3)].map((_, index) => (
            <div
              key={`content-skeleton-${index}`}
              className="h-24 rounded-2xl bg-gray-100 shimmer"
            />
          ))}
        </div>
      );
    }

    if (isContentError) {
      return (
        <div className="text-center text-red-600">
          {contentError?.message || "Could not load posts"}
        </div>
      );
    }

    if (!contentResults.length) {
      return (
        <div className="text-center text-sm text-gray-500">
          No posts found. Try a different search phrase.
        </div>
      );
    }

    return (
      <div className="divide-y divide-gray-100">
        {contentResults.map((post) => (
          <ContentResultCard key={post._id} post={post} />
        ))}
      </div>
    );
  };

  const renderSidebar = () => (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-600" />
            <p className="text-sm font-semibold text-gray-900">Trending Now</p>
          </div>
          <TrendingUp size={16} className="text-blue-500" />
        </div>

        <div className="mt-3 divide-y divide-gray-100">
          {isTrendingLoading && (
            <>
              {[...Array(3)].map((_, index) => (
                <div
                  key={`trend-skeleton-${index}`}
                  className="h-10 rounded-lg bg-gray-100 shimmer"
                />
              ))}
            </>
          )}

          {isTrendingError && (
            <p className="text-xs text-red-500">Failed to load hashtags</p>
          )}

          {!isTrendingLoading &&
            !isTrendingError &&
            trendingHashtags?.slice(0, 5).map(({ hashtag, count }, index) => {
              const tag = String(hashtag || "");
              const tagSlug = tag.replace(/^#/, "");
              return (
                <Link
                  key={`${tag}-${index}`}
                  to={`/hashtag/${tagSlug}`}
                  className="flex items-center justify-between py-2 text-sm hover:text-blue-600 transition-colors"
                >
                  <span className="font-medium text-gray-800 truncate">
                    {tag}
                  </span>
                  <span className="text-xs text-gray-500">
                    {count?.toLocaleString?.() || 0}
                  </span>
                </Link>
              );
            })}

          {!isTrendingLoading &&
            !isTrendingError &&
            !trendingHashtags?.length && (
              <p className="text-xs text-gray-500">
                No trending hashtags right now
              </p>
            )}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <Users size={18} className="text-emerald-600" />
          <p className="text-sm font-semibold text-gray-900">
            Suggested People
          </p>
        </div>

        <div className="mt-3 divide-y divide-gray-100">
          {isSuggestedLoading && (
            <>
              {[...Array(3)].map((_, index) => (
                <div
                  key={`suggest-skeleton-${index}`}
                  className="h-12 rounded-lg bg-gray-100 shimmer"
                />
              ))}
            </>
          )}

          {isSuggestedError && (
            <p className="text-xs text-red-500">Failed to load suggestions</p>
          )}

          {!isSuggestedLoading &&
            !isSuggestedError &&
            suggestedUsers?.slice(0, 4).map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between gap-2 py-2"
              >
                <Link
                  to={`/profile/${user.username}`}
                  className="flex items-center gap-2 min-w-0 flex-1 hover:bg-gray-50 rounded-xl px-2 py-2 transition-colors"
                >
                  <img
                    src={user.avatar || "/placeholder.png"}
                    alt={user.name || "User"}
                    className="w-9 h-9 rounded-full object-cover"
                    loading="lazy"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">
                      {user.name || user.username}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate">
                      @{user.username}
                    </p>
                  </div>
                </Link>
                <FollowButton userId={user._id} className="px-3 py-1 text-xs" />
              </div>
            ))}

          {!isSuggestedLoading &&
            !isSuggestedError &&
            !suggestedUsers?.length && (
              <p className="text-xs text-gray-500">No suggestions yet</p>
            )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Search
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Find people, hashtags, and posts
          </p>
        </div>

        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search people, hashtags, or content..."
            className="w-full rounded-2xl border border-gray-200 bg-white/80 px-12 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Search users, hashtags, or content"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex w-full items-center gap-6 border-b border-gray-200">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-1 pb-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-blue-700 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Icon size={16} />
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {activeTab === "users" && (
                  <Users size={18} className="text-blue-600" />
                )}
                {activeTab === "hashtags" && (
                  <Hash size={18} className="text-purple-600" />
                )}
                {activeTab === "content" && (
                  <Sparkles size={18} className="text-indigo-600" />
                )}
                <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                  {activeTab === "users" && "People"}
                  {activeTab === "hashtags" && "Hashtags"}
                  {activeTab === "content" && "Posts"}
                </h2>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <Motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === "users" && renderUsersTab()}
                {activeTab === "hashtags" && renderHashtagsTab()}
                {activeTab === "content" && renderContentTab()}
              </Motion.div>
            </AnimatePresence>
          </div>

          <div className="lg:hidden">{renderSidebar()}</div>
        </div>

        <aside className="hidden lg:block">{renderSidebar()}</aside>
      </div>
    </div>
  );
}
