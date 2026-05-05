"use client";

// src/components/HashtagPosts.jsx
import { useInfiniteQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import axiosInstance from "../lib/axiosIntance";
import { useToast } from "./UI/ToastManager";
import Post from "./posts/Post";
import PostSkeleton from "./posts/PostSkeleton";

const HashtagPosts = () => {
  const { hashtag } = useParams();
  const { addToast } = useToast();

  const rawHashtag = Array.isArray(hashtag) ? hashtag[0] : hashtag;
  const normalizedHashtag = decodeURIComponent(rawHashtag || "")
    .replace(/^#/, "")
    .trim();
  const queryHashtag = normalizedHashtag.replace(/\s+/g, "");

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["hashtagPosts", queryHashtag],
    queryFn: async ({ pageParam = null }) => {
      const res = await axiosInstance.get(
        `/posts/hashtag/${encodeURIComponent(queryHashtag)}`,
        {
          params: { cursor: pageParam },
        }
      );
      return res.data;
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: Boolean(queryHashtag),
    staleTime: 60 * 1000,
    onError: (err) => {
      console.error(err);
      addToast(`Failed to load posts for #${queryHashtag}`, {
        type: "error",
        duration: 3000,
      });
    },
  });

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  if (!queryHashtag) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto text-center text-gray-500">
          Please provide a hashtag to explore.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        <span className="font-bold text-4xl text-blue-500">
          #{queryHashtag}
        </span>
      </h1>

      {/* Initial load */}
      {isLoading && (
        <div className="space-y-4 max-w-2xl mx-auto">
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="text-center text-red-500">
          {error?.message || "Could not load posts"}
        </div>
      )}

      {/* Posts */}
      {posts.length > 0 && (
        <div className="space-y-6 max-w-2xl mx-auto">
          {posts.map((post) => (
            <Post key={post._id} post={post} />
          ))}

          {/* Load more */}
          {hasNextPage && (
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className={`mx-auto block px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition ${
                isFetchingNextPage
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              {isFetchingNextPage ? "Loading..." : "Load More"}
            </button>
          )}
        </div>
      )}

      {/* No posts */}
      {!isLoading && posts.length === 0 && (
        <div className="text-center text-gray-500">
          No posts found for{" "}
          <span className="font-bold text-blue-500">#{queryHashtag}</span>
        </div>
      )}
    </div>
  );
};

export default HashtagPosts;