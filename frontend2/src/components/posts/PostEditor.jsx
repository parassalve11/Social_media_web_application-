"use client";

// components/Post/PostEditor.jsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import axiosInstance from "../../lib/axiosIntance";
import { useToast } from "../UI/ToastManager";
import { Image, Loader2, X, Send, Video } from "lucide-react";

export default function PostEditor({ user }) {
  const [content, setContent] = useState("");
  const [mediaItems, setMediaItems] = useState([]);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
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

  const { mutate: createPostMutation, isPending } = useMutation({
    mutationFn: async (postData) => {
      const res = await axiosInstance.post("/posts/create", postData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["for-you"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
      addToast("✨ Post created successfully", { type: "success", duration: 3000 });
      resetForm();
    },
    onError: (error) => {
      addToast("❌ Failed to create post", { type: "error", duration: 3000 });
      console.error("Mutation error:", error.message);
    },
  });

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

  const handleInput = (e) => {
    const text = e.currentTarget.innerText;
    setContent(text);
    setIsEmpty(!text.trim());

    const range = document.createRange();
    const sel = window.getSelection();
    e.currentTarget.innerHTML = highlightContent(text);
    range.selectNodeContents(e.currentTarget);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
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
      <div className="p-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Create a post</h3>
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
                What's on your mind, {user.name?.split(" ")[0]}?
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

        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
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
