"use client";

// frontend/src/components/profile/ProfilePostsGrid.jsx
import React, { useState } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, ImageIcon, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { getPostMedia } from "../../lib/postMedia";

const PostTile = ({ post, large = false, delay = 0 }) => {
  const [hovered, setHovered] = useState(false);

  const mediaItems = getPostMedia(post);
  const mediaSrc = mediaItems[0]?.url || null;
  const isVideo = mediaItems[0]?.type === "video";

  const hasMedia = Boolean(mediaSrc);

  return (
    <Motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative rounded-2xl overflow-hidden cursor-pointer group shadow-sm"
      style={{
        gridRow: large ? "span 2" : "span 1",
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        minHeight: large ? 340 : 160,
      }}
    >
      <Link to={`/post/${post._id}`} className="block w-full h-full absolute inset-0">
        {/* media */}
        {hasMedia ? (
          isVideo ? (
            <video
              src={mediaSrc}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              muted preload="metadata"
            />
          ) : (
            <img
              src={mediaSrc}
              alt=""
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )
        ) : (
          /* text post */
          <div className="absolute inset-0 flex items-center justify-center p-4"
            style={{
              background: "linear-gradient(135deg, #eff6ff 0%, #f0f4ff 50%, #faf5ff 100%)",
            }}
          >
            <p className="text-gray-600 text-xs leading-relaxed text-center line-clamp-5">
              {post.content}
            </p>
          </div>
        )}

        {/* hover overlay */}
        <AnimatePresence>
          {hovered && (
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center gap-5"
              style={{ background: "rgba(15, 23, 42, 0.55)", backdropFilter: "blur(2px)" }}
            >
              <div className="flex items-center gap-1.5 text-white font-bold text-sm">
                <Heart className="w-5 h-5 fill-white" />
                {post.likes?.length ?? 0}
              </div>
              <div className="flex items-center gap-1.5 text-white font-bold text-sm">
                <MessageCircle className="w-5 h-5 fill-white" />
                {post.comments?.length ?? 0}
              </div>
            </Motion.div>
          )}
        </AnimatePresence>

        {/* text-post badge */}
        {!hasMedia && (
          <div className="absolute top-2 left-2 w-6 h-6 rounded-lg bg-white/80 flex items-center justify-center shadow-sm">
            <FileText className="w-3 h-3 text-blue-500" />
          </div>
        )}

        {/* multi-image badge */}
        {mediaItems.length > 1 && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/50 backdrop-blur-sm">
            <span className="text-white text-[10px] font-bold">+{mediaItems.length}</span>
          </div>
        )}
      </Link>
    </Motion.div>
  );
};

/* ════════════════════════════════════════════════ */

const ProfilePostsGrid = ({ posts = [], isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2" style={{ gridAutoRows: "160px" }}>
        {[...Array(9)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl animate-pulse bg-gray-100"
            style={{ gridRow: i % 7 === 0 ? "span 2" : "span 1" }}
          />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <Motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20 gap-4"
      >
        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center shadow-sm">
          <ImageIcon className="w-8 h-8 text-blue-300" />
        </div>
        <p className="text-gray-400 text-sm">No posts yet</p>
      </Motion.div>
    );
  }

  return (
    <div
      className="grid grid-cols-3 gap-2 sm:gap-3"
      style={{ gridAutoRows: "160px" }}
    >
      {posts.map((post, idx) => (
        <PostTile
          key={post._id}
          post={post}
          large={idx % 7 === 0}
          delay={Math.min(idx * 0.04, 0.4)}
        />
      ))}
    </div>
  );
};

export default ProfilePostsGrid;
