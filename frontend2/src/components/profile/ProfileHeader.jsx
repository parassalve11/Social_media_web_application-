"use client";

// frontend/src/components/profile/ProfileHeader.jsx
import React from "react";
import { motion as Motion } from "framer-motion";
import { BadgeCheck, MapPin, Link as LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";
import FollowButton from "../FollowButton";

/* ── single stat ── */
const Stat = ({ value, label, href }) => {
  const count = value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value;
  const inner = (
    <Motion.div
      whileHover={{ scale: 1.05 }}
      className="flex flex-col items-center text-center group cursor-pointer"
    >
      <span className="text-2xl font-black text-gray-900 leading-none group-hover:text-blue-600 transition-colors">
        {count}
      </span>
      <span className="text-xs text-gray-500 mt-0.5 font-medium group-hover:text-blue-500 transition-colors">
        {label}
      </span>
    </Motion.div>
  );
  return href ? <Link to={href}>{inner}</Link> : inner;
};

/* ════════════════════════════════════════════════ */

const ProfileHeader = ({ userData, isOwnProfile, openEditDialog, postsCount = 0 }) => {
  const bannerImg = userData?.bannerImage;

  return (
    <div className="w-full">

      {/* ── BANNER ── */}
      <div className="relative h-44 sm:h-56 w-full overflow-hidden">
        {bannerImg ? (
          <img
            src={bannerImg}
            alt="banner"
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: "linear-gradient(135deg, #dbeafe 0%, #ede9fe 50%, #fce7f3 100%)",
            }}
          >
            {/* subtle decorative dots */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: "radial-gradient(circle, #6366f1 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }}
            />
          </div>
        )}
        {/* bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white/80 to-transparent" />
      </div>

      {/* ── MAIN CARD ── */}
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 -mt-8 relative z-10 p-5 sm:p-6">

          {/* avatar + action row */}
          <div className="flex items-end justify-between mb-4">
            {/* avatar */}
            <div className="relative -mt-14 sm:-mt-16">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden
                ring-4 ring-white shadow-xl">
                <img
                  src={userData?.avatar}
                  alt={userData?.username}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* online indicator */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400
                ring-2 ring-white shadow-sm" />
            </div>

            {/* action */}
            {isOwnProfile ? (
              <Motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={openEditDialog}
                className="px-5 py-2 rounded-xl text-sm font-semibold
                  border-2 border-blue-200 text-blue-600 bg-blue-50
                  hover:bg-blue-100 hover:border-blue-300
                  transition-all duration-200"
              >
                Edit Profile
              </Motion.button>
            ) : (
              <FollowButton userId={userData?._id} />
            )}
          </div>

          {/* name + username */}
          <div className="mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
                {userData?.name}
              </h1>
              {userData?.isVerified && (
                <BadgeCheck className="w-6 h-6 text-blue-500 flex-shrink-0" />
              )}
            </div>
            <p className="text-gray-400 text-sm font-medium mt-0.5">
              @{userData?.username}
            </p>
          </div>

          {/* bio */}
          {userData?.bio && (
            <p className="text-gray-600 text-sm leading-relaxed mb-3 max-w-md">
              {userData.bio}
            </p>
          )}

          {/* location + website */}
          {(userData?.location || userData?.website) && (
            <div className="flex flex-wrap gap-4 mb-4">
              {userData.location && (
                <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  {userData.location}
                </div>
              )}
              {userData.website && (
                <a
                  href={userData.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-blue-500 hover:text-blue-700 text-xs
                    transition-colors font-medium"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  {userData.website.replace(/^https?:\/\//, "")}
                </a>
              )}
            </div>
          )}

          {/* ── STATS ── */}
          <div className="flex items-center pt-4 border-t border-gray-100">
            <div className="flex-1">
              <Stat value={postsCount} label="Posts" />
            </div>
            <div className="w-px h-10 bg-gray-100" />
            <div className="flex-1">
              <Stat
                value={userData?.followers?.length ?? 0}
                label="Followers"
                href={`/profile/${userData?.username}/followers`}
              />
            </div>
            <div className="w-px h-10 bg-gray-100" />
            <div className="flex-1">
              <Stat
                value={userData?.following?.length ?? 0}
                label="Following"
                href={`/profile/${userData?.username}/following`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
