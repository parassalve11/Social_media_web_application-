"use client";

// frontend/src/components/message/status/StatusRing.jsx
import React from "react";
import { motion as Motion } from "framer-motion";

/**
 * StatusRing
 * @param {object}  user        - { username, avatar }
 * @param {boolean} hasUnseen   - show colorful ring vs grey
 * @param {boolean} isOwn       - show "+" overlay (your own status slot)
 * @param {boolean} isEmpty     - no status exists yet (for own slot)
 * @param {function} onClick
 * @param {string}  size        - "sm" | "md" (default "md")
 */
export default function StatusRing({
  user,
  hasUnseen = false,
  isOwn = false,
  isEmpty = false,
  onClick,
  size = "md",
}) {
  const dim = size === "sm" ? 48 : 58;
  const imgDim = size === "sm" ? 40 : 48;
  const offset = (dim - imgDim) / 2;

  /* ring gradient: unseen → vivid, seen → muted grey, own-empty → dashed blue */
  const ringStyle = isEmpty
    ? { stroke: "#93c5fd", strokeDasharray: "4 2" }
    : hasUnseen
    ? {}           // handled via SVG gradient
    : { stroke: "#d1d5db" };

  const avatar = user?.avatar || user?.profilePicture;
  const label  = user?.username ?? "You";

  return (
    <Motion.button
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 flex-shrink-0 focus:outline-none"
      style={{ width: dim + 16 }}
      aria-label={isOwn ? "My status" : `${label}'s status`}
    >
      {/* ring + avatar */}
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg
          width={dim}
          height={dim}
          className="absolute inset-0"
          style={{ transform: "rotate(-90deg)" }}
        >
          {/* gradient def — only rendered when hasUnseen */}
          {hasUnseen && (
            <defs>
              <linearGradient id={`sg-${user?._id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor="#f97316" />
                <stop offset="50%"  stopColor="#ec4899" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          )}

          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={(dim - 4) / 2}
            fill="none"
            strokeWidth={2.5}
            stroke={
              isEmpty
                ? "#93c5fd"
                : hasUnseen
                ? `url(#sg-${user?._id})`
                : "#d1d5db"
            }
            strokeDasharray={isEmpty ? "4 2.5" : undefined}
            strokeLinecap="round"
          />
        </svg>

        {/* avatar */}
        <img
          src={avatar}
          alt={label}
          style={{
            width: imgDim,
            height: imgDim,
            top: offset,
            left: offset,
          }}
          className="absolute rounded-full object-cover bg-gray-100"
        />

        {/* own slot "+" badge */}
        {isOwn && (
          <div
            className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-blue-500
              flex items-center justify-center shadow-md ring-2 ring-white z-10"
          >
            <span className="text-white text-xs font-bold leading-none">+</span>
          </div>
        )}
      </div>

      {/* label */}
      <span className="text-[10px] text-gray-600 font-medium truncate w-full text-center leading-tight">
        {isOwn ? "My Status" : label}
      </span>
    </Motion.button>
  );
}
