"use client";

// frontend/src/components/reels/ReelUploadModal.jsx
import React, { useRef, useState } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { X, Upload, Film, Loader2, CheckCircle, Music2 } from "lucide-react";
import { useCreateReel } from "../../store/reels/useReels";
import { useToast } from "../UI/ToastManager";

export default function ReelUploadModal({ onClose }) {
  const [file,       setFile]       = useState(null);
  const [preview,    setPreview]    = useState(null);
  const [caption,    setCaption]    = useState("");
  const [audioName,  setAudioName]  = useState("Original Audio");
  const [dragOver,   setDragOver]   = useState(false);
  const [uploaded,   setUploaded]   = useState(false);

  const fileRef           = useRef(null);
  const { mutateAsync: createReel, isPending } = useCreateReel();
  const { addToast }      = useToast();

  const handleFile = (f) => {
    if (!f || !f.type.startsWith("video/")) {
      addToast("Only video files are allowed", { type: "error" });
      return;
    }
    if (f.size > 200 * 1024 * 1024) {
      addToast("Video must be under 200 MB", { type: "error" });
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const submit = async () => {
    if (!file || isPending) return;
    const fd = new FormData();
    fd.append("media",     file);
    fd.append("caption",   caption);
    fd.append("audioName", audioName);
    try {
      await createReel(fd);
      setUploaded(true);
      addToast("Reel posted! 🎬", { type: "success", duration: 3000 });
      setTimeout(onClose, 1200);
    } catch {
      addToast("Upload failed. Try again.", { type: "error", duration: 3000 });
    }
  };

  return (
    <Motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <Motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 28 }}
        className="w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
        style={{ background: "#0f0f15", border: "1px solid rgba(255,255,255,0.08)", maxHeight: "88vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── LEFT: video drop / preview ── */}
        <div
          className="relative md:w-72 flex-shrink-0 flex items-center justify-center"
          style={{ minHeight: 360, background: "#060608" }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          {preview ? (
            <>
              <video
                src={preview}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover rounded-l-3xl md:rounded-r-none"
              />
              {/* remove */}
              <button
                onClick={() => { setFile(null); setPreview(null); URL.revokeObjectURL(preview); }}
                className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full
                  bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Motion.div
              animate={dragOver ? { scale: 1.04 } : { scale: 1 }}
              className="flex flex-col items-center gap-4 p-8 text-center cursor-pointer"
              onClick={() => fileRef.current?.click()}
            >
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-200
                ${dragOver
                  ? "bg-blue-500/20 border-2 border-blue-400"
                  : "bg-white/5 border-2 border-dashed border-white/20 hover:border-white/40"
                }`}
              >
                <Film className="w-9 h-9 text-white/40" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Drop your video here</p>
                <p className="text-white/40 text-xs mt-1">MP4, MOV up to 200 MB</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500
                rounded-xl transition-colors cursor-pointer">
                <Upload className="w-4 h-4 text-white" />
                <span className="text-white text-xs font-semibold">Browse files</span>
              </div>
            </Motion.div>
          )}
          <input ref={fileRef} type="file" hidden accept="video/*"
            onChange={(e) => handleFile(e.target.files?.[0])} />
        </div>

        {/* ── RIGHT: form ── */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          {/* header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-bold text-lg">New Reel</h2>
            <button onClick={onClose}
              className="text-white/40 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* caption */}
          <div className="mb-5">
            <label className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2 block">
              Caption
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="Write a caption… add #hashtags"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3
                text-white text-sm placeholder-white/25 resize-none outline-none
                focus:border-blue-500/50 focus:bg-white/8 transition-all"
            />
            <div className="flex justify-between mt-1.5">
              <div className="flex flex-wrap gap-1">
                {caption.match(/#\w+/g)?.map((h, i) => (
                  <span key={i} className="text-blue-400 text-xs">{h}</span>
                ))}
              </div>
              <span className="text-white/30 text-xs">{caption.length}/500</span>
            </div>
          </div>

          {/* audio name */}
          <div className="mb-6">
            <label className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2 block">
              Audio Name
            </label>
            <div className="flex items-center gap-3 bg-white/5 border border-white/10
              rounded-2xl px-4 py-3 focus-within:border-blue-500/50 transition-all">
              <Music2 className="w-4 h-4 text-white/30 flex-shrink-0" />
              <input
                value={audioName}
                onChange={(e) => setAudioName(e.target.value)}
                placeholder="Original Audio"
                className="flex-1 bg-transparent text-white text-sm placeholder-white/25 outline-none"
              />
            </div>
          </div>

          {/* tips */}
          <div className="mb-6 p-4 rounded-2xl bg-white/3 border border-white/6">
            <p className="text-white/50 text-xs leading-relaxed">
              💡 <strong className="text-white/70">Tips:</strong> Keep reels under 60 seconds for best reach.
              Vertical 9:16 videos look best. Add hashtags to reach more people.
            </p>
          </div>

          <div className="mt-auto">
            {uploaded ? (
              <Motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center justify-center gap-3 py-3.5 rounded-2xl
                  bg-emerald-500/20 border border-emerald-500/30"
              >
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-300 font-semibold text-sm">Posted successfully!</span>
              </Motion.div>
            ) : (
              <button
                onClick={submit}
                disabled={!file || isPending}
                className="w-full py-3.5 rounded-2xl font-bold text-sm text-white
                  bg-gradient-to-r from-blue-600 to-violet-600
                  hover:from-blue-500 hover:to-violet-500
                  disabled:opacity-30 disabled:cursor-not-allowed
                  transition-all duration-200 shadow-lg shadow-blue-900/30
                  flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Film className="w-4 h-4" />
                    Post Reel
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </Motion.div>
    </Motion.div>
  );
}
