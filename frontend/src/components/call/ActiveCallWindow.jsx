"use client";

// frontend/src/components/call/ActiveCallWindow.jsx
import React, { useEffect, useRef, useState } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { MicOff, VideoOff, Wifi, WifiOff } from "lucide-react";
import CallControls from "./CallControls";
import { CALL_STATUS } from "../../store/call/useCall";

/* ── Draggable PiP wrapper ── */
function DraggablePiP({ children }) {
  const ref          = useRef(null);
  const isDragging   = useRef(false);
  const startPos     = useRef({ x: 0, y: 0 });
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const onMouseDown = (e) => {
    isDragging.current = true;
    startPos.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };
  const onMouseMove = (e) => {
    if (!isDragging.current) return;
    setPos({ x: e.clientX - startPos.current.x, y: e.clientY - startPos.current.y });
  };
  const onMouseUp = () => {
    isDragging.current = false;
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };

  // Touch support
  const onTouchStart = (e) => {
    const t = e.touches[0];
    isDragging.current = true;
    startPos.current = { x: t.clientX - pos.x, y: t.clientY - pos.y };
  };
  const onTouchMove = (e) => {
    if (!isDragging.current) return;
    const t = e.touches[0];
    setPos({ x: t.clientX - startPos.current.x, y: t.clientY - startPos.current.y });
  };
  const onTouchEnd = () => { isDragging.current = false; };

  return (
    <div
      ref={ref}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)`, cursor: "grab" }}
      className="touch-none"
    >
      {children}
    </div>
  );
}

/* ── Animated waveform (audio-only) ── */
const AudioWave = ({ active }) => (
  <div className="flex items-end gap-1 h-12">
    {[...Array(7)].map((_, i) => (
      <Motion.div
        key={i}
        className="w-1.5 rounded-full bg-emerald-400"
        animate={active ? {
          height: ["8px", `${20 + Math.random() * 24}px`, "8px"],
        } : { height: "4px" }}
        transition={{
          duration: 0.6 + i * 0.07,
          repeat: active ? Infinity : 0,
          repeatType: "mirror",
          delay: i * 0.08,
        }}
      />
    ))}
  </div>
);

/* ════════════════════════════════════════════════════ */

export default function ActiveCallWindow({
  callState,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onEndCall,
}) {
  const {
    status, callType, remoteUser,
    localStream, remoteStream,
    isMuted, isVideoOff, isScreenSharing,
    remoteAudioMuted, remoteVideoOff,
    duration,
  } = callState;

  const localVideoRef  = useRef(null);
  const remoteVideoRef = useRef(null);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef(null);
  const [connectionBad, setConnectionBad] = useState(false);

  /* attach streams to video elements */
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  /* auto-hide controls */
  const resetHideTimer = () => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (status === CALL_STATUS.ACTIVE) {
      hideTimer.current = setTimeout(() => setShowControls(false), 4000);
    }
  };

  useEffect(() => {
    resetHideTimer();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, [status]);

  const isConnecting = status === CALL_STATUS.CONNECTING;
  const isAudioOnly  = callType === "audio";

  return (
    <Motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[400] flex items-center justify-center bg-black"
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
    >
      {/* ══ REMOTE VIDEO (or audio-only background) ══ */}
      {callType === "video" && !remoteVideoOff ? (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}  // mirror for natural feel
        />
      ) : (
        /* Audio-only or remote video off background */
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at 40% 40%, #0f2744 0%, #060d1a 70%)",
          }}
        />
      )}

      {/* dark vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* ══ CONNECTING OVERLAY ══ */}
      <AnimatePresence>
        {isConnecting && (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6"
          >
            {/* avatar with ripple */}
            <div className="relative">
              {[...Array(3)].map((_, i) => (
                <Motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border border-white/20"
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 2.2 + i * 0.5, opacity: 0 }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.55, ease: "easeOut" }}
                />
              ))}
              <img
                src={remoteUser?.avatar}
                alt={remoteUser?.username}
                className="w-28 h-28 rounded-full object-cover ring-4 ring-white/20 shadow-2xl"
              />
            </div>
            <div className="text-center">
              <p className="text-white text-2xl font-bold tracking-tight">
                {remoteUser?.name || remoteUser?.username}
              </p>
              <Motion.p
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-white/50 text-sm mt-1 font-light tracking-widest"
              >
                {status === CALL_STATUS.OUTGOING ? "Calling…" : "Connecting…"}
              </Motion.p>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>

      {/* ══ AUDIO-ONLY ACTIVE STATE ══ */}
      {!isConnecting && isAudioOnly && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 z-10">
          <div className="relative">
            <img
              src={remoteUser?.avatar}
              alt={remoteUser?.username}
              className="w-32 h-32 rounded-full object-cover ring-4 ring-emerald-500/30 shadow-2xl"
            />
            {remoteAudioMuted && (
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg ring-2 ring-black">
                <MicOff className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          <div className="text-center">
            <p className="text-white text-3xl font-bold tracking-tight">
              {remoteUser?.name || remoteUser?.username}
            </p>
            <p className="text-emerald-400 text-sm mt-1">On a call</p>
          </div>
          <AudioWave active={!remoteAudioMuted} />
        </div>
      )}

      {/* ══ LOCAL PiP (video calls only) ══ */}
      {callType === "video" && !isConnecting && (
        <div className="absolute bottom-28 right-4 z-20">
          <DraggablePiP>
            <Motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative w-32 h-44 sm:w-40 sm:h-56 rounded-2xl overflow-hidden
                ring-2 ring-white/20 shadow-2xl"
            >
              {isVideoOff ? (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <VideoOff className="w-6 h-6 text-white/40" />
                </div>
              ) : (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted        // always mute local to avoid echo
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ transform: "scaleX(-1)" }}
                />
              )}
              {/* muted indicator */}
              {isMuted && (
                <div className="absolute top-1.5 left-1.5 w-6 h-6 bg-red-500/90 rounded-full flex items-center justify-center">
                  <MicOff className="w-3 h-3 text-white" />
                </div>
              )}
              {/* "You" label */}
              <div className="absolute bottom-1.5 right-2">
                <span className="text-[10px] text-white/60 font-medium">You</span>
              </div>
            </Motion.div>
          </DraggablePiP>
        </div>
      )}

      {/* ══ REMOTE STATUS BADGES ══ */}
      {!isConnecting && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {remoteAudioMuted && (
            <Motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
                bg-black/50 border border-white/10 backdrop-blur-sm"
            >
              <MicOff className="w-3 h-3 text-red-400" />
              <span className="text-xs text-white/70">Muted</span>
            </Motion.div>
          )}
          {remoteVideoOff && callType === "video" && (
            <Motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
                bg-black/50 border border-white/10 backdrop-blur-sm"
            >
              <VideoOff className="w-3 h-3 text-yellow-400" />
              <span className="text-xs text-white/70">Camera off</span>
            </Motion.div>
          )}
        </div>
      )}

      {/* ══ CONTROLS (auto-hide) ══ */}
      <AnimatePresence>
        {showControls && (
          <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-0 left-0 right-0 z-30 pb-8 pt-16"
            style={{
              background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)",
            }}
          >
            {/* remote user name */}
            {!isConnecting && (
              <div className="text-center mb-4">
                <p className="text-white font-semibold text-lg drop-shadow-md">
                  {remoteUser?.name || remoteUser?.username}
                </p>
              </div>
            )}

            <CallControls
              callType={callType}
              isMuted={isMuted}
              isVideoOff={isVideoOff}
              isScreenSharing={isScreenSharing}
              duration={duration}
              onToggleMute={onToggleMute}
              onToggleVideo={onToggleVideo}
              onToggleScreenShare={onToggleScreenShare}
              onEndCall={onEndCall}
            />
          </Motion.div>
        )}
      </AnimatePresence>
    </Motion.div>
  );
}
