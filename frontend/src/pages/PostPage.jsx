"use client";

import { useQuery } from "@tanstack/react-query";
import { Navigate, useParams } from "react-router-dom";
import axiosInstance from "../lib/axiosIntance";
import Post from "../components/posts/Post";
import PostSkeleton from "../components/posts/PostSkeleton";

export default function PostPage() {
  const { postId } = useParams();

  const {
    data,
    isError,
    isLoading: PostLoading,
  } = useQuery({
    queryKey: ["posts", postId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/posts/${postId}`);
      return response.data;
    },
    enabled: !!postId,
  });

  if (PostLoading) return <PostSkeleton />;
  if (isError || !data) return <Navigate to={"/"} />;

  return (
    <div>
      <Post post={data} />
    </div>
  );
}
