"use client";

// frontend/src/components/message/status/StatusViewer.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Trash2, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const STORY_DURATION = 5000; // ms per story

export default function StatusViewer({
  groups,           // grouped statuses array
  startGroupIndex,  // which user's group to open first
  currentUserId,
  onClose,
  onView,
  onDelete,
}) {
  const [groupIdx, setGroupIdx] = useState(startGroupIndex ?? 0);
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);   // 0-100
  const [paused, setPaused]     = useState(false);
  const [showViewers, setShowViewers] = useState(false);

  const intervalRef = useRef(null);
  const startRef    = useRef(null);
  const elapsedRef  = useRef(0);

  const group   = groups[groupIdx];
  const status  = group?.statuses?.[storyIdx];
  const isOwn   = String(group?.user?._id ?? group?.user) === String(currentUserId);
  const total   = group?.statuses?.length ?? 0;

  /* ── mark as viewed ── */
  useEffect(() => {
    if (!status?._id) return;
    const alreadySeen = status.viewers?.some(
      (v) => String(v?._id ?? v) === String(currentUserId)
    );
    if (!alreadySeen) onView?.(status._id);
  }, [status?._id]);

  /* ── progress timer ── */
  const startTimer = useCallback(() => {
    if (status?.contentType === "video") return; // video controls its own duration
    clearInterval(intervalRef.current);
    startRef.current = Date.now() - elapsedRef.current * (STORY_DURATION / 100);

    intervalRef.current = setInterval(() => {
      if (paused) return;
      const elapsed = Date.now() - startRef.current;
      const pct = Math.min(100, (elapsed / STORY_DURATION) * 100);
      setProgress(pct);
      if (pct >= 100) advance();
    }, 50);
  }, [paused, storyIdx, groupIdx]);

  useEffect(() => {
    elapsedRef.current = 0;
    setProgress(0);
    startTimer();
    return () => clearInterval(intervalRef.current);
  }, [storyIdx, groupIdx]);

  const advance = useCallback(() => {
    clearInterval(intervalRef.current);
    elapsedRef.current = 0;
    if (storyIdx < total - 1) {
      setStoryIdx((i) => i + 1);
    } else if (groupIdx < groups.length - 1) {
      setGroupIdx((g) => g + 1);
      setStoryIdx(0);
    } else {
      onClose();
    }
  }, [storyIdx, total, groupIdx, groups.length, onClose]);

  const retreat = useCallback(() => {
    clearInterval(intervalRef.current);
    elapsedRef.current = 0;
    if (storyIdx > 0) {
      setStoryIdx((i) => i - 1);
    } else if (groupIdx > 0) {
      setGroupIdx((g) => g - 1);
      setStoryIdx(0);
    }
  }, [storyIdx, groupIdx]);

  /* keyboard */
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowRight") advance();
      if (e.key === "ArrowLeft")  retreat();
      if (e.key === "Escape")     onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [advance, retreat, onClose]);

  if (!group || !status) return null;

  const timeAgo = status.createdAt
    ? formatDistanceToNow(new Date(status.createdAt), { addSuffix: true })
    : "";

  const viewerCount = status.viewers?.length ?? 0;

  return (
    <Motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black"
      onClick={() => setPaused(false)}
    >
      {/* ═══ MAIN CARD ═══ */}
      <div
        className="relative w-full max-w-sm h-full max-h-[90vh] overflow-hidden rounded-none sm:rounded-3xl select-none"
        onMouseDown={() => setPaused(true)}
        onMouseUp={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        {/* ── background ── */}
        {status.contentType === "text" && (
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(135deg, #1e3a5f, #0ea5e9)" }}
          />
        )}
        {status.contentType === "image" && (
          <img
            src={status.content}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {status.contentType === "video" && (
          <video
            src={status.content}
            autoPlay
            className="absolute inset-0 w-full h-full object-cover"
            onEnded={advance}
          />
        )}

        {/* dark overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/50" />

        {/* ── PROGRESS BARS ── */}
        <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
          {group.statuses.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <Motion.div
                className="h-full bg-white rounded-full"
                style={{
                  width:
                    i < storyIdx
                      ? "100%"
                      : i === storyIdx
                      ? `${progress}%`
                      : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* ── HEADER ── */}
        <div className="absolute top-7 left-4 right-4 flex items-center gap-3 z-10">
          <img
            src={group.user?.avatar || group.user?.profilePicture}
            alt={group.user?.username}
            className="w-9 h-9 rounded-full object-cover ring-2 ring-white/60"
          />
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">
              {group.user?.username}
            </p>
            <p className="text-white/60 text-xs">{timeAgo}</p>
          </div>

          {/* own controls */}
          {isOwn && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowViewers((v) => !v); }}
              className="flex items-center gap-1 text-white/80 hover:text-white transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span className="text-xs font-medium">{viewerCount}</span>
            </button>
          )}
          {isOwn && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.(status._id); }}
              className="text-white/80 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── TEXT CONTENT ── */}
        {status.contentType === "text" && (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <p className="text-white text-2xl font-bold text-center leading-snug drop-shadow-lg">
              {status.content}
            </p>
          </div>
        )}

        {/* ── VIEWERS PANEL (own only) ── */}
        <AnimatePresence>
          {showViewers && isOwn && (
            <Motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md
                rounded-t-3xl p-5 z-20 max-h-64 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold text-gray-800 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-gray-500" />
                  Viewed by {viewerCount}
                </p>
                <button onClick={() => setShowViewers(false)}>
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              {status.viewers?.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No views yet</p>
              ) : (
                status.viewers.map((v) => (
                  <div key={v?._id ?? v} className="flex items-center gap-3 py-2">
                    <img
                      src={v?.avatar || v?.profilePicture}
                      alt={v?.username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="text-sm font-medium text-gray-700">{v?.username}</span>
                  </div>
                ))
              )}
            </Motion.div>
          )}
        </AnimatePresence>

        {/* ── PREV / NEXT tap zones ── */}
        <button
          className="absolute top-16 bottom-0 left-0 w-1/3 z-10 opacity-0"
          onClick={(e) => { e.stopPropagation(); retreat(); }}
          aria-label="Previous"
        />
        <button
          className="absolute top-16 bottom-0 right-0 w-1/3 z-10 opacity-0"
          onClick={(e) => { e.stopPropagation(); advance(); }}
          aria-label="Next"
        />

        {/* ── NAV CHEVRONS (visible) ── */}
        <button
          onClick={(e) => { e.stopPropagation(); retreat(); }}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full
            bg-black/30 flex items-center justify-center text-white/80 hover:text-white
            hover:bg-black/50 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); advance(); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full
            bg-black/30 flex items-center justify-center text-white/80 hover:text-white
            hover:bg-black/50 transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* adjacent group indicators */}
      {groups.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {groups.map((_, i) => (
            <button
              key={i}
              onClick={() => { setGroupIdx(i); setStoryIdx(0); }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === groupIdx ? "w-6 bg-white" : "w-1.5 bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </Motion.div>
  );
}
