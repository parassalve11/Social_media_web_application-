"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import Tooltip from './UI/Tooltip';
import { useAuthUser } from '../hooks/useAuthUser';
import FollowButton from './FollowButton';
import AvatarComponent from './UI/AvatarComponent';

export default function UserTooltip({ user, children }) {
  const { data: authUser } = useAuthUser();

  // If user is undefined, render children without tooltip
  if (!user) {
    return <span>{children}</span>;
  }

  const isOwnProfile = authUser?.username === user.username;

  // Format follower/following counts (e.g., 1.2K, 1.5M)
  const formatCount = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count;
  };

  const totalFollowers = formatCount(user.followers?.length || 0);
  const totalFollowing = formatCount(user.following?.length || 0);

  const tooltipContent = (
    <div className="w-40 sm:w-48 p-2 space-y-1.5 text-gray-900 rounded-md    max-w-[80vw]">
      {/* Header: Avatar and Follow Button */}
      <div className="flex items-center justify-between gap-2">
        <Link
          to={`/profile/${user.username}`}
          className="hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full transition-opacity"
          aria-label={`View ${user.name}'s profile`}
        >
          <AvatarComponent
            size={32}
            className="w-8 h-8 sm:w-10 sm:h-10"
            src={user.avatar}
            alt={`${user.name}'s avatar`}
          />
        </Link>
        {!isOwnProfile && (
          <FollowButton
            userId={user._id}
            className="px-2 py-1 text-xs font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          />
        )}
      </div>

      {/* User Info */}
      <div className="space-y-0.5">
        <Link
          to={`/profile/${user.username}`}
          className="block hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
          aria-label={`View ${user.name}'s profile`}
        >
          <p className="text-sm font-semibold text-gray-900">{user.name}</p>
          <p className="text-xs text-gray-500">@{user.username}</p>
        </Link>
      </div>

      {/* Followers/Following */}
      <div className="flex gap-3 text-xs text-gray-600">
        <Link
          to={`/profile/${user.username}/followers`}
          className="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
          aria-label={`View ${user.name}'s followers`}
        >
          <span className="font-medium">{totalFollowers}</span> Followers
        </Link>
        <Link
          to={`/profile/${user.username}/following`}
          className="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
          aria-label={`View ${user.name}'s following`}
        >
          <span className="font-medium">{totalFollowing}</span> Following
        </Link>
      </div>
    </div>
  );

  return (
    <Tooltip
      content={tooltipContent}
      delay={0.2}
      minShowTime={0.1}
      placement="top"
      className="bg-white border border-gray-200 shadow-sm rounded-md"
    >
      {children}
    </Tooltip>
  );
}
