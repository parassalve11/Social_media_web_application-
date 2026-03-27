"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Clapperboard,
  Loader2,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
} from "lucide-react";
import ReelCard from "../components/reels/ReelCard";
import ReelUploadModal from "../components/reels/ReelUploadModal";
import { useReelFeed } from "../store/reels/useReels";
import Logo from "../components/UI/Logo";
import { Link } from "react-router-dom";

export default function ReelsPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const containerRef = useRef(null);
  const observerRef = useRef(null);
  const cardRefs = useRef([]);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    isError,
    refetch,
  } = useReelFeed();

  const reels = data?.pages?.flatMap((page) => page.reels) ?? [];

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const idx = Number.parseInt(entry.target.dataset.index, 10);
          if (Number.isNaN(idx)) return;

          setActiveIndex(idx);
          setShowScrollTop(idx > 2);

          if (idx >= reels.length - 2 && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        });
      },
      { threshold: 0.65 }
    );

    cardRefs.current.forEach((el) => {
      if (el) observerRef.current.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [reels.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowDown" && activeIndex < reels.length - 1) {
        cardRefs.current[activeIndex + 1]?.scrollIntoView({ behavior: "smooth" });
      }

      if (e.key === "ArrowUp" && activeIndex > 0) {
        cardRefs.current[activeIndex - 1]?.scrollIntoView({ behavior: "smooth" });
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeIndex, reels.length]);

  // const goToIndex = (index) => {
  //   cardRefs.current[index]?.scrollIntoView({ behavior: "smooth" });
  // };

  const scrollToTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-white/70 animate-spin" />
          <p className="text-white/60 text-sm">Loading reels...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center gap-5 px-4">
        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
          <Clapperboard className="w-8 h-8 text-white/80" />
        </div>
        <p className="text-white/70 text-sm">Something went wrong</p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
            bg-white text-gray-900 hover:bg-gray-200 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center gap-6 px-4">
        <div className="w-20 h-20 rounded-3xl bg-white/10 flex items-center justify-center border border-white/10">
          <Clapperboard className="w-10 h-10 text-white/80" />
        </div>
        <div className="text-center">
          <p className="font-bold text-white text-xl">No reels yet</p>
          <p className="text-white/50 text-sm mt-1">Be the first to post one</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl
            bg-blue-600 text-white font-semibold text-sm
            shadow-lg shadow-blue-900/40 hover:bg-blue-500 transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Reel
        </button>

        <AnimatePresence>
          {showUpload && <ReelUploadModal onClose={() => setShowUpload(false)} />}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black relative overflow-hidden">
      <div className="relative h-full w-full flex justify-center">
        <div className="relative h-full w-full max-w-[420px] sm:max-w-[460px] md:max-w-[480px] lg:max-w-[520px]">
          <div className="relative h-full w-full overflow-hidden bg-black md:rounded-2xl md:border md:border-white/10 md:shadow-2xl">
            <div
              ref={containerRef}
              className="w-full h-full overflow-y-auto"
              style={{ scrollSnapType: "y mandatory", scrollbarWidth: "none" }}
            >
              {reels.map((reel, idx) => (
                <div
                  key={reel._id}
                  ref={(el) => {
                    cardRefs.current[idx] = el;
                  }}
                  data-index={idx}
                  className="w-full h-full flex-shrink-0"
                  style={{ scrollSnapAlign: "start", height: "100%" }}
                >
                  <ReelCard reel={reel} isActive={activeIndex === idx} />
                </div>
              ))}

              {isFetchingNextPage && (
                <div
                  className="flex items-center justify-center bg-black"
                  style={{ height: "100%", scrollSnapAlign: "start" }}
                >
                  <Loader2 className="w-7 h-7 text-white/40 animate-spin" />
                </div>
              )}
            </div>

            <div className="absolute top-4 left-4 z-40 flex items-center gap-2">
              <Link
                to="/"
                title="Back to home"
                className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 text-white
                  backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>

            {/* <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40">
              <div className="px-3 py-1.5 rounded-full bg-black/45 border border-white/15 backdrop-blur-sm">
                <span className="text-white/90 text-xs font-medium">
                  {activeIndex + 1} / {reels.length}
                </span>
              </div>
            </div> */}

            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2">
              {activeIndex > 0 && (
                <button
                  onClick={() => goToIndex(activeIndex - 1)}
                  className="w-9 h-9 rounded-full bg-black/45 backdrop-blur-sm
                    flex items-center justify-center text-white border border-white/20"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              )}

              {activeIndex < reels.length - 1 && (
                <button
                  onClick={() => goToIndex(activeIndex + 1)}
                  className="w-9 h-9 rounded-full bg-black/45 backdrop-blur-sm
                    flex items-center justify-center text-white border border-white/20"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="absolute bottom-6 right-4 z-40 flex flex-col items-end gap-3">
              {showScrollTop && (
                <button
                  onClick={scrollToTop}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-white
                    bg-black/45 border border-white/20 backdrop-blur-sm"
                >
                  Top
                </button>
              )}

              <Motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => setShowUpload(true)}
                className="w-14 h-14 rounded-2xl bg-blue-600
                  flex items-center justify-center shadow-xl shadow-blue-900/40 border border-white/10"
              >
                <Plus className="w-6 h-6 text-white" />
              </Motion.button>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden md:flex absolute top-6 right-6 z-40">
        <div className="rounded-2xl bg-black/35 border border-white/15 backdrop-blur-md px-4 py-3 text-right shadow-lg">
          <Logo variant="full" alt="Sangya logo" className="h-14 lg:h-16 w-auto ml-auto" />
          <p className="mt-2 text-white text-sm font-semibold">Sangya Reels</p>
          <p className="text-white/60 text-xs max-w-[220px] leading-relaxed">
            Discover, create, and share short videos from your community.
          </p>
        </div>
      </div>

      <AnimatePresence>
        {showUpload && <ReelUploadModal onClose={() => setShowUpload(false)} />}
      </AnimatePresence>
    </div>
  );
}
