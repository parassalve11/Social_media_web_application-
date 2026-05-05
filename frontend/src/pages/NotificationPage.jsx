"use client";

// frontend/src/pages/NotificationPage.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  Heart, MessageCircle, UserPlus,
  Bell, BellOff, CheckCheck, Trash2,
  Loader2, RefreshCw,
} from "lucide-react";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  useNotificationSocket,
} from "../store/notifications/useNotifications";

/* ══════════════════════════════════════════════
   Type config
══════════════════════════════════════════════ */
const TYPE = {
  like: {
    Icon:  Heart,
    color: "text-red-500",
    bg:    "bg-red-50",
    ring:  "ring-red-200",
    label: (name) => <><strong>{name}</strong> liked your post</>,
  },
  comment: {
    Icon:  MessageCircle,
    color: "text-green-500",
    bg:    "bg-green-50",
    ring:  "ring-green-200",
    label: (name) => <><strong>{name}</strong> commented on your post</>,
  },
  follow: {
    Icon:  UserPlus,
    color: "text-purple-500",
    bg:    "bg-purple-50",
    ring:  "ring-purple-200",
    label: (name) => <><strong>{name}</strong> started following you</>,
  },
};

/* ══════════════════════════════════════════════
   Filter tabs
══════════════════════════════════════════════ */
const TABS = [
  { id: "all",     label: "All"      },
  { id: "unread",  label: "Unread"   },
  { id: "like",    label: "Likes"    },
  { id: "comment", label: "Comments" },
  { id: "follow",  label: "Follows"  },
];

/* ══════════════════════════════════════════════
   Single notification row
══════════════════════════════════════════════ */
const NotifRow = ({ notification: n, onRead, onDelete }) => {
  const cfg  = TYPE[n.type] ?? TYPE.follow;
  const user = n.relatedUser;

  if (!user) return null;

  return (
    <Motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{    opacity: 0, x: 40, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`relative flex items-start gap-3 p-4 rounded-2xl border transition-all group
        ${!n.read
          ? "bg-blue-50/60 border-blue-100"
          : "bg-white border-gray-100 hover:bg-gray-50"
        }`}
    >
      {/* unread dot */}
      {!n.read && (
        <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
      )}

      {/* avatar + type badge */}
      <div className="relative flex-shrink-0">
        <Link to={`/profile/${user.username}`}>
          <img
            src={user.avatar}
            alt={user.name}
            className="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow-sm"
          />
        </Link>
        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full
          flex items-center justify-center ring-2 ring-white ${cfg.bg}`}>
          <cfg.Icon className={`w-2.5 h-2.5 ${cfg.color}`} />
        </div>
      </div>

      {/* content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-sm text-gray-700 leading-snug">
          <Link
            to={`/profile/${user.username}`}
            className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
          >
            {user.name}
          </Link>{" "}
          <span className="text-gray-500">
            {n.type === "like"    && "liked your post"}
            {n.type === "comment" && "commented on your post"}
            {n.type === "follow"  && "started following you"}
          </span>
        </p>

        {/* post preview */}
        {n.relatedPost && (
          <Link
            to={`/post/${n.relatedPost._id}`}
            className="inline-block mt-1.5 px-2 py-1 rounded-lg bg-white border border-gray-100
              text-xs text-gray-500 hover:border-blue-200 hover:text-blue-600 transition-all
              max-w-[240px] truncate shadow-sm"
          >
            {n.relatedPost.content || "View post →"}
          </Link>
        )}

        <p className="text-[11px] text-gray-400 mt-1.5">
          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
        </p>
      </div>

      {/* actions — visible on hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
        {!n.read && (
          <button
            onClick={() => onRead(n._id)}
            title="Mark as read"
            className="w-7 h-7 rounded-lg flex items-center justify-center
              text-blue-400 hover:bg-blue-100 hover:text-blue-600 transition-all"
          >
            <CheckCheck className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={() => onDelete(n._id)}
          title="Delete"
          className="w-7 h-7 rounded-lg flex items-center justify-center
            text-gray-300 hover:bg-red-50 hover:text-red-500 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </Motion.div>
  );
};

/* ══════════════════════════════════════════════
   Page
══════════════════════════════════════════════ */
export default function NotificationPage() {
  const [activeTab, setActiveTab] = useState("all");

  const { data: notifications = [], isLoading, isError, refetch } = useNotifications();
  const { mutate: markRead    } = useMarkAsRead();
  const { mutate: markAll, isPending: markingAll } = useMarkAllAsRead();
  const { mutate: deleteNotif } = useDeleteNotification();

  // Keep socket alive while page is open — cache updates happen in the hook
  useNotificationSocket();

  /* filter */
  const filtered = notifications.filter((n) => {
    if (activeTab === "all")    return true;
    if (activeTab === "unread") return !n.read;
    return n.type === activeTab;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 pb-16">
      <div className="max-w-2xl mx-auto px-4 pt-6">

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-200">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 leading-tight">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-xs text-blue-500 font-medium">
                  {unreadCount} unread
                </p>
              )}
            </div>
          </div>

          {/* mark all read */}
          {unreadCount > 0 && (
            <Motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => markAll()}
              disabled={markingAll}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                text-blue-600 bg-blue-50 border border-blue-100
                hover:bg-blue-100 hover:border-blue-200
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all shadow-sm"
            >
              {markingAll
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <CheckCheck className="w-3.5 h-3.5" />
              }
              Mark all read
            </Motion.button>
          )}
        </div>

        {/* ── TAB FILTER ── */}
        <div className="flex items-center bg-white rounded-2xl shadow-sm border border-gray-100 p-1 gap-0.5 mb-5 overflow-x-auto"
          style={{ scrollbarWidth: "none" }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const count    = tab.id === "unread"
              ? unreadCount
              : tab.id === "all"
                ? notifications.length
                : notifications.filter((n) => n.type === tab.id).length;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{ color: isActive ? "white" : "#6b7280" }}
              >
                {isActive && (
                  <Motion.div
                    layoutId="notif-tab"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 shadow-sm"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
                {count > 0 && (
                  <span className={`relative z-10 text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center
                    ${isActive ? "bg-white/25 text-white" : "bg-gray-100 text-gray-500"}`}>
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── CONTENT ── */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />
            <p className="text-sm text-gray-400">Loading notifications…</p>
          </div>

        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
              <Bell className="w-7 h-7 text-red-300" />
            </div>
            <p className="text-sm text-gray-500">Failed to load notifications</p>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm transition-all"
            >
              <RefreshCw className="w-4 h-4" /> Try again
            </button>
          </div>

        ) : filtered.length === 0 ? (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 gap-4"
          >
            <div className="w-16 h-16 rounded-3xl bg-gray-50 border border-gray-100 flex items-center justify-center shadow-sm">
              <BellOff className="w-8 h-8 text-gray-300" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-600">
                {activeTab === "unread" ? "All caught up!" : "No notifications yet"}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {activeTab === "unread"
                  ? "You have no unread notifications."
                  : "When someone likes or comments on your posts, you'll see it here."}
              </p>
            </div>
          </Motion.div>

        ) : (
          <div className="flex flex-col gap-2">
            <AnimatePresence mode="popLayout">
              {filtered.map((n) => (
                <NotifRow
                  key={n._id}
                  notification={n}
                  onRead={markRead}
                  onDelete={deleteNotif}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

      </div>
    </div>
  );
}
