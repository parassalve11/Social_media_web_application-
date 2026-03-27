"use client";

// frontend/src/components/call/CallControls.jsx
import React from "react";
import { motion as Motion } from "framer-motion";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  Monitor, MonitorOff, MoreHorizontal,
} from "lucide-react";

/* ── Single control pill button ── */
const CtrlBtn = ({
  Icon, label, onClick, active = false, danger = false, size = "md",
}) => {
  const base = size === "lg" ? "w-16 h-16" : "w-12 h-12";

  const bg = danger
    ? "bg-red-500 hover:bg-red-400 shadow-red-500/40"
    : active
    ? "bg-gray-700 hover:bg-gray-600"
    : "bg-white/10 hover:bg-white/20";

  return (
    <Motion.button
      whileHover={{ scale: 1.08, y: -2 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      title={label}
      className={`${base} ${bg} rounded-2xl flex flex-col items-center justify-center
        transition-all duration-200 shadow-lg group relative`}
    >
      <Icon
        className={`${size === "lg" ? "w-6 h-6" : "w-5 h-5"}
          ${danger ? "text-white" : active ? "text-white" : "text-white/80 group-hover:text-white"}
          transition-colors`}
      />
      <span className={`text-[9px] mt-1 font-medium tracking-wide
        ${danger ? "text-white/80" : "text-white/50 group-hover:text-white/80"}
        transition-colors`}>
        {label}
      </span>
    </Motion.button>
  );
};

/* ── Duration formatter ── */
export const formatDuration = (secs) => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

/* ════════════════════════════════════════════════ */

export default function CallControls({
  callType,
  isMuted,
  isVideoOff,
  isScreenSharing,
  duration,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onEndCall,
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Duration */}
      <div
        className="px-4 py-1.5 rounded-full text-sm font-mono font-semibold text-white/70
          bg-white/5 border border-white/10"
      >
        {formatDuration(duration)}
      </div>

      {/* Controls row */}
      <div className="flex items-end gap-3">
        {/* Mute */}
        <CtrlBtn
          Icon={isMuted ? MicOff : Mic}
          label={isMuted ? "Unmute" : "Mute"}
          active={isMuted}
          onClick={onToggleMute}
        />

        {/* Video (only for video calls) */}
        {callType === "video" && (
          <CtrlBtn
            Icon={isVideoOff ? VideoOff : Video}
            label={isVideoOff ? "Camera on" : "Camera"}
            active={isVideoOff}
            onClick={onToggleVideo}
          />
        )}

        {/* End call — centre, larger */}
        <CtrlBtn
          Icon={PhoneOff}
          label="End"
          danger
          size="lg"
          onClick={onEndCall}
        />

        {/* Screen share (video calls only) */}
        {callType === "video" && (
          <CtrlBtn
            Icon={isScreenSharing ? MonitorOff : Monitor}
            label={isScreenSharing ? "Stop" : "Share"}
            active={isScreenSharing}
            onClick={onToggleScreenShare}
          />
        )}

        {/* More options placeholder */}
        <CtrlBtn
          Icon={MoreHorizontal}
          label="More"
          onClick={() => {}}
        />
      </div>
    </div>
  );
}
