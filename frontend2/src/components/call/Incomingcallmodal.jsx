"use client";

// frontend/src/components/call/IncomingCallModal.jsx
import React, { useEffect, useRef } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Video, PhoneCall } from "lucide-react";

/* Subtle pulse ring animation */
const PulseRing = ({ delay = 0 }) => (
  <Motion.div
    className="absolute inset-0 rounded-full border-2 border-emerald-400/60"
    initial={{ scale: 1, opacity: 0.8 }}
    animate={{ scale: 1.8, opacity: 0 }}
    transition={{ duration: 1.6, repeat: Infinity, delay, ease: "easeOut" }}
  />
);

export default function IncomingCallModal({ callState, onAccept, onReject }) {
  const { remoteUser, callType } = callState;
  const audioRef = useRef(null);

  /* Play ringtone */
  useEffect(() => {
    const ctx    = new (window.AudioContext || window.webkitAudioContext)();
    let stopped  = false;

    const ring = () => {
      if (stopped) return;
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type      = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);
      setTimeout(ring, 1800);
    };

    ring();
    return () => { stopped = true; ctx.close(); };
  }, []);

  if (!remoteUser) return null;

  const isVideo = callType === "video";

  return (
    <Motion.div
      initial={{ opacity: 0, y: 80, scale: 0.88 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 60, scale: 0.92 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className="fixed bottom-6 right-6 z-[500] w-80"
    >
      {/* glass card */}
      <div
        className="relative rounded-3xl overflow-hidden shadow-2xl"
        style={{
          background: "linear-gradient(145deg, rgba(15,23,42,0.97) 0%, rgba(30,41,59,0.97) 100%)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset",
        }}
      >
        {/* subtle noise texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative p-5">
          {/* header label */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <Motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
            <span className="text-xs text-gray-400 font-medium tracking-wide uppercase">
              {isVideo ? "Incoming Video Call" : "Incoming Voice Call"}
            </span>
          </div>

          {/* caller info */}
          <div className="flex items-center gap-4 mb-6">
            {/* avatar with pulse rings */}
            <div className="relative flex-shrink-0">
              <div className="relative w-16 h-16">
                <PulseRing delay={0} />
                <PulseRing delay={0.6} />
                <img
                  src={remoteUser.avatar}
                  alt={remoteUser.username || remoteUser.name}
                  className="relative w-16 h-16 rounded-full object-cover ring-2 ring-emerald-400/40 z-10"
                />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-lg leading-tight truncate">
                {remoteUser.name || remoteUser.username}
              </p>
              <p className="text-gray-400 text-sm mt-0.5">@{remoteUser.username}</p>
              <div className="flex items-center gap-1.5 mt-2">
                {isVideo
                  ? <Video className="w-3.5 h-3.5 text-blue-400" />
                  : <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                }
                <span className="text-xs text-gray-400">
                  {isVideo ? "Video call" : "Voice call"}
                </span>
              </div>
            </div>
          </div>

          {/* action buttons */}
          <div className="flex gap-3">
            {/* Decline */}
            <Motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.94 }}
              onClick={onReject}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl
                bg-red-500/15 hover:bg-red-500/25 border border-red-500/20
                text-red-400 hover:text-red-300
                transition-all duration-200 font-semibold text-sm"
            >
              <PhoneOff className="w-4 h-4" />
              Decline
            </Motion.button>

            {/* Accept */}
            <Motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.94 }}
              onClick={onAccept}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl
                bg-emerald-500 hover:bg-emerald-400
                text-white font-semibold text-sm
                shadow-lg shadow-emerald-500/30
                transition-all duration-200"
            >
              <Phone className="w-4 h-4" />
              Accept
            </Motion.button>
          </div>
        </div>
      </div>
    </Motion.div>
  );
}
