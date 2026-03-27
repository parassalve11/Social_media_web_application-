"use client";

// frontend/src/components/message/chat/MessageBubble.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Check, CheckCheck, Trash2, Edit2, Smile, Copy, MoreVertical, X } from "lucide-react";
import { useChat } from "../../../store/chat/useChat";
import axiosInstance from "../../../lib/axiosIntance";

/* ─── emoji-only detection ─── */
const EMOJI_RE = /^(\p{Extended_Pictographic}|\s)+$/u;
const countEmojis = (t) => [...(t?.matchAll(/\p{Extended_Pictographic}/gu) ?? [])].length;
const isEmojiOnly = (text) => Boolean(text && EMOJI_RE.test(text));
const emojiSizeClass = (text) => {
  if (!isEmojiOnly(text)) return null;
  const n = countEmojis(text);
  if (n === 1) return "text-5xl";
  if (n <= 3) return "text-3xl";
  return null;
};

/* ─── read receipt ─── */
const ReadReceipt = ({ status, isMe }) => {
  if (!isMe) return null;
  if (status === "read") return <CheckCheck className="w-3 h-3 text-blue-200 flex-shrink-0" />;
  if (status === "delivered") return <CheckCheck className="w-3 h-3 text-blue-300/50 flex-shrink-0" />;
  return <Check className="w-3 h-3 text-blue-300/50 flex-shrink-0" />;
};

/* ─── reaction emojis ─── */
const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

