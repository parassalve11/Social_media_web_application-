"use client";

// frontend/src/components/reels/ReelCard.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, Play, Music2, ChevronUp, Send, X } from "lucide-react";
import { Link } from "react-router-dom";
import ReelActions from "./ReelActions";
import { useReelComments, useCommentReel, useViewReel } from "../../store/reels/useReels";
import { useUser } from "../../store/user/useUser";
import { formatDistanceToNow } from "date-fns";

/* ── Scrolling caption text ── */
const ScrollingText = ({ text }) => {
  const [scroll, setScroll] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setScroll(true), 1500);
    return () => clearTimeout(t);
  }, [text]);

  return (
    <div className="overflow-hidden max-w-[260px]">
      <Motion.p
        key={text}
        animate={scroll ? { x: [0, -200, 0] } : { x: 0 }}
        transition={scroll ? { duration: 8, repeat: Infinity, ease: "linear" } : {}}
        className="text-white text-sm font-medium whitespace-nowrap"
      >
        ♫ {text}
      </Motion.p>
    </div>
  );
};

/* ── Comment panel ── */
function CommentPanel({ reelId, onClose }) {
  const { user }                       = useUser();
  const { data: comments = [], isLoading } = useReelComments(reelId);
  const { mutate: postComment, isPending }  = useCommentReel();
  const [text, setText]                 = useState("");
  const inputRef                        = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed || isPending) return;
    postComment({ reelId, content: trimmed });
    setText("");
  };

  return (
    <Motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      className="absolute inset-x-0 bottom-0 z-40 flex flex-col rounded-t-3xl overflow-hidden"
      style={{
        height: "65%",
        background: "rgba(10,10,15,0.92)",
        backdropFilter: "blur(24px)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
        <h3 className="text-white font-bold text-base">
          {comments.length} Comments
        </h3>
        <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* comments list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4"
        style={{ scrollbarWidth: "none" }}>
        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}
        {!isLoading && comments.length === 0 && (
          <p className="text-white/40 text-sm text-center py-8">Be the first to comment</p>
        )}
        {comments.map((c) => (
          <div key={c._id} className="flex gap-3">
            <img
              src={c.user?.avatar}
              alt={c.user?.username}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-1 ring-white/10"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-white text-xs font-semibold">{c.user?.username}</span>
                <span className="text-white/30 text-[10px]">
                  {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                </span>
              </div>
              <p className="text-white/80 text-sm mt-0.5 leading-relaxed">{c.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* input */}
      <div className="px-4 py-3 border-t border-white/8 flex items-center gap-3">
        <img
          src={user?.avatar}
          alt={user?.username}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
        />
        <div className="flex-1 bg-white/8 rounded-full px-4 py-2 flex items-center gap-2
          border border-white/10">
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Add a comment…"
            className="flex-1 bg-transparent outline-none text-white text-sm placeholder-white/30"
          />
          <button
            onClick={submit}
            disabled={!text.trim() || isPending}
            className="text-blue-400 hover:text-blue-300 disabled:opacity-30 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Motion.div>
  );
}

/* ══════════════════════════════════════════════════════ */

export default function ReelCard({ reel, isActive }) {
  const videoRef        = useRef(null);
  const [paused,      setPaused]      = useState(false);
  const [muted,       setMuted]       = useState(true);   // start muted for autoplay
  const [progress,    setProgress]    = useState(0);
  const [showPlay,    setShowPlay]    = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const viewReel                      = useViewReel();

  /* autoplay when active */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.play().catch(() => {});
      setPaused(false);
      viewReel(reel._id); // register view
    } else {
      video.pause();
      video.currentTime = 0;
      setProgress(0);
    }
  }, [isActive, reel._id]);

  /* progress bar */
  const onTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setProgress((video.currentTime / video.duration) * 100);
  };

  /* tap to play/pause */
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setPaused(false);
    } else {
      video.pause();
      setPaused(true);
    }
    // flash play icon
    setShowPlay(true);
    setTimeout(() => setShowPlay(false), 800);
  }, []);

  /* double-tap to like */
  const tapCount  = useRef(0);
  const tapTimer  = useRef(null);
  const [heartPos, setHeartPos] = useState(null);

  const handleTap = (e) => {
    tapCount.current += 1;
    if (tapCount.current === 2) {
      clearTimeout(tapTimer.current);
      tapCount.current = 0;
      const rect = e.currentTarget.getBoundingClientRect();
      setHeartPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setTimeout(() => setHeartPos(null), 900);
    } else {
      tapTimer.current = setTimeout(() => {
        tapCount.current = 0;
        togglePlay();
      }, 250);
    }
  };

  /* extract hashtags for display */
  const hashtags = reel.caption?.match(/#\w+/g) ?? [];
  const cleanCaption = reel.caption?.replace(/#\w+/g, "").trim();

  return (
    <div className="relative w-full h-full bg-black select-none overflow-hidden">

      {/* ══ VIDEO ══ */}
      <video
        ref={videoRef}
        src={reel.videoUrl}
        loop
        muted={muted}
        playsInline
        preload="metadata"
        onTimeUpdate={onTimeUpdate}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* dark gradient overlay — top & bottom */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 20%, transparent 60%, rgba(0,0,0,0.75) 100%)",
        }}
      />

      {/* tap area */}
      <div className="absolute inset-0 z-10" onClick={handleTap} />

      {/* ══ DOUBLE-TAP HEART ══ */}
      <AnimatePresence>
        {heartPos && (
          <Motion.div
            key="heart"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: [0, 1.4, 1], opacity: [1, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute z-20 pointer-events-none"
            style={{ left: heartPos.x - 32, top: heartPos.y - 32 }}
          >
            <span className="text-7xl drop-shadow-2xl">❤️</span>
          </Motion.div>
        )}
      </AnimatePresence>

      {/* ══ PLAY/PAUSE FLASH ══ */}
      <AnimatePresence>
        {(showPlay || paused) && (
          <Motion.div
            key="play"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
          >
            <div className="w-20 h-20 rounded-full bg-black/40 backdrop-blur-sm
              flex items-center justify-center border border-white/20 shadow-2xl">
              <Play className="w-9 h-9 text-white fill-white ml-1" />
            </div>
          </Motion.div>
        )}
      </AnimatePresence>

      {/* ══ PROGRESS BAR ══ */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/20 z-30 pointer-events-none">
        <div
          className="h-full bg-white transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ══ MUTE BUTTON ══ */}
      <button
        onClick={(e) => { e.stopPropagation(); setMuted((p) => !p); }}
        className="absolute top-12 right-4 z-30 w-9 h-9 rounded-full
          bg-black/40 backdrop-blur-sm border border-white/10
          flex items-center justify-center text-white hover:bg-black/60 transition-colors"
      >
        {muted
          ? <VolumeX className="w-4 h-4" />
          : <Volume2 className="w-4 h-4" />
        }
      </button>

      {/* ══ RIGHT SIDE ACTIONS ══ */}
      <div className="absolute right-3 bottom-24 z-30">
        <ReelActions reel={reel} onCommentOpen={() => setCommentOpen(true)} />
      </div>

      {/* ══ BOTTOM INFO ══ */}
      <div className="absolute bottom-0 left-0 right-16 z-30 p-4 pb-6">
        {/* username */}
        <Link
          to={`/profile/${reel.author?.username}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-2 mb-2"
        >
          <span className="text-white font-bold text-[15px] drop-shadow-md hover:underline">
            @{reel.author?.username}
          </span>
        </Link>

        {/* caption */}
        {cleanCaption && (
          <p className="text-white/90 text-sm leading-snug mb-2 line-clamp-2 drop-shadow-md">
            {cleanCaption}
          </p>
        )}

        {/* hashtags */}
        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {hashtags.map((h, i) => (
              <span key={i}
                className="text-blue-300 text-xs font-semibold hover:text-blue-200 cursor-pointer transition-colors">
                {h}
              </span>
            ))}
          </div>
        )}

        {/* audio */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-white/10 border border-white/20
            flex items-center justify-center flex-shrink-0">
            <Music2 className="w-2.5 h-2.5 text-white" />
          </div>
          <ScrollingText text={reel.audioName || "Original Audio"} />
        </div>
      </div>

      {/* ══ COMMENT PANEL ══ */}
      <AnimatePresence>
        {commentOpen && (
          <CommentPanel
            key="comments"
            reelId={reel._id}
            onClose={() => setCommentOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
