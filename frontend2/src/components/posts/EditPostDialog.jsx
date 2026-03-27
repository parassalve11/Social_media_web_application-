"use client";

// components/Post/EditPostDialog.jsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Dialog from "../UI/Dialog";
import { Edit2, Image, X, Sparkles, Video } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import axiosInstance from "../../lib/axiosIntance";
import { useToast } from "../UI/ToastManager";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { getPostMedia } from "../../lib/postMedia";

export default function EditPostDialog({ post, showEditDialog, setShowEditDialog }) {
  const [content, setContent] = useState("");
  const [mediaItems, setMediaItems] = useState([]);
  const [existingMedia, setExistingMedia] = useState([]);
  const [clearExistingMedia, setClearExistingMedia] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const contentEditableRef = useRef(null);
  const mediaRef = useRef([]);
  const MAX_MEDIA = 10;

  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { mutate: updatePostMutation, isPending: isUpdatePostLoading } = useMutation({
    mutationFn: async (updatedData) =>
      await axiosInstance.put(`/posts/edit/${post._id}`, updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["for-you"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      queryClient.invalidateQueries({ queryKey: ["posts", post._id] });

      addToast("✨ Post updated successfully", {
        type: "success",
        duration: 3000,
      });

      setShowEditDialog(false);
      clearNewMedia();
      setExistingMedia([]);
      setClearExistingMedia(false);
    },
    onError: (error) => {
      addToast(error.message || "❌ Failed to update post", {
        type: "error",
        duration: 3000,
      });
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
    const text = e.currentTarget.textContent;
    setContent(text);
    const content = contentEditableRef.current?.innerText;
    setIsEmpty(!content?.trim());

    const range = document.createRange();
    const sel = window.getSelection();
    e.currentTarget.innerHTML = highlightContent(text);
    range.selectNodeContents(e.currentTarget);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
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

    setClearExistingMedia(false);
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

  const clearNewMedia = () => {
    setMediaItems((prev) => {
      prev.forEach((item) => item?.url && URL.revokeObjectURL(item.url));
      return [];
    });
  };

  const clearCurrentMedia = () => {
    setExistingMedia([]);
    setClearExistingMedia(true);
  };

  useEffect(() => {
    mediaRef.current = mediaItems;
  }, [mediaItems]);

  useEffect(() => {
    return () => {
      mediaRef.current.forEach((item) => item?.url && URL.revokeObjectURL(item.url));
    };
  }, []);

  const hasNewMedia = mediaItems.length > 0;
  const hasExistingMedia = existingMedia.length > 0 && !clearExistingMedia;

  const handleEditPost = async () => {
    try {
      const postData = new FormData();
      postData.append("content", content);
      mediaItems.forEach((item) => postData.append("media", item.file));
      if (clearExistingMedia && mediaItems.length === 0) {
        postData.append("clearMedia", "true");
      }
      updatePostMutation(postData);
    } catch (error) {
      console.log("Error in handleEditPost", error.message);
    }
  };

  useEffect(() => {
    if (!showEditDialog) return;

    const initialContent = post?.content || "";
    setContent(initialContent);

    if (contentEditableRef.current) {
      contentEditableRef.current.innerText = initialContent;
      setIsEmpty(!initialContent.trim());
    }

    const initialMedia = getPostMedia(post);
    setExistingMedia(initialMedia);
    clearNewMedia();
    setClearExistingMedia(false);
  }, [showEditDialog, post]);

  return (
    <Dialog
      isOpen={showEditDialog}
      onClose={() => {
        setShowEditDialog(false);
        clearNewMedia();
        setExistingMedia([]);
        setClearExistingMedia(false);
      }}
      actionIcon={<Edit2 size={18} />}
      actionText="Save Changes"
      headline="Edit Post"
      onAction={handleEditPost}
      isLoading={isUpdatePostLoading}
    >
      <Motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-xl"
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
          <Sparkles size={18} className="text-blue-600" />
          <p className="text-sm text-gray-600">
            Update your thoughts and share with your followers
          </p>
        </div>

        {/* Content Editor */}
        <div className="space-y-4">
          <div className="relative">
            <AnimatePresence>
              {isEmpty && !isFocused && (
                <Motion.div
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute left-0 top-0 text-gray-400 pointer-events-none select-none"
                >
                  What's on your mind?
                </Motion.div>
              )}
            </AnimatePresence>

            <div
              ref={contentEditableRef}
              contentEditable
              onInput={handleInput}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="w-full p-4 rounded-xl bg-gray-50 hover:bg-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[150px] text-gray-900 transition-all duration-200"
              role="textbox"
              aria-multiline="true"
              aria-label="Edit post content"
            />
          </div>

          {/* Media Preview */}
          <AnimatePresence>
            {hasNewMedia && (
              <Motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
              >
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>New media (will replace current)</span>
                  <span>
                    {mediaItems.length}/{MAX_MEDIA}
                  </span>
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
              </Motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {!hasNewMedia && hasExistingMedia && (
              <Motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
              >
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Current media</span>
                  <button
                    type="button"
                    onClick={clearCurrentMedia}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Remove media
                  </button>
                </div>
                <div className="mt-2 flex gap-3 overflow-x-auto pb-2">
                  {existingMedia.map((item, index) => (
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
                          alt="Current media"
                          className="h-full w-full object-cover"
                        />
                      )}
                      {item.type === "video" && (
                        <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">
                          Video
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </Motion.div>
            )}
          </AnimatePresence>

          {!hasNewMedia && !hasExistingMedia && clearExistingMedia && (
            <div className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">
              Media removed. Add new media below if you want.
            </div>
          )}

          {/* Media Upload */}
          <label className="cursor-pointer">
            <Motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-xl transition-all duration-200 hover:bg-blue-50"
            >
              <Image size={20} className="text-gray-600" />
              <Video size={20} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-600">
                {hasExistingMedia || hasNewMedia ? "Replace media" : "Add media"}
              </span>
            </Motion.div>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={handleMediaChange}
            />
          </label>
        </div>
      </Motion.div>
    </Dialog>
  );
}
