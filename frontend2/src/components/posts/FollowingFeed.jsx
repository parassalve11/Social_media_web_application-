"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import axiosInstance from "../../lib/axiosIntance";
import InfiniteScrollContainer from "./InfiniteScrollContainer";

import { Loader2, Users2 } from "lucide-react";
import Post from "./Post";
import PostSkeleton from "./PostSkeleton";
import React from "react";

const FollowingFeed = () => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ["following"], // Unique key to avoid conflicts with for-you
    queryFn: async ({ pageParam }) => {
      const response = await axiosInstance.get("/posts/following", {
        params: pageParam ? { cursor: pageParam } : {},
      });
      return response.data;
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const posts = data?.pages.flatMap((page) => page.posts) || [];

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <PostSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center text-red-500 py-4">
        Error: {error.response?.data?.message || error.message}
      </div>
    );
  }

  if (!posts.length && !hasNextPage) {
    return (
      <div className="text-center py-6 w-full max-w-4xl text-gray-500">
        <Users2 className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 opacity-50" />
        <p className="text-sm sm:text-base">Follow other users to see their posts.</p>
      </div>
    );
  }

  return (
    <InfiniteScrollContainer
      className="space-y-6  mx-auto"
      onBottomReached={() =>
        hasNextPage && !isFetchingNextPage && fetchNextPage()
      }
    >
      {posts.map((post) => (
        <Post key={post._id} post={post} />
      ))}
      {isFetchingNextPage && (
        <Loader2 className="mx-auto my-3 animate-spin" size={24} />
      )}
    </InfiniteScrollContainer>
  );
};

export default React.memo(FollowingFeed);