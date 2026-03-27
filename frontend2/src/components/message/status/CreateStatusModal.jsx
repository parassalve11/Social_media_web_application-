"use client";

// frontend/src/components/message/status/CreateStatusModal.jsx
import React, { useRef, useState } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import {
  X,
  Image as ImageIcon,
  Film,
  Type,
  Trash2,
  Loader2,
  Send,
} from "lucide-react";

const BG_PRESETS = [
  { from: "#1e3a5f", to: "#0ea5e9", label: "Ocean" },
  { from: "#3b1d8e", to: "#ec4899", label: "Dusk" },
  { from: "#064e3b", to: "#10b981", label: "Forest" },
  { from: "#7c2d12", to: "#f97316", label: "Ember" },
  { from: "#1e1b4b", to: "#6366f1", label: "Midnight" },
  { from: "#831843", to: "#f43f5e", label: "Rose" },
];

export default function CreateStatusModal({ currentUser, onClose, onSubmit, isCreating }) {
  const [mode, setMode]         = useState("text"); // "text" | "image" | "video"
  const [text, setText]         = useState("");
  const [bgIndex, setBgIndex]   = useState(0);
  const [file, setFile]         = useState(null);
  const [preview, setPreview]   = useState(null);
  const fileRef                 = useRef(null);

  const bg = BG_PRESETS[bgIndex];

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setMode(f.type.startsWith("video") ? "video" : "image");
  };

  const clearMedia = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setMode("text");
  };

  const canSubmit = mode === "text" ? text.trim().length > 0 : Boolean(file);

  const handleSubmit = async () => {
    if (!canSubmit || isCreating) return;
    const fd = new FormData();
    if (mode === "text") {
      fd.append("content", text.trim());
      fd.append("contentType", "text");
    } else {
      fd.append("media", file);
      fd.append("contentType", mode);
    }
    await onSubmit(fd);
    onClose();
  };

  return (
    <Motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <Motion.div
        initial={{ scale: 0.9, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 24 }}
        transition={{ type: "spring", stiffness: 360, damping: 28 }}
        className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── PREVIEW AREA ── */}
        <div
          className="relative flex items-center justify-center"
          style={{
            minHeight: 320,
            background:
              mode === "text"
                ? `linear-gradient(135deg, ${bg.from}, ${bg.to})`
                : "#0f172a",
          }}
        >
          {/* close */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/30
              flex items-center justify-center text-white hover:bg-black/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* media preview */}
          {mode === "image" && preview && (
            <img
              src={preview}
              alt=""
              className="max-h-80 w-full object-contain"
            />
          )}
          {mode === "video" && preview && (
            <video
              src={preview}
              controls
              className="max-h-80 w-full"
            />
          )}

          {/* text compose */}
          {mode === "text" && (
            <div className="w-full px-8 py-10 flex flex-col items-center gap-6">
              <textarea
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={250}
                placeholder="What's on your mind?"
                className="w-full bg-transparent text-white text-center text-xl font-semibold
                  placeholder-white/50 resize-none outline-none leading-snug"
                rows={4}
              />
              <span className="text-white/40 text-xs">{text.length}/250</span>
            </div>
          )}

          {/* remove media btn */}
          {(mode === "image" || mode === "video") && (
            <button
              onClick={clearMedia}
              className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/40
                flex items-center justify-center text-white hover:bg-red-500 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* ── CONTROLS ── */}
        <div className="bg-white px-4 py-4 space-y-4">

          {/* type toggle */}
          <div className="flex gap-2">
            {[
              { id: "text",  Icon: Type,      label: "Text"  },
              { id: "image", Icon: ImageIcon, label: "Photo" },
              { id: "video", Icon: Film,      label: "Video" },
            ].map(({ id, Icon, label }) => (
              <button
                key={id}
                onClick={() => {
                  if (id !== "text") { clearMedia(); fileRef.current?.click(); }
                  else { clearMedia(); setMode("text"); }
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold
                  transition-all duration-200 ${
                    mode === id
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* hidden file input */}
          <input
            ref={fileRef}
            type="file"
            hidden
            accept="image/*,video/*"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />

          {/* bg presets — only for text */}
          <AnimatePresence>
            {mode === "text" && (
              <Motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-2">
                  Background
                </p>
                <div className="flex gap-2">
                  {BG_PRESETS.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => setBgIndex(i)}
                      title={p.label}
                      className={`w-8 h-8 rounded-full transition-all duration-200 ${
                        bgIndex === i ? "ring-2 ring-offset-2 ring-blue-500 scale-110" : ""
                      }`}
                      style={{
                        background: `linear-gradient(135deg, ${p.from}, ${p.to})`,
                      }}
                    />
                  ))}
                </div>
              </Motion.div>
            )}
          </AnimatePresence>

          {/* submit */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isCreating}
            className="w-full py-3 rounded-2xl font-semibold text-sm text-white
              bg-gradient-to-r from-blue-500 to-purple-600
              hover:from-blue-600 hover:to-purple-700
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all duration-200 shadow-md flex items-center justify-center gap-2"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sharing…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Share Status
              </>
            )}
          </button>
        </div>
      </Motion.div>
    </Motion.div>
  );
}
