"use client";

// frontend/src/components/reels/ReelActions.jsx
import React, { useState } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Trash2 } from "lucide-react";
import { useLikeReel, useDeleteReel } from "../../store/reels/useReels";
import { useUser } from "../../store/user/useUser";

/* ── single action button ── */
const ActionBtn = ({ icon: Icon, label, count, onClick, active = false, color = "white" }) => (
  <Motion.button
    whileHover={{ scale: 1.15 }}
    whileTap={{ scale: 0.85 }}
    onClick={onClick}
    className="flex flex-col items-center gap-1 focus:outline-none"
  >
    <div className={`w-11 h-11 rounded-full flex items-center justify-center
      transition-all duration-200
      ${active ? "bg-white/20" : "bg-black/30 hover:bg-black/50"}
      backdrop-blur-sm border border-white/10`}
    >
      <Icon
        className={`w-5 h-5 transition-all duration-200 ${
          active ? `fill-current text-${color}-400` : "text-white"
        }`}
        style={active ? { color: color === "red" ? "#f87171" : color === "yellow" ? "#fbbf24" : "white" } : {}}
      />
    </div>
    {count !== undefined && (
      <span className="text-white text-xs font-semibold drop-shadow-md">
        {count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count}
      </span>
    )}
  </Motion.button>
);

export default function ReelActions({ reel, onCommentOpen }) {
  const { user } = useUser();
  const { mutate: likeReel }   = useLikeReel();
  const { mutate: deleteReel } = useDeleteReel();

  const [liked,      setLiked]      = useState(() =>
    reel.likes?.some((id) => String(id?._id ?? id) === String(user?._id))
  );
  const [likesCount, setLikesCount] = useState(reel.likes?.length ?? 0);
  const [bookmarked, setBookmarked] = useState(false);
  const [showMore,   setShowMore]   = useState(false);

  const isOwn = String(reel.author?._id ?? reel.author) === String(user?._id);

  const handleLike = () => {
    setLiked((p) => !p);
    setLikesCount((p) => (liked ? p - 1 : p + 1));
    likeReel(reel._id);
  };

  const handleDelete = () => {
    setShowMore(false);
    deleteReel(reel._id);
  };

  /* heart burst particle effect on like */
  const [burst, setBurst] = useState(false);
  const triggerBurst = () => {
    setBurst(true);
    setTimeout(() => setBurst(false), 700);
    handleLike();
  };

  return (
    <div className="flex flex-col items-center gap-5 relative">

      {/* Like */}
      <div className="relative">
        <ActionBtn
          icon={Heart}
          label="Like"
          count={likesCount}
          onClick={triggerBurst}
          active={liked}
          color="red"
        />
        {/* burst particles */}
        <AnimatePresence>
          {burst && liked && (
            <>
              {[...Array(6)].map((_, i) => (
                <Motion.div
                  key={i}
                  initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                  animate={{
                    scale: [0, 1, 0],
                    x: Math.cos((i * 60 * Math.PI) / 180) * 28,
                    y: Math.sin((i * 60 * Math.PI) / 180) * 28,
                    opacity: [1, 1, 0],
                  }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                    w-2 h-2 rounded-full bg-red-400 pointer-events-none"
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Comment */}
      <ActionBtn
        icon={MessageCircle}
        label="Comment"
        count={reel.comments?.length ?? 0}
        onClick={onCommentOpen}
      />

      {/* Bookmark */}
      <ActionBtn
        icon={Bookmark}
        label="Save"
        onClick={() => setBookmarked((p) => !p)}
        active={bookmarked}
        color="yellow"
      />

      {/* Share */}
      <ActionBtn
        icon={Share2}
        label="Share"
        onClick={() => {
          navigator.clipboard?.writeText(`${window.location.origin}/reels/${reel._id}`);
        }}
      />

      {/* More (own reels only) */}
      {isOwn && (
        <div className="relative">
          <ActionBtn
            icon={MoreHorizontal}
            label=""
            onClick={() => setShowMore((p) => !p)}
          />
          <AnimatePresence>
            {showMore && (
              <Motion.div
                initial={{ opacity: 0, scale: 0.85, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.85, x: 10 }}
                className="absolute right-14 bottom-0 bg-black/80 backdrop-blur-md
                  rounded-2xl border border-white/10 overflow-hidden shadow-2xl w-40"
              >
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-400
                    hover:bg-white/10 transition-colors text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" /> Delete Reel
                </button>
              </Motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Author avatar */}
      <div className="relative mt-1">
        <img
          src={reel.author?.avatar}
          alt={reel.author?.username}
          className="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow-lg"
        />
        {/* follow "+" badge — just visual, hook up if needed */}
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2
          w-5 h-5 rounded-full bg-red-500 flex items-center justify-center
          ring-2 ring-black shadow-md">
          <span className="text-white text-[10px] font-bold leading-none">+</span>
        </div>
      </div>
    </div>
  );
}
