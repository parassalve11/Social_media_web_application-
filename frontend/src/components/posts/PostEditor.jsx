"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import axiosInstance from "../../lib/axiosIntance";
import { requestPostDraft } from "../../services/ai.service";
import { useToast } from "../UI/ToastManager";
import {
  Image,
  Loader2,
  Sparkles,
  Send,
  Video,
  Wand2,
  X,
} from "lucide-react";

const AI_TONES = ["professional", "friendly", "confident", "casual"];
const AI_LENGTHS = ["short", "medium", "long"];

export default function PostEditor({ user }) {
  const [content, setContent] = useState("");
  const [mediaItems, setMediaItems] = useState([]);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiTone, setAiTone] = useState("professional");
  const [aiLength, setAiLength] = useState("medium");
  const [aiIncludeHashtags, setAiIncludeHashtags] = useState(true);
  const contentEditableRef = useRef(null);
  const mediaRef = useRef([]);
  const MAX_MEDIA = 10;

  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const normalizeAvatar = (src) => {
    if (!src) return "/avatar.svg";
    if (typeof src === "string" && src.includes("via.placeholder.com")) {
      return "/avatar.svg";
    }
    return src;
  };

  const placeCaretAtEnd = (element) => {
    if (!element || typeof window === "undefined") return;
    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(element);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
  };

  const highlightContent = (text) => {
    if (!text) return "";
    const escapedText = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

    return escapedText.replace(
      /(#\w+)|(@\w+)/g,
      (match) =>
        match.startsWith("#")
          ? `<span class="text-blue-600 font-bold">${match}</span>`
          : `<span class="text-purple-600 font-bold">${match}</span>`
    );
  };

  const syncEditorContent = (nextContent) => {
    const normalized = typeof nextContent === "string" ? nextContent : "";
    setContent(normalized);
    setIsEmpty(!normalized.trim());

    if (contentEditableRef.current) {
      contentEditableRef.current.innerHTML = highlightContent(normalized);
      placeCaretAtEnd(contentEditableRef.current);
    }
  };

  const { mutate: createPostMutation, isPending } = useMutation({
    mutationFn: async (postData) => {
      const res = await axiosInstance.post("/posts/create", postData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["for-you"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
      addToast("Post created successfully", { type: "success", duration: 3000 });
      resetForm();
    },
    onError: (error) => {
      addToast("Failed to create post", { type: "error", duration: 3000 });
      console.error("Mutation error:", error.message);
    },
  });

  const { mutate: generateDraftMutation, isPending: isGeneratingDraft } = useMutation({
    mutationFn: requestPostDraft,
    onSuccess: (data) => {
      const draft = data?.draft || "";
      if (!draft.trim()) {
        addToast("The AI returned an empty draft", {
          type: "error",
          duration: 3000,
        });
        return;
      }

      syncEditorContent(draft);
      setShowAiPanel(false);
      setAiPrompt("");
      setIsFocused(true);
      addToast("AI draft added to your post editor", {
        type: "success",
        duration: 3000,
      });
    },
    onError: (error) => {
      addToast(
        error?.response?.data?.message || "Failed to generate an AI post draft",
        { type: "error", duration: 3500 }
      );
    },
  });

  const handleInput = (e) => {
    const text = e.currentTarget.innerText;
    setContent(text);
    setIsEmpty(!text.trim());

    e.currentTarget.innerHTML = highlightContent(text);
    placeCaretAtEnd(e.currentTarget);
  };

  const handlePostCreation = async () => {
    try {
      const postData = new FormData();
      postData.append("content", content);
      mediaItems.forEach((item) => postData.append("media", item.file));
      createPostMutation(postData);
    } catch (error) {
      console.error("Error in handlePostCreation:", error.message);
    }
  };

  const handleGenerateDraft = () => {
    const prompt = aiPrompt.trim();
    const existingDraft = content.trim();

    if (!prompt && !existingDraft) {
      addToast("Add a prompt or start writing before using AI", {
        type: "warning",
        duration: 3000,
      });
      return;
    }

    generateDraftMutation({
      prompt: prompt || "Turn this idea into a polished social media post.",
      tone: aiTone,
      length: aiLength,
      includeHashtags: aiIncludeHashtags,
      existingDraft: existingDraft || undefined,
    });
  };

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const accepted = files.filter(
      (file) => file.type.startsWith("image/") || file.type.startsWith("video/")
    );

    setMediaItems((prev) => {
      const remaining = Math.max(0, MAX_MEDIA - prev.length);
      const nextItems = accepted.slice(0, remaining).map((file) => ({
        file,
        url: URL.createObjectURL(file),
        type: file.type.startsWith("video/") ? "video" : "image",
      }));
      return [...prev, ...nextItems];
    });

    e.target.value = "";
  };

  const removeMediaItem = (index) => {
    setMediaItems((prev) => {
      const next = [...prev];
      const removed = next.splice(index, 1)[0];
      if (removed?.url) URL.revokeObjectURL(removed.url);
      return next;
    });
  };

  const clearAllMedia = () => {
    setMediaItems((prev) => {
      prev.forEach((item) => item?.url && URL.revokeObjectURL(item.url));
      return [];
    });
  };

  const resetForm = () => {
    setContent("");
    clearAllMedia();
    setIsEmpty(true);
    setIsFocused(false);
    setAiPrompt("");
    setShowAiPanel(false);
    if (contentEditableRef.current) {
      contentEditableRef.current.innerHTML = "";
    }
  };

  useEffect(() => {
    mediaRef.current = mediaItems;
  }, [mediaItems]);

  useEffect(() => {
    return () => {
      mediaRef.current.forEach((item) => item?.url && URL.revokeObjectURL(item.url));
    };
  }, []);

  const isPostDisabled = content.trim() === "" && mediaItems.length === 0;

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 mb-4 overflow-hidden">
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Create a post</h3>
        <button
          type="button"
          onClick={() => setShowAiPanel((prev) => !prev)}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${
            showAiPanel
              ? "border-blue-200 bg-blue-50 text-blue-700"
              : "border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:text-blue-700"
          }`}
        >
          <Sparkles size={14} />
          AI Draft
        </button>
      </div>

      <div className="p-3">
        <div className="flex gap-3">
          <img
            src={normalizeAvatar(user.avatar)}
            alt={user.name}
            className="w-10 h-10 rounded-full object-cover"
            onError={(e) => {
              if (e.currentTarget.dataset.fallback === "1") return;
              e.currentTarget.dataset.fallback = "1";
              e.currentTarget.src = "/avatar.svg";
            }}
          />

          <div className="flex-1 relative">
            {isEmpty && !isFocused && (
              <div className="absolute left-0 top-0 text-gray-400 pointer-events-none select-none text-sm">
                What&apos;s on your mind, {user.name?.split(" ")[0]}?
              </div>
            )}
            <div
              ref={contentEditableRef}
              contentEditable
              onInput={handleInput}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="w-full p-0 bg-transparent focus:outline-none min-h-[60px] text-gray-900 text-sm leading-relaxed"
              role="textbox"
              aria-multiline="true"
              aria-label="Post content"
            />
          </div>
        </div>

        {showAiPanel && (
          <div className="mt-3 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Wand2 size={16} className="text-blue-600" />
                  Generate a polished draft
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Use a prompt, your current text, or both. The result is inserted into the editor for review before posting.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAiPanel(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-white hover:text-gray-600"
                aria-label="Close AI draft panel"
              >
                <X size={14} />
              </button>
            </div>

            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Example: Announce our new creator tools in a confident, product-launch style"
              rows={3}
              className="mt-3 w-full rounded-xl border border-white bg-white/90 px-3 py-2 text-sm text-gray-900 outline-none ring-0 placeholder:text-gray-400"
            />

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-medium text-gray-600">
                Tone
                <select
                  value={aiTone}
                  onChange={(e) => setAiTone(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white bg-white px-3 py-2 text-sm text-gray-900 outline-none"
                >
                  {AI_TONES.map((tone) => (
                    <option key={tone} value={tone}>
                      {tone[0].toUpperCase() + tone.slice(1)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-medium text-gray-600">
                Length
                <select
                  value={aiLength}
                  onChange={(e) => setAiLength(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white bg-white px-3 py-2 text-sm text-gray-900 outline-none"
                >
                  {AI_LENGTHS.map((length) => (
                    <option key={length} value={length}>
                      {length[0].toUpperCase() + length.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="mt-3 flex items-center gap-2 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={aiIncludeHashtags}
                onChange={(e) => setAiIncludeHashtags(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Add relevant hashtags at the end
            </label>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleGenerateDraft}
                disabled={isGeneratingDraft}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  isGeneratingDraft
                    ? "bg-gray-200 text-gray-500"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {isGeneratingDraft ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Generate Draft
                  </>
                )}
              </button>

              {content.trim() && (
                <span className="text-xs text-gray-500">
                  Your current editor text will also be used as context.
                </span>
              )}
            </div>
          </div>
        )}

        {mediaItems.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{mediaItems.length} media selected</span>
              <button
                type="button"
                onClick={clearAllMedia}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Remove all
              </button>
            </div>
            <div className="mt-2 flex gap-3 overflow-x-auto pb-2">
              {mediaItems.map((item, index) => (
                <div
                  key={`${item.url}-${index}`}
                  className="relative h-24 w-32 flex-shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-sm"
                >
                  {item.type === "video" ? (
                    <video
                      src={item.url}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={item.url}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => removeMediaItem(index)}
                    className="absolute top-1.5 right-1.5 rounded-full bg-gray-900/80 text-white p-1 shadow"
                    aria-label="Remove media"
                  >
                    <X size={12} />
                  </button>
                  {item.type === "video" && (
                    <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">
                      Video
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap justify-between items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <label className="cursor-pointer">
              <div className="flex items-center gap-2 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg text-sm">
                <Image size={18} />
                <Video size={18} />
                Media
              </div>
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={handleMediaChange}
              />
            </label>

            <button
              type="button"
              onClick={() => setShowAiPanel((prev) => !prev)}
              className="flex items-center gap-2 px-3 py-1 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
            >
              <Sparkles size={16} />
              AI
            </button>
          </div>

          <button
            disabled={isPostDisabled || isPending}
            onClick={handlePostCreation}
            className={`flex items-center gap-1 px-4 py-1.5 rounded-lg font-medium ${
              isPostDisabled || isPending
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isPending ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Posting...
              </>
            ) : (
              <>
                <Send size={16} />
                Post
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
