"use client";

import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../lib/axiosIntance';
import { useAuthUser } from '../hooks/useAuthUser';
import UserTooltip from './UserTooltip';

export default function UserLinkWithTooltip({ username, children }) {


  const { data: userProfile, isLoading: isProfileLoading, error: profileError } = useQuery({
    queryKey: ["profile", username],
    queryFn: async () => {
        if(!username) return null;
        const res = await axiosInstance.get(`/users/${username}`);
       
        return res.data
    },
    enabled: !!username,
  });

  const { data: authUser, isLoading: isAuthLoading } = useAuthUser();
if(!username){
return null;
}
  // If loading, error, or no data, render children without tooltip
  if (isProfileLoading || isAuthLoading || profileError || !authUser || !userProfile?.data) {
    return <span className="text-gray-700">{children}</span>;
  }

  const isOwnProfile = authUser.username === userProfile.data.username;
  const userData = isOwnProfile ? authUser : userProfile.data;

  return (
    <UserTooltip user={userData}>
      <a
        href={`/profile/${username}`}
        className="text-blue-600 font-bold underline cursor-pointer"
      >
        {children}
      </a>
    </UserTooltip>
  );
}