/* ─── single menu row ─── */
const MenuRow = ({ icon: Icon, label, onClick, danger }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150 text-left
      ${danger
        ? "text-red-500 hover:bg-red-50"
        : "text-gray-700 hover:bg-gray-50"}`}
  >
    <Icon className={`w-4 h-4 flex-shrink-0 ${danger ? "text-red-400" : "text-gray-400"}`} />
    <span className="font-medium">{label}</span>
  </button>
);

/* ════════════════════════════════════════════════════════ */

export default function MessageBubble({ message, currentUser, isFirst, isLast }) {
  /* local state */
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.content ?? "");
  const [editLoading, setEditLoading] = useState(false);
  const [deleteStep, setDeleteStep] = useState(false); // confirm step
  const [localContent, setLocalContent] = useState(message.content ?? "");
  const [localReactions, setLocalReactions] = useState(message.reactions ?? []);

  const rootRef   = useRef(null);
  const editRef   = useRef(null);
  const lpTimer   = useRef(null);

  const { addReaction, deleteMessage, deleteMessageSocket } = useChat();

  const senderId = message?.sender?._id ?? message?.sender;
  const isMe     = String(currentUser?._id) === String(senderId);
  const emojiCls = message.contentType === "text" ? emojiSizeClass(localContent) : null;
  const isPureEmoji = Boolean(emojiCls);

  /* sync from socket updates */
  useEffect(() => { setLocalReactions(message.reactions ?? []); }, [message.reactions]);

  /* close on outside click */
  useEffect(() => {
    if (!showMenu && !showReactions) return;
    const fn = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setShowMenu(false); setShowReactions(false); setDeleteStep(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [showMenu, showReactions]);

  /* focus textarea on edit */
  useEffect(() => {
    if (editing && editRef.current) {
      editRef.current.focus();
      const l = editValue.length;
      editRef.current.setSelectionRange(l, l);
    }
  }, [editing]);

  /* mobile long press */
  const onTouchStart = () => { lpTimer.current = setTimeout(() => setShowMenu(true), 500); };
  const onTouchEnd   = () => { if (lpTimer.current) clearTimeout(lpTimer.current); };

  /* ── REACT (BUG FIXED: message._id not message.id) ── */
  const handleReact = useCallback(async (emoji) => {
    setShowReactions(false);
    setShowMenu(false);

    /* optimistic update */
    setLocalReactions((prev) => {
      const myIdx = prev.findIndex(
        (r) => String(r.user?._id ?? r.user) === String(currentUser?._id) && r.emoji === emoji
      );
      if (myIdx > -1) return prev.filter((_, i) => i !== myIdx); // toggle off
      const rest = prev.filter((r) => String(r.user?._id ?? r.user) !== String(currentUser?._id));
      return [...rest, { user: { _id: currentUser._id }, emoji }];
    });

    try {
      await addReaction(message._id, emoji); // ← was message.id (undefined) — now fixed
    } catch {
      setLocalReactions(message.reactions ?? []); // revert
    }
  }, [addReaction, message._id, message.reactions, currentUser?._id]);

  /* ── EDIT ── */
  const handleEditSave = useCallback(async () => {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === localContent) { setEditing(false); return; }
    setEditLoading(true);
    try {
      await axiosInstance.put(`/message/messages/${message._id}`, { content: trimmed });
      setLocalContent(trimmed);
    } catch (err) {
      console.error("Edit message failed:", err);
    } finally {
      setEditLoading(false);
      setEditing(false);
    }
  }, [editValue, localContent, message._id]);

  /* ── DELETE ── */
  const handleDelete = useCallback(async () => {
    setShowMenu(false);
    setDeleteStep(false);
    try {
      await deleteMessage(message._id);
      deleteMessageSocket?.(message._id);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }, [deleteMessage, deleteMessageSocket, message._id]);

  /* ── COPY ── */
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(localContent).catch(() => {});
    setShowMenu(false);
  }, [localContent]);

  /* grouped reactions */
  const grouped = localReactions.reduce((acc, r) => {
    acc[r.emoji] ??= { count: 0, isMine: false };
    acc[r.emoji].count++;
    if (String(r.user?._id ?? r.user) === String(currentUser?._id)) acc[r.emoji].isMine = true;
    return acc;
  }, {});

  const timeStr = message.createdAt && !isNaN(new Date(message.createdAt))
    ? format(new Date(message.createdAt), "HH:mm") : "";

  /* bubble border radius — grouped-chat style */
  const sentR     = isFirst && isLast ? "rounded-2xl rounded-tr-sm"
                  : isFirst           ? "rounded-2xl rounded-tr-sm rounded-br-md"
                  : isLast            ? "rounded-2xl rounded-tr-md rounded-br-sm"
                  :                     "rounded-2xl rounded-r-md";
  const receivedR = isFirst && isLast ? "rounded-2xl rounded-tl-sm"
                  : isFirst           ? "rounded-2xl rounded-tl-sm rounded-bl-md"
                  : isLast            ? "rounded-2xl rounded-tl-md rounded-bl-sm"
                  :                     "rounded-2xl rounded-l-md";

  return (
    <div
      ref={rootRef}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className={`flex ${isMe ? "justify-end" : "justify-start"} ${isLast ? "mb-2" : "mb-0.5"} group relative`}
    >

      {/* ══ REACTION PICKER ══ */}
      <AnimatePresence>
        {showReactions && (
          <Motion.div
            initial={{ opacity: 0, scale: 0.6, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 14 }}
            transition={{ type: "spring", stiffness: 420, damping: 26 }}
            className={`absolute z-50 bottom-full mb-2 ${isMe ? "right-4" : "left-4"}`}
          >
            <div className="flex items-center gap-0.5 bg-white/90 backdrop-blur-md rounded-full shadow-2xl border border-gray-100/80 px-2.5 py-1.5">
              {EMOJIS.map((emoji) => {
                const mine = grouped[emoji]?.isMine;
                return (
                  <Motion.button
                    key={emoji}
                    whileHover={{ scale: 1.45, y: -6 }}
                    whileTap={{ scale: 0.85 }}
                    onClick={() => handleReact(emoji)}
                    className={`w-9 h-9 flex items-center justify-center text-xl rounded-full transition-all duration-150
                      ${mine ? "bg-blue-100 ring-2 ring-blue-400 scale-110" : "hover:bg-gray-100"}`}
                  >
                    {emoji}
                  </Motion.button>
                );
              })}
            </div>
          </Motion.div>
        )}
      </AnimatePresence>

      {/* ══ CONTEXT MENU ══ */}
      <AnimatePresence>
        {showMenu && (
          <Motion.div
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 10 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            className={`absolute z-50 bottom-full mb-2 w-52 bg-white/95 backdrop-blur-md rounded-2xl
              shadow-[0_8px_32px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden
              ${isMe ? "right-0" : "left-0"}`}
          >
            {/* header label */}
            <div className="px-4 pt-3 pb-2">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                {isMe ? "Your message" : `${message.sender?.username ?? "Message"}`}
              </p>
            </div>
            <div className="h-px bg-gray-100" />

            <MenuRow icon={Smile} label="Add Reaction" onClick={() => { setShowReactions(true); setShowMenu(false); }} />

            {message.contentType === "text" && (
              <MenuRow icon={Copy} label="Copy Text" onClick={handleCopy} />
            )}

            {isMe && message.contentType === "text" && (
              <MenuRow
                icon={Edit2}
                label="Edit Message"
                onClick={() => { setEditing(true); setEditValue(localContent); setShowMenu(false); }}
              />
            )}

            {isMe && (
              <>
                <div className="h-px bg-gray-100 mx-3 my-1" />
                {deleteStep ? (
                  <div className="px-4 pb-3 pt-2">
                    <p className="text-xs text-gray-400 text-center mb-3">
                      This can't be undone.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDelete}
                        className="flex-1 py-2 text-xs font-semibold text-white rounded-xl
                          bg-gradient-to-r from-red-500 to-rose-600
                          hover:from-red-600 hover:to-rose-700
                          active:scale-95 transition-all shadow-sm"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeleteStep(false)}
                        className="flex-1 py-2 text-xs font-medium text-gray-600 rounded-xl
                          bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <MenuRow icon={Trash2} label="Delete Message" danger onClick={() => setDeleteStep(true)} />
                )}
              </>
            )}

            <div className="h-px bg-gray-100 mx-3 my-1" />
            <button
              onClick={() => { setShowMenu(false); setDeleteStep(false); }}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-xs text-gray-400 hover:text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <X className="w-3 h-3" /> Dismiss
            </button>
          </Motion.div>
        )}
      </AnimatePresence>

      {/* ══ WRAPPER — mb reserves space for reactions pill ══ */}
      <div className={`relative max-w-[72%] sm:max-w-[62%] ${Object.keys(grouped).length > 0 ? "mb-6" : ""}`}>

        {/* hover chevron (desktop) */}
        <Motion.button
          onClick={(e) => { e.stopPropagation(); setShowMenu((p) => !p); setDeleteStep(false); }}
          title="Options"
          className={`absolute top-1.5 z-20 opacity-0 group-hover:opacity-100 focus:opacity-100
            w-7 h-7 flex items-center justify-center rounded-full
            bg-white shadow-md border border-gray-100
            text-gray-400 hover:text-blue-600 hover:border-blue-100
            transition-all duration-200
            ${isMe ? "-left-8" : "-right-8"}`}
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </Motion.button>

        {/* ══ EDITING MODE ══ */}
        {editing ? (
          <div className={`rounded-2xl border px-3.5 py-3 shadow-sm
            ${isMe ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"}`}>
            <textarea
              ref={editRef}
              value={editValue}
              disabled={editLoading}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEditSave(); }
                if (e.key === "Escape") { setEditing(false); setEditValue(localContent); }
              }}
              rows={2}
              className="w-full bg-transparent outline-none text-sm text-gray-900 resize-none leading-relaxed disabled:opacity-60"
            />
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
              <span className="text-[10px] text-gray-400 hidden sm:block">↵ save · Esc cancel</span>
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => { setEditing(false); setEditValue(localContent); }}
                  className="px-3 py-1 text-xs text-gray-500 rounded-lg hover:bg-gray-100 transition-colors"
                >Cancel</button>
                <button
                  onClick={handleEditSave}
                  disabled={editLoading || !editValue.trim() || editValue.trim() === localContent}
                  className="px-3 py-1 text-xs font-semibold text-white rounded-lg
                    bg-gradient-to-r from-blue-500 to-blue-600
                    hover:from-blue-600 hover:to-blue-700
                    disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {editLoading ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>

        ) : (
          /* ══ NORMAL BUBBLE ══ */
          <Motion.div
            initial={{ opacity: 0, scale: 0.94, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            onDoubleClick={() => setShowReactions((p) => !p)}
            className={`relative transition-shadow hover:shadow-md
              ${isPureEmoji
                ? ""
                : isMe
                  ? `bg-gradient-to-br from-blue-500 to-blue-600 text-white ${sentR} px-3.5 pt-2.5 pb-2 shadow-sm shadow-blue-200`
                  : `bg-white text-gray-900 ${receivedR} px-3.5 pt-2.5 pb-2 border border-gray-100 shadow-sm`
              }`}
          >
            {/* images */}
            {message.contentType === "image" && message.imageOrVideoUrl?.length > 0 && (
              <div className={`grid gap-1 ${message.imageOrVideoUrl.length > 1 ? "grid-cols-2" : ""} ${localContent ? "mb-1.5" : ""}`}>
                {message.imageOrVideoUrl.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    <img src={url} alt="" className="rounded-xl object-cover w-full max-h-60 hover:brightness-95 transition-all cursor-pointer" />
                  </a>
                ))}
              </div>
            )}

            {/* videos */}
            {message.contentType === "video" && message.imageOrVideoUrl?.length > 0 && (
              <div className={`space-y-1 ${localContent ? "mb-1.5" : ""}`}>
                {message.imageOrVideoUrl.map((url, i) => (
                  <video key={i} src={url} controls preload="metadata" className="rounded-xl w-full max-h-56" />
                ))}
              </div>
            )}

            {/* text */}
            {localContent && (
              <p className={`whitespace-pre-wrap break-words leading-relaxed
                ${isPureEmoji
                  ? `${emojiCls} text-center px-1 select-none`
                  : `text-sm ${isMe ? "text-white" : "text-gray-900"}`
                }`}>
                {localContent}
              </p>
            )}

            {/* edited label */}
            {message.isEdited && !isPureEmoji && (
              <span className={`text-[9px] italic ${isMe ? "text-blue-200" : "text-gray-400"}`}> edited</span>
            )}

            {/* time + receipt */}
            {!isPureEmoji && (
              <div className="flex items-center justify-end gap-1 mt-1 -mb-0.5 h-3.5">
                <span className={`text-[10px] ${isMe ? "text-blue-200" : "text-gray-400"}`}>{timeStr}</span>
                <ReadReceipt status={message.messageStatus} isMe={isMe} />
              </div>
            )}
            {isPureEmoji && (
              <div className={`flex items-center gap-1 ${isMe ? "justify-end" : "justify-start"}`}>
                <span className="text-[10px] text-gray-400">{timeStr}</span>
                <ReadReceipt status={message.messageStatus} isMe={isMe} />
              </div>
            )}
          </Motion.div>
        )}

        {/* ══ REACTIONS PILL — absolute, zero layout shift ══ */}
        <AnimatePresence>
          {Object.keys(grouped).length > 0 && (
            <Motion.button
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 22 }}
              onClick={() => setShowReactions((p) => !p)}
              className={`absolute -bottom-5 z-10 flex items-center gap-1 bg-white border border-gray-200
                rounded-full px-2.5 py-0.5 shadow-lg hover:shadow-xl transition-shadow cursor-pointer
                ${isMe ? "right-2" : "left-2"}`}
            >
              {Object.entries(grouped).map(([emoji, { count, isMine }]) => (
                <span key={emoji} className={`flex items-center gap-0.5 text-sm ${isMine ? "brightness-90" : ""}`}>
                  {emoji}
                  {count > 1 && (
                    <span className="text-[10px] font-semibold text-gray-500">{count}</span>
                  )}
                </span>
              ))}
            </Motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
