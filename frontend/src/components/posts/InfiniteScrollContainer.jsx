"use client";

import React, { useEffect, useRef } from "react";
import { useInView } from "react-intersection-observer";

/**
 * InfiniteScrollContainer
 * - children: list of items / posts
 * - onBottomReached: callback to fetch more (kept in a ref so changing parent function identity won't trigger extra behavior)
 * - className: container classes
 * - disabled: optional boolean to prevent calling onBottomReached while fetching
 *
 * Usage:
 *   <InfiniteScrollContainer
 *     onBottomReached={handleBottomReached}
 *     disabled={isFetchingNextPage}
 *   >
 *     {posts.map(p => <Post key={p._id} post={p} />)}
 *   </InfiniteScrollContainer>
 */
const InfiniteScrollContainer = ({ children, onBottomReached, className = "", disabled = false }) => {
  const callbackRef = useRef(onBottomReached);

  // keep latest callback available without changing identity of anything that useInView depends on
  useEffect(() => {
    callbackRef.current = onBottomReached;
  }, [onBottomReached]);

  const { ref, inView } = useInView({
    rootMargin: "200px",
    // do not pass onChange here — we'll react to `inView` in an effect
  });

  useEffect(() => {
    if (inView && !disabled && typeof callbackRef.current === "function") {
      try {
        callbackRef.current();
      } catch (err) {
        // swallow - caller should handle errors
        console.error("onBottomReached handler error:", err);
      }
    }
  }, [inView, disabled]);

  return (
    <div className={className}>
      {children}
      {/* sentinel element observed by IntersectionObserver */}
      <div ref={ref} />
    </div>
  );
};

export default React.memo(InfiniteScrollContainer);
