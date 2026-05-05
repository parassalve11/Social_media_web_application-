"use client";

// frontend/src/components/message/chat/ChatWindow.jsx
// ── Only the header section changes — CallButton added beside username
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Send, SmilePlus, Paperclip, X, MessageCircle, Image as ImageIcon, Film, Loader2 } from "lucide-react";
import { isToday, isYesterday, format } from "date-fns";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import MessageBubble from "./MessageBubble";
import { useChat } from "../../../store/chat/useChat";
import { useUser } from "../../../store/user/useUser";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import CallButton from "../../call/CallButton";
import { useCall, CALL_STATUS } from "../../../store/call/useCall";

/* ─── date divider ─── */
const DateDivider = ({ date }) => {
  if (isNaN(new Date(date))) return null;
  const d = new Date(date);
  const lbl = isToday(d) ? "Today" : isYesterday(d) ? "Yesterday" : format(d, "MMMM d, yyyy");
  return (
    <div className="flex items-center my-5 select-none">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="mx-3 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400 bg-white rounded-full border border-gray-200 shadow-sm">
        {lbl}
      </span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
};

/* ─── file preview card ─── */
const FileCard = ({ file, preview, progress, onRemove }) => {
  const isImg = file.type.startsWith("image/");
  const isVid = file.type.startsWith("video/");
  const uploading = progress != null && progress < 100;

  return (
    <div className="relative flex-shrink-0 w-[72px] h-[72px] rounded-xl overflow-hidden bg-gray-100 border border-gray-200 group shadow-sm">
      {isImg && <img src={preview} alt="" className="w-full h-full object-cover" />}
      {isVid && <video src={preview} className="w-full h-full object-cover" muted preload="metadata" />}
      {!isImg && !isVid && (
        <div className="w-full h-full flex flex-col items-center justify-center p-2 gap-1">
          <Paperclip className="w-5 h-5 text-gray-400" />
          <span className="text-[9px] text-gray-500 truncate w-full text-center px-1">{file.name}</span>
        </div>
      )}
      {(isImg || isVid) && (
        <div className="absolute top-1 left-1 bg-black/40 rounded-md p-0.5">
          {isImg ? <ImageIcon className="w-2.5 h-2.5 text-white" /> : <Film className="w-2.5 h-2.5 text-white" />}
        </div>
      )}
      {uploading && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="12" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
            <circle cx="16" cy="16" r="12" fill="none" stroke="white" strokeWidth="3"
              strokeDasharray={`${2 * Math.PI * 12}`}
              strokeDashoffset={`${2 * Math.PI * 12 * (1 - (progress ?? 0) / 100)}`}
              strokeLinecap="round" className="transition-all duration-200"
            />
          </svg>
          <span className="absolute text-[9px] text-white font-bold">{Math.round(progress ?? 0)}</span>
        </div>
      )}
      <button onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center
          bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md
          opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <X className="w-2.5 h-2.5" />
      </button>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════ */

export default function ChatWindow({ selectedContact, setSelectedContact }) {
  const [message, setMessage]       = useState("");
  const [files, setFiles]           = useState([]);
  const [previews, setPreviews]     = useState([]);
  const [sending, setSending]       = useState(false);
  const [progress, setProgress]     = useState({});
  const [showEmoji, setShowEmoji]   = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const endRef       = useRef(null);
  const textareaRef  = useRef(null);
  const emojiRef     = useRef(null);
  const typingTimer  = useRef(null);
  const fileRef      = useRef(null);
  const progressTimer = useRef(null);

  const { user }      = useUser();
  const queryClient   = useQueryClient();
  const { messages, fetchMessages, sendMessage, isTypingUser, isUserOnline, startTyping, stopTyping, clearMessages } = useChat();

  // ── call state ──
  const call = useCall(user);

  const conversationId = selectedContact?.conversation?._id;
  const isOnline  = isUserOnline(selectedContact?._id);
  const isTyping  = isTypingUser(selectedContact?._id);

  useEffect(() => {
    if (!selectedContact) { clearMessages(); return; }
    if (conversationId) fetchMessages(conversationId);
    else clearMessages();
  }, [conversationId, selectedContact?._id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  useEffect(() => {
    const fn = (e) => { if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmoji(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  useEffect(() => () => {
    if (typingTimer.current) clearTimeout(typingTimer.current);
    if (progressTimer.current) clearInterval(progressTimer.current);
    previews.forEach(URL.revokeObjectURL);
  }, []);

  const onDragOver  = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsDragging(false); };
  const onDrop      = (e) => {
    e.preventDefault(); setIsDragging(false);
    appendFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/") || f.type.startsWith("video/")));
  };

  const appendFiles = (newFiles) => {
    if (!newFiles.length) return;
    const urls = newFiles.map(URL.createObjectURL);
    setFiles(p => [...p, ...newFiles]);
    setPreviews(p => [...p, ...urls]);
  };

  const removeFile = (i) => {
    URL.revokeObjectURL(previews[i]);
    setFiles(p => p.filter((_, idx) => idx !== i));
    setPreviews(p => p.filter((_, idx) => idx !== i));
  };

  const handleTyping = (val) => {
    setMessage(val);
    if (!selectedContact?._id) return;
    if (!val.trim()) { stopTyping(selectedContact._id); return; }
    startTyping(selectedContact._id);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => stopTyping(selectedContact._id), 2000);
  };

  const handleSend = useCallback(async () => {
    const hasText  = message.trim().length > 0;
    const hasFiles = files.length > 0;
    if (!hasText && !hasFiles) return;
    if (sending) return;

    const formData = new FormData();
    formData.append("senderId", user._id);
    formData.append("receiverId", selectedContact._id);
    if (hasText) formData.append("content", message.trim());
    files.forEach(f => formData.append("media", f));

    if (hasFiles) {
      const init = Object.fromEntries(files.map((_, i) => [i, 0]));
      setProgress(init);
      progressTimer.current = setInterval(() => {
        setProgress(prev => {
          const next = { ...prev };
          let allDone = true;
          Object.keys(next).forEach(k => {
            if (next[k] < 90) { next[k] = Math.min(90, next[k] + Math.random() * 25); allDone = false; }
          });
          if (allDone) clearInterval(progressTimer.current);
          return next;
        });
      }, 180);
    }

    setSending(true);
    setMessage("");
    if (typingTimer.current) clearTimeout(typingTimer.current);
    stopTyping(selectedContact._id);

    try {
      const result = await sendMessage(formData);
      clearInterval(progressTimer.current);
      setProgress({});
      previews.forEach(URL.revokeObjectURL);
      setFiles([]);
      setPreviews([]);
      const newConvId = result?.conversation?._id ?? result?.conversation ?? null;
      if (newConvId && !selectedContact?.conversation) {
        setSelectedContact({ ...selectedContact, conversation: { _id: newConvId, lastMessage: result } });
        queryClient.invalidateQueries({ queryKey: ["AllUsers"] });
        queryClient.invalidateQueries({ queryKey: ["Conversations"] });
      }
    } catch (err) {
      console.error("Send failed:", err);
      clearInterval(progressTimer.current);
      setProgress({});
    } finally {
      setSending(false);
    }
  }, [message, files, previews, sending, user, selectedContact, sendMessage, stopTyping, setSelectedContact, queryClient]);

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  /* ─── EMPTY STATE ─── */
  if (!selectedContact) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 select-none">
        <Motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4 text-center max-w-xs px-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl shadow-blue-200">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-800">Your Messages</p>
            <p className="text-sm text-gray-400 mt-1 leading-relaxed">
              Select a conversation from the left to start chatting
            </p>
          </div>
        </Motion.div>
      </div>
    );
  }

  const canSend = (message.trim().length > 0 || files.length > 0) && !sending;

  return (
    <div className="flex flex-col h-full bg-gray-50 relative"
      onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>

      {/* drag overlay */}
      <AnimatePresence>
        {isDragging && (
          <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(59,130,246,0.08)", backdropFilter: "blur(2px)" }}>
            <div className="bg-white rounded-3xl p-10 text-center shadow-2xl border-2 border-dashed border-blue-400">
              <Paperclip className="w-10 h-10 text-blue-500 mx-auto mb-2" />
              <p className="font-semibold text-gray-700">Drop to attach</p>
              <p className="text-sm text-gray-400">Images & videos only</p>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>

      {/* ══ HEADER ══ */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm z-10">
        <Motion.button whileTap={{ scale: 0.9 }} onClick={() => setSelectedContact(null)}
          className="md:hidden p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Motion.button>

        <div className="relative flex-shrink-0">
          <img src={selectedContact.avatar || selectedContact.profilePicture}
            alt={selectedContact.username}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-200" />
          {isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full ring-2 ring-white" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{selectedContact.username}</p>
          <p className={`text-xs transition-colors ${
            isTyping ? "text-blue-500 animate-pulse" : isOnline ? "text-green-500" : "text-gray-400"
          }`}>
            {isTyping ? "typing…" : isOnline ? "Online" : "Offline"}
          </p>
        </div>

        {/* ── CALL BUTTONS ── */}
        <CallButton
          remoteUser={selectedContact}
          callState={call}
          onCall={(remoteUser, callType) => call.initiateCall(remoteUser, callType)}
        />
      </div>

      {/* ══ MESSAGES ══ */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #e5e7eb 1px, transparent 0)", backgroundSize: "28px 28px" }}>
        {messages.map((msg, i, arr) => {
          const curDate  = format(new Date(msg.createdAt), "yyyy-MM-dd");
          const prevDate = i > 0 ? format(new Date(arr[i - 1].createdAt), "yyyy-MM-dd") : null;
          const showDate = curDate !== prevDate;
          const curSnd   = String(msg.sender?._id ?? msg.sender);
          const prevSnd  = i > 0 ? String(arr[i - 1].sender?._id ?? arr[i - 1].sender) : null;
          const nextSnd  = i < arr.length - 1 ? String(arr[i + 1].sender?._id ?? arr[i + 1].sender) : null;
          const isFirst  = curSnd !== prevSnd || showDate;
          const isLast   = curSnd !== nextSnd;
          return (
            <React.Fragment key={msg._id}>
              {showDate && <DateDivider date={msg.createdAt} />}
              <MessageBubble message={msg} currentUser={user} isFirst={isFirst} isLast={isLast} />
            </React.Fragment>
          );
        })}
        <AnimatePresence>
          {isTyping && (
            <Motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              className="flex items-end gap-2 mb-2">
              <img src={selectedContact.avatar || selectedContact.profilePicture}
                className="w-6 h-6 rounded-full object-cover" alt="" />
              <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100 flex items-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </Motion.div>
          )}
        </AnimatePresence>
        <div ref={endRef} className="h-1" />
      </div>

      {/* ══ INPUT AREA ══ */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 z-10">
        <AnimatePresence>
          {files.length > 0 && (
            <Motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-b border-gray-100">
              <div className="px-4 pt-3 pb-2 flex items-center gap-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                {files.map((f, i) => (
                  <FileCard key={i} file={f} preview={previews[i]}
                    progress={sending ? (progress[i] ?? 0) : null} onRemove={() => removeFile(i)} />
                ))}
                <label htmlFor="add-more-file"
                  className="flex-shrink-0 w-[72px] h-[72px] rounded-xl border-2 border-dashed border-gray-300
                    flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                  <span className="text-xl text-gray-400 leading-none">+</span>
                  <span className="text-[9px] text-gray-400 mt-0.5">Add</span>
                </label>
                <input id="add-more-file" type="file" hidden multiple accept="image/*,video/*"
                  onChange={e => appendFiles(Array.from(e.target.files))} />
              </div>
              {sending && (
                <div className="px-4 pb-2 space-y-1">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-500 truncate flex-1 min-w-0">{f.name}</span>
                      <div className="w-24 h-1 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-200"
                          style={{ width: `${progress[i] ?? 0}%` }} />
                      </div>
                      <span className="text-[10px] text-gray-400 w-6 flex-shrink-0 text-right">
                        {Math.round(progress[i] ?? 0)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-2 px-3 py-2.5">
          <div className="relative flex-shrink-0" ref={emojiRef}>
            <button onClick={() => setShowEmoji(p => !p)}
              className={`p-2.5 rounded-xl transition-colors ${showEmoji ? "text-blue-500 bg-blue-50" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}>
              <SmilePlus className="w-5 h-5" />
            </button>
            <AnimatePresence>
              {showEmoji && (
                <Motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="absolute bottom-12 left-0 z-50 shadow-2xl rounded-2xl overflow-hidden">
                  <Picker data={data} onEmojiSelect={e => { setMessage(p => p + e.native); setShowEmoji(false); }}
                    theme="light" previewPosition="none" skinTonePosition="none" />
                </Motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={() => fileRef.current?.click()}
            className="flex-shrink-0 p-2.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>
          <input ref={fileRef} type="file" hidden multiple accept="image/*,video/*"
            onChange={e => appendFiles(Array.from(e.target.files))} />

          <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 flex items-end min-h-[44px]">
            <textarea ref={textareaRef} value={message} onChange={e => handleTyping(e.target.value)}
              onKeyDown={onKeyDown}
              onBlur={() => { if (typingTimer.current) clearTimeout(typingTimer.current); stopTyping(selectedContact._id); }}
              placeholder="Message…" rows={1}
              className="w-full resize-none bg-transparent outline-none text-sm text-gray-900 placeholder-gray-400 leading-relaxed max-h-28 overflow-y-auto"
              style={{ scrollbarWidth: "none" }} />
          </div>

          <Motion.button whileTap={{ scale: 0.88 }} onClick={handleSend} disabled={!canSend}
            className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center shadow-md transition-all duration-200
              ${canSend
                ? "bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-blue-200 hover:shadow-blue-300 hover:scale-105"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}>
            {sending && files.length > 0
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : <Send className="w-4.5 h-4.5 ml-0.5" />
            }
          </Motion.button>
        </div>
      </div>
    </div>
  );
}
