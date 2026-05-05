"use client";

// frontend/src/components/call/CallButton.jsx
import React from "react";
import { motion as Motion } from "framer-motion";
import { Phone, Video } from "lucide-react";
import { CALL_STATUS } from "../../store/call/useCall";

export default function CallButton({ remoteUser, callState, onCall }) {
  const isBusy = callState?.status !== CALL_STATUS.IDLE;

  return (
    <div className="flex items-center gap-1">
      {/* Audio call */}
      <Motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => !isBusy && onCall(remoteUser, "audio")}
        disabled={isBusy}
        title="Voice call"
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200
          ${isBusy
            ? "text-gray-300 cursor-not-allowed"
            : "text-gray-500 hover:text-emerald-600 hover:bg-emerald-50"
          }`}
      >
        <Phone className="w-4.5 h-4.5 w-[18px] h-[18px]" />
      </Motion.button>

      {/* Video call */}
      <Motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => !isBusy && onCall(remoteUser, "video")}
        disabled={isBusy}
        title="Video call"
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200
          ${isBusy
            ? "text-gray-300 cursor-not-allowed"
            : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"
          }`}
      >
        <Video className="w-[18px] h-[18px]" />
      </Motion.button>
    </div>
  );
}
