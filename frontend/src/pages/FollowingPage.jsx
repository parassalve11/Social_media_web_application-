"use client";

import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import axiosInstance from "../lib/axiosIntance"; 
import { useToast } from "../components/UI/ToastManager"; 
import FollowButton from "../components/FollowButton";
import { useAuthUserSummary } from "../store/user/useUser";
import { useEffect, useMemo, useState } from "react";

const normalizeAvatar = (src) => {
  if (!src) return "/avatar.svg";
  if (typeof src === "string" && src.includes("via.placeholder.com")) {
    return "/avatar.svg";
  }
  return src;
};

const FollowingRow = ({ user, authUserId }) => {
  return (
    <li
      className="group flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/60 bg-white px-4 py-3 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
      role="listitem"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <img
          src={normalizeAvatar(user.avatar)}
          alt={`${user.username}'s avatar`}
          className="w-12 h-12 rounded-2xl object-cover ring-1 ring-slate-200"
          onError={(e) => {
            if (e.currentTarget.dataset.fallback === "1") return;
            e.currentTarget.dataset.fallback = "1";
            e.currentTarget.src = "/avatar.svg";
          }}
        />
        <div className="min-w-0">
          <Link
            to={`/profile/${user.username}`}
            className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
          >
            <p className="font-semibold text-slate-900 text-sm sm:text-base truncate group-hover:text-blue-600 transition-colors">
              {user.name || user.username}
            </p>
            <p className="text-xs text-slate-500 truncate">@{user.username || ""}</p>
          </Link>
          {user.bio && (
            <p className="text-xs text-slate-500 line-clamp-1 mt-1">
              {user.bio}
            </p>
          )}
        </div>
      </div>
      {user._id !== authUserId && <FollowButton userId={user._id} />}
    </li>
  );
};

export default function FollowingPage() {
  const { username } = useParams();
  const { addToast } = useToast();
  const authUser = useAuthUserSummary();

  const { data: userProfile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["profile", username],
    queryFn: async () => await axiosInstance.get(`/users/${username}`),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const profileUsername = userProfile?.data?.username;
  const isOwnProfile =
    !!authUser?.username && !!profileUsername && authUser.username === profileUsername;
  const userData = userProfile?.data;
  const backTarget = userData?.username ? `/profile/${userData.username}` : "/";
  const followersHref = profileUsername ? `/profile/${profileUsername}/followers` : "#";
  const followingHref = profileUsername ? `/profile/${profileUsername}/following` : "#";

  const {
    data: following,
    isLoading: isFollowingLoading,
    isError: isFollowingError,
    error: followingError,
  } = useQuery({
    queryKey: ["following", username],
    queryFn: async () => {
      const res = await axiosInstance.get(`/follows/${userData._id}/following`);
      return res.data;
    },
    enabled: !!userData?._id,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    onError: (err) => {
      console.error("Error fetching following:", err.message);
      addToast("Failed to load following", { type: "error", duration: 3000 });
    },
  });

  const [list, setList] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (Array.isArray(following)) {
      setList(following);
    }
  }, [following]);

  const filteredList = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((followingUser) => {
      const hay = `${followingUser.name || ""} ${followingUser.username || ""}`
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [list, query]);

  const displayName = userData?.name || profileUsername || "Profile";
  const followersCount = Array.isArray(userData?.followers)
    ? userData.followers.length
    : 0;
  const followingCount = Array.isArray(userData?.following)
    ? userData.following.length
    : list.length;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-[28px] border border-slate-200/70 bg-white/80 shadow-[0_18px_40px_rgba(15,23,42,0.08)] overflow-hidden">
        <div className="relative px-5 py-5 sm:px-6">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/70 via-white to-purple-50/70" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                to={backTarget}
                className="h-9 w-9 rounded-full border border-slate-200/80 bg-white/80 flex items-center justify-center
                  text-slate-600 hover:text-slate-900 hover:shadow-sm transition"
                aria-label="Back to profile"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl overflow-hidden ring-2 ring-white shadow">
                  <img
                    src={normalizeAvatar(userData?.avatar)}
                    alt={`${profileUsername || "User"} avatar`}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      if (e.currentTarget.dataset.fallback === "1") return;
                      e.currentTarget.dataset.fallback = "1";
                      e.currentTarget.src = "/avatar.svg";
                    }}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{displayName}</p>
                  <p className="text-xs text-slate-500">@{profileUsername || ""}</p>
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <h1 className="text-lg sm:text-xl font-semibold text-slate-900">
                {isOwnProfile
                  ? "Your Following"
                  : profileUsername
                  ? "Following"
                  : "Following"}
              </h1>
              <p className="text-xs text-slate-500">Accounts this user follows.</p>
              <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-slate-200/70 bg-white/90 p-1 shadow-sm">
                <Link
                  to={followersHref}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full text-slate-600 hover:bg-slate-100 transition ${
                    followersHref === "#" ? "pointer-events-none opacity-60" : ""
                  }`}
                >
                  Followers {followersCount}
                </Link>
                <Link
                  to={followingHref}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full bg-blue-600 text-white shadow ${
                    followingHref === "#" ? "pointer-events-none opacity-60" : ""
                  }`}
                >
                  Following {followingCount}
                </Link>
              </div>
            </div>
          </div>

          <div className="relative mt-4 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[220px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search following"
                  className="w-full rounded-2xl border border-slate-200/70 bg-white/90 pl-9 pr-3 py-2 text-sm
                    text-slate-800 placeholder-slate-400 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              {filteredList.length} of {list.length} following
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {isProfileLoading || isFollowingLoading ? (
            <div className="text-center text-slate-500 text-sm sm:text-base" aria-live="polite">
              Loading following...
            </div>
          ) : isFollowingError ? (
            <div className="text-center text-red-600 text-sm sm:text-base" aria-live="assertive">
              Error: {followingError?.message || "Could not load following"}
            </div>
          ) : filteredList.length > 0 ? (
            <ul className="grid gap-3 sm:gap-4" role="list">
              {filteredList.map((followingUser) => (
                <FollowingRow
                  key={followingUser._id}
                  user={followingUser}
                  authUserId={authUser?._id}
                />
              ))}
            </ul>
          ) : (
            <div className="text-center text-slate-500 text-sm sm:text-base" aria-live="polite">
              {list.length === 0
                ? "No following yet"
                : "No accounts match your search"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
