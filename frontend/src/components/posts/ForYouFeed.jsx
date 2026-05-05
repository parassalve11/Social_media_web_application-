"use client";

import React, { useCallback } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import axiosInstance from '../../lib/axiosIntance';
import InfiniteScrollContainer from './InfiniteScrollContainer';
import Post from './Post';
import PostSkeleton from './PostSkeleton';
import { Loader2, Users2 } from 'lucide-react';

const ForYouFeed = () => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ['for-you'],
    queryFn: async ({ pageParam }) => {
      const response = await axiosInstance.get('/posts/for-you', {
        params: pageParam ? { cursor: pageParam } : {},
      });
      return response.data;
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    keepPreviousData: true,
  });

  const posts = data?.pages.flatMap((page) => page.posts) || [];

  const handleBottomReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <PostSkeleton />;
  if (isError) return <div className="text-center text-red-500">Error: {error.message}</div>;
  if (!posts.length && !hasNextPage) {
    return (
      <div className="text-center py-6 text-gray-500">
        <Users2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No Posts at the moment.</p>
      </div>
    );
  }

  return (
    <InfiniteScrollContainer
      className="space-y-6 w-full mx-auto"
      onBottomReached={handleBottomReached}
    >
      {posts.map((post) => <Post key={post._id} post={post} />)}
      {isFetchingNextPage && <Loader2 className="mx-auto my-3 animate-spin" size={24} />}
    </InfiniteScrollContainer>
  );
};

// Memoize export to avoid rerender when parent re-renders but props didn't change
export default React.memo(ForYouFeed);
