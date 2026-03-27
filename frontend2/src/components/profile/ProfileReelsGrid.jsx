"use client";

// frontend/src/components/profile/ProfileReelsGrid.jsx
import React, { useRef, useState } from "react";
import { motion as Motion } from "framer-motion";
import { Play, Heart, Eye, Clapperboard } from "lucide-react";
import { Link } from "react-router-dom";
import { useUserReels } from "../../store/reels/useReels";

const ReelTile = ({ reel, index }) => {
  const [hovered, setHovered] = useState(false);
  const videoRef = useRef(null);

  const onHover = () => {
    setHovered(true);
    videoRef.current?.play().catch(() => {});
  };
  const onLeave = () => {
    setHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const views  = reel.viewCount ?? reel.views?.length ?? 0;
  const likes  = reel.likes?.length ?? 0;

  return (
    <Motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      onHoverStart={onHover}
      onHoverEnd={onLeave}
      className="relative rounded-2xl overflow-hidden cursor-pointer flex-shrink-0 shadow-md group"
      style={{ width: 140, height: 248, background: "#f1f5f9" }}
    >
      {reel.thumbnailUrl && !hovered && (
        <img src={reel.thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
      )}
      <video
        ref={videoRef}
        src={reel.videoUrl}
        loop muted playsInline preload="metadata"
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${hovered ? "opacity-100" : "opacity-0"}`}
      />

      {/* gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* play btn */}
      {!hovered && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow-md">
            <Play className="w-4 h-4 text-gray-800 fill-gray-800 ml-0.5" />
          </div>
        </div>
      )}

      {/* stats */}
      <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-white text-xs font-semibold">
            <Eye className="w-3 h-3" />
            {views >= 1000 ? `${(views/1000).toFixed(1)}k` : views}
          </div>
          <div className="flex items-center gap-1 text-white text-xs font-semibold">
            <Heart className="w-3 h-3" />
            {likes}
          </div>
        </div>
      </div>
    </Motion.div>
  );
};

/* ════════════════════════════════════════════════ */

const ProfileReelsGrid = ({ userId }) => {
  const { data: reels = [], isLoading } = useUserReels(userId);

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-3" style={{ scrollbarWidth: "none" }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-2xl animate-pulse bg-gray-100 flex-shrink-0"
            style={{ width: 140, height: 248 }} />
        ))}
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <Motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20 gap-4"
      >
        <div className="w-16 h-16 rounded-2xl bg-pink-50 flex items-center justify-center shadow-sm">
          <Clapperboard className="w-8 h-8 text-pink-300" />
        </div>
        <p className="text-gray-400 text-sm">No reels yet</p>
      </Motion.div>
    );
  }

  return (
    <div>
      {/* horizontal film strip */}
      <div
        className="flex gap-3 overflow-x-auto pb-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {reels.map((reel, i) => (
          <Link key={reel._id} to="/reels">
            <ReelTile reel={reel} index={i} />
          </Link>
        ))}
      </div>

      {/* see all */}
      <Link
        to="/reels"
        className="flex items-center justify-center gap-2 mt-1 py-3 rounded-2xl text-sm font-medium
          text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100
          border border-blue-100 transition-all duration-200"
      >
        <Clapperboard className="w-4 h-4" />
        View all reels
      </Link>
    </div>
  );
};

export default ProfileReelsGrid;
