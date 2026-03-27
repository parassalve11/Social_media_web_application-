"use client";

// frontend/src/components/UI/NotificationToast.jsx

import React, { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, UserPlus, X, Bell } from "lucide-react";
import { useNotificationSocket } from "../../store/notifications/useNotifications";

/* ── type config ── */
const TYPE = {
  like:    { Icon: Heart,         color: "text-red-500",    bg: "bg-red-50",    label: "liked your post"          },
  comment: { Icon: MessageCircle, color: "text-green-500",  bg: "bg-green-50",  label: "commented on your post"   },
  follow:  { Icon: UserPlus,      color: "text-purple-500", bg: "bg-purple-50", label: "started following you"    },
};

const AUTO_DISMISS_MS = 5000;

export default function NotificationToast() {
  const [toasts, setToasts] = useState([]);
  const timers              = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    setToasts((prev) => prev.filter((t) => t._id !== id));
  }, []);

  const handleNew = useCallback(
    (notification) => {
      if (!notification?.relatedUser) return;

      setToasts((prev) => {
        // max 3 toasts at once
        const next = [notification, ...prev].slice(0, 3);
        return next;
      });

      // auto-dismiss
      timers.current[notification._id] = setTimeout(
        () => dismiss(notification._id),
        AUTO_DISMISS_MS
      );
    },
    [dismiss]
  );

  useNotificationSocket(handleNew);

  return (
    /* Fixed bottom-right stack */
    <div className="fixed bottom-6 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((n) => {
          const cfg  = TYPE[n.type] ?? TYPE.follow;
          const user = n.relatedUser;

          return (
            <Motion.div
              key={n._id}
              layout
              initial={{ opacity: 0, x: 80, scale: 0.9 }}
              animate={{ opacity: 1, x: 0,  scale: 1   }}
              exit={{    opacity: 0, x: 80, scale: 0.85 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="pointer-events-auto w-80 bg-white rounded-2xl shadow-xl
                border border-gray-100 overflow-hidden flex items-start gap-3 p-3.5"
            >
              {/* progress bar */}
              <Motion.div
                className="absolute bottom-0 left-0 h-0.5 bg-blue-400"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: AUTO_DISMISS_MS / 1000, ease: "linear" }}
              />

              {/* type icon badge */}
              <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center ${cfg.bg}`}>
                <cfg.Icon className={`w-4 h-4 ${cfg.color}`} />
              </div>

              {/* avatar + text */}
              <Link
                href={`/profile/${user.username}`}
                onClick={() => dismiss(n._id)}
                className="flex items-start gap-2.5 flex-1 min-w-0"
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-2 ring-white"
                />
                <div className="min-w-0">
                  <p className="text-sm text-gray-800 leading-snug">
                    <span className="font-semibold">{user.name}</span>{" "}
                    <span className="text-gray-500">{cfg.label}</span>
                  </p>
                  {n.relatedPost?.content && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {n.relatedPost.content}
                    </p>
                  )}
                </div>
              </Link>

              {/* dismiss */}
              <button
                onClick={() => dismiss(n._id)}
                className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center
                  text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-all"
              >
                <X className="w-3 h-3" />
              </button>
            </Motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
