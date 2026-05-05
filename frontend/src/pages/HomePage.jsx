"use client";

import React from "react";
import { Sparkles, Users2 } from "lucide-react";
import PostEditor from "../components/posts/PostEditor";
import { Tabs } from "../components/UI/Tabs";
import RecommendedUsers from "../components/RecommandedUsers";
import ForYouFeed from "../components/posts/ForYouFeed";
import FollowingFeed from "../components/posts/FollowingFeed";
import TrendingBar from "../components/TrendingBar";
import { useAuthUserSummary } from "../store/user/useUser";

const HomePage = () => {
  const authUser = useAuthUserSummary();

  if (!authUser) {
    return (
      <div className="w-full p-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-500">
          Loading your feed...
        </div>
      </div>
    );
  }

  const tabs = [
    {
      value: "for-you",
      label: (
        <span className="flex items-center gap-2">
          <Sparkles size={16} />
          For You
        </span>
      ),
      content: <ForYouFeed />,
    },
    {
      value: "following",
      label: (
        <span className="flex items-center gap-2">
          <Users2 size={16} />
          Following
        </span>
      ),
      content: <FollowingFeed />,
    },
  ];

  return (
    <div className="w-full flex flex-col sm:flex-row gap-4 p-4">
      {/* Main content */}
      <div className="w-full sm:flex-1 space-y-4 sm:space-y-6">
        <PostEditor user={authUser} />
        <Tabs
          tabs={tabs}
          variant="pill"
          className="w-full rounded-2xl border border-gray-100 bg-white shadow-sm p-3"
          listClassName="sticky top-3 z-10 bg-white/90 backdrop-blur border border-gray-200 shadow-sm"
          contentClassName="pt-2"
        />
      </div>

      {/* Sidebar with sticky content */}
      <div className="hidden sm:block sm:w-80 lg:w-96 shrink-0">
        <div className="sticky top-4 space-y-4">
          <TrendingBar />
          <RecommendedUsers />
        </div>
      </div>
    </div>
  );
};

export default HomePage;