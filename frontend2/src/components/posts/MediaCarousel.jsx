"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

const DRAG_THRESHOLD = 6;

export default function MediaCarousel({ items = [], className = "" }) {
  const scrollerRef = useRef(null);
  const pointerStartX = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const videoRefs = useRef([]);
  const holdStateRef = useRef({});
  const holdTimerRef = useRef({});
  const suppressClickRef = useRef({});
  const activeIndexRef = useRef(0);
  const [overlayMap, setOverlayMap] = useState({});
  const overlayTimersRef = useRef({});

  useEffect(() => {
    setActiveIndex(0);
  }, [items.length]);

  useEffect(() => {
    videoRefs.current = videoRefs.current.slice(0, items.length);
  }, [items.length]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const handleScroll = () => {
      const width = el.clientWidth || 1;
      const index = Math.round(el.scrollLeft / width);
      setActiveIndex(Math.min(Math.max(index, 0), items.length - 1));
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [items.length]);

  useEffect(() => {
    return () => {
      Object.values(holdTimerRef.current).forEach((timer) => clearTimeout(timer));
      Object.values(overlayTimersRef.current).forEach((timer) => clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      if (index === activeIndex) {
        video.muted = true;
        const playAttempt = video.play();
        if (playAttempt && typeof playAttempt.catch === "function") {
          playAttempt.catch(() => {});
        }
      } else {
        video.pause();
        video.playbackRate = 1;
      }
    });
  }, [activeIndex, items.length]);

  useEffect(() => {
    const previousIndex = activeIndexRef.current;
    activeIndexRef.current = activeIndex;
    setOverlayMap((prev) => ({
      ...prev,
      [previousIndex]: { ...prev[previousIndex], visible: false },
    }));
  }, [activeIndex]);

  if (!items.length) return null;

  const scrollToIndex = (index) => {
    const el = scrollerRef.current;
    if (!el) return;
    const width = el.clientWidth || 1;
    el.scrollTo({ left: width * index, behavior: "smooth" });
  };

  const handlePointerDown = (e) => {
    pointerStartX.current = e.clientX;
    setIsDragging(false);
  };

  const handlePointerMove = (e) => {
    if (Math.abs(e.clientX - pointerStartX.current) > DRAG_THRESHOLD) {
      setIsDragging(true);
    }
  };

  const handlePointerUp = () => {
    setTimeout(() => setIsDragging(false), 0);
  };

  const showOverlay = (index, type, autoHide = true) => {
    setOverlayMap((prev) => ({
      ...prev,
      [index]: { type, visible: true },
    }));

    if (overlayTimersRef.current[index]) {
      clearTimeout(overlayTimersRef.current[index]);
    }

    if (autoHide) {
      overlayTimersRef.current[index] = setTimeout(() => {
        setOverlayMap((prev) => ({
          ...prev,
          [index]: { ...prev[index], visible: false },
        }));
      }, 2000);
    }
  };

  const handleTogglePlay = (index) => {
    const video = videoRefs.current[index];
    if (!video) return;
    const willPlay = video.paused;
    if (willPlay) {
      const playAttempt = video.play();
      if (playAttempt && typeof playAttempt.catch === "function") {
        playAttempt.catch(() => {});
      }
    } else {
      video.pause();
    }
    showOverlay(index, willPlay ? "play" : "pause", true);
  };

  const handleHoldStart = (index, event) => {
    const video = videoRefs.current[index];
    if (!video) return;
    holdStateRef.current[index] = {
      wasPaused: video.paused,
      active: false,
      startX: event?.clientX ?? 0,
      startY: event?.clientY ?? 0,
    };
    suppressClickRef.current[index] = false;

    if (holdTimerRef.current[index]) {
      clearTimeout(holdTimerRef.current[index]);
    }

    holdTimerRef.current[index] = setTimeout(() => {
      holdStateRef.current[index].active = true;
      showOverlay(index, "2x", true);
      video.playbackRate = 2;
      const playAttempt = video.play();
      if (playAttempt && typeof playAttempt.catch === "function") {
        playAttempt.catch(() => {});
      }
    }, 200);
  };

  const handleHoldMove = (index, event) => {
    const state = holdStateRef.current[index];
    if (!state || state.active) return;
    const deltaX = Math.abs((event?.clientX ?? 0) - state.startX);
    const deltaY = Math.abs((event?.clientY ?? 0) - state.startY);
    if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
      if (holdTimerRef.current[index]) {
        clearTimeout(holdTimerRef.current[index]);
      }
    }
  };

  const handleHoldEnd = (index) => {
    const video = videoRefs.current[index];
    if (!video) return;
    if (holdTimerRef.current[index]) {
      clearTimeout(holdTimerRef.current[index]);
    }

    const state = holdStateRef.current[index];
    if (state?.active) {
      video.playbackRate = 1;
      if (state.wasPaused) {
        video.pause();
      }
      suppressClickRef.current[index] = true;
      showOverlay(index, state.wasPaused ? "pause" : "play", true);
    }

    holdStateRef.current[index] = { wasPaused: false, active: false };
  };

  return (
    <div className={`relative w-full overflow-hidden rounded-2xl bg-gray-50 ${className}`}>
      <div
        ref={scrollerRef}
        className="flex h-full w-full overflow-x-auto snap-x snap-mandatory scroll-smooth"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={(e) => {
          if (isDragging) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {items.map((item, index) => (
          <div key={`${item.url}-${index}`} className="relative h-full w-full flex-none snap-center">
            {item.type === "video" ? (
              <div className="relative w-full h-full bg-black">
                <video
                  src={item.url}
                  ref={(el) => (videoRefs.current[index] = el)}
                  className="w-full h-full object-cover"
                  playsInline
                  preload="metadata"
                  muted
                  onClick={(e) => {
                    if (suppressClickRef.current[index]) {
                      suppressClickRef.current[index] = false;
                      return;
                    }
                    handleTogglePlay(index);
                  }}
                  onPointerDown={(event) => handleHoldStart(index, event)}
                  onPointerMove={(event) => handleHoldMove(index, event)}
                  onPointerUp={() => handleHoldEnd(index)}
                  onPointerLeave={() => handleHoldEnd(index)}
                  onPointerCancel={() => handleHoldEnd(index)}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    className={`inline-flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white shadow-lg transition-opacity duration-300 ${
                      overlayMap[index]?.visible ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    {overlayMap[index]?.type === "2x" ? (
                      <span>2x</span>
                    ) : overlayMap[index]?.type === "pause" ? (
                      <>
                        <Pause size={14} />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play size={14} />
                        Play
                      </>
                    )}
                  </div>
                </div>
                <div className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-semibold text-white">
                  <Play size={10} />
                  Video
                </div>
              </div>
            ) : (
              <img
                src={item.url}
                alt="Post media"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            )}
          </div>
        ))}
      </div>

      {items.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              scrollToIndex(Math.max(activeIndex - 1, 0));
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-700 shadow-md transition hover:bg-white hover:shadow-lg"
            aria-label="Previous media"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              scrollToIndex(Math.min(activeIndex + 1, items.length - 1));
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-700 shadow-md transition hover:bg-white hover:shadow-lg"
            aria-label="Next media"
          >
            <ChevronRight size={18} />
          </button>

          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 backdrop-blur">
            {items.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  scrollToIndex(index);
                }}
                className={`h-1.5 w-1.5 rounded-full transition ${
                  index === activeIndex ? "bg-white" : "bg-white/50"
                }`}
                aria-label={`Go to media ${index + 1}`}
              />
            ))}
            <span className="ml-2 text-[10px] font-semibold text-white">
              {activeIndex + 1}/{items.length}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
