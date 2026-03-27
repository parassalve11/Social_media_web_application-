"use client";

// components/Post/Post.jsx
import React, { useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import {
  Bookmark,
  Edit2,
  MessageCircle,
  MoreHorizontal,
  Send,
  Share,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import PostAction from "./PostAction";
import Dialog from "../UI/Dialog";
import DropdownComponent from "../UI/DropdownComponent";
import UserTooltip from "../UserTooltip";
import EditPostDialog from "./EditPostDialog";
import ShareMenu from "./ShareMenu";
import LikeAnimation from "./LikeAnimation";
import MediaCarousel from "./MediaCarousel";
import { usePostActions } from "../../hooks/usePostActions";
import { useAuthUserSummary } from "../../store/user/useUser";
import { getPostMedia } from "../../lib/postMedia";

function Post({ post }) {
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState(post?.comments || []);
  const [showComment, setShowComment] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const authUser = useAuthUserSummary();
  const mediaItems = getPostMedia(post);

  const {
    likePost,
    bookmarkPost,
    addComment,
    deletePost,
    sharePost,
    isLiking,
    isBookmarking,
    isCommenting,
    isDeleting,
    isLiked,
    isBookmarked,
    isOwner,
  } = usePostActions(post);

  const handleLikePost = () => {
    if (isLiking) return;
    likePost();
  };

  const handleBookmarkPost = () => {
    if (isBookmarking) return;
    bookmarkPost();
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim() || isCommenting) return;

    // Optimistic update
    setComments([
      ...comments,
      {
        _id: Date.now().toString(),
        content: newComment,
        user: {
          _id: authUser._id,
          name: authUser.name,
          avatar: authUser.avatar,
        },
        createdAt: new Date(),
      },
    ]);
    
    addComment(newComment);
    setNewComment("");
  };

  const handleDeletePost = () => {
    deletePost();
    setShowDeleteDialog(false);
  };

  const handleOptionSelect = (value) => {
    if (value === "delete") {
      setShowDeleteDialog(true);
    } else if (value === "edit") {
      setShowEditDialog(true);
    }
  };

  const handleShare = async (platform) => {
    await sharePost(platform);
  };

  const options = [
    { label: "Edit", value: "edit", icon: <Edit2 size={16} /> },
    { label: "Delete", value: "delete", icon: <Trash2 size={16} /> },
  ];

  const highlightContent = (text) => {
    if (!text) return "";

    const escapedText = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;");

    return escapedText.replace(/(#\w+)|(@\w+)/g, (match) =>
      match.startsWith("#")
        ? `<a href="/hashtag/${match.slice(1)}" class="text-blue-500 hover:text-blue-600 font-semibold transition-colors duration-200">${match}</a>`
        : `<a href="/profile/${match.slice(1)}" class="text-purple-600 hover:text-purple-700 font-semibold transition-colors duration-200">${match}</a>`
    );
  };

  return (
    <article className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 mb-4 mx-auto max-w-4xl sm:max-w-lg transition-all duration-300 hover:shadow-xl hover:border-gray-200">
      {/* Like Animation Overlay - Controlled by isLiked prop */}
      <LikeAnimation
        isLiked={isLiked}
        onAnimationComplete={() => {
          console.log("Like animation completed");
        }}
      />

      {/* Header */}
      <div className="flex items-start justify-between p-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <UserTooltip user={post?.author} delay={0.2} minShowTime={1}>
            <Link to={`/profile/${post.author?.username}`}>
              <img
                src={post.author?.avatar || "/placeholder.png"}
                alt={post.author?.name || "User"}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-lg hover:ring-blue-400 hover:scale-110 transition-all duration-300"
                loading="lazy"
              />
            </Link>
          </UserTooltip>
          <div className="min-w-0 flex-1">
            <Link to={`/profile/${post.author?.username}`}>
              <h3 className="text-sm font-bold text-gray-900 truncate hover:text-blue-600 transition-colors duration-200">
                {post.author?.name || "Unknown User"}
              </h3>
            </Link>
            <Link
              to={`/profile/${post.author?.username}`}
              className="block text-xs text-gray-500 hover:text-blue-600 transition-colors duration-200"
            >
              @{post.author?.username || ""}
            </Link>
            <time className="block text-xs text-gray-400 mt-1">
              {formatDistanceToNowStrict(new Date(post.createdAt))} ago
            </time>
          </div>
        </div>
        {isOwner && (
          <DropdownComponent
            triggerElement={
              <button className="p-2 rounded-full bg-white/80 text-gray-600 shadow-sm ring-1 ring-gray-200/70 opacity-0 transition-all duration-200 group-hover:opacity-100 group-focus-within:opacity-100 hover:bg-white hover:text-gray-800 hover:shadow-md focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                <MoreHorizontal size={20} className="text-current transition-colors duration-200" />
              </button>
            }
            options={options}
            onSelect={handleOptionSelect}
            variant="default"
          />
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        <Link to={`/post/${post._id}`} className="block group">
          <p
            className="text-gray-800 text-sm leading-relaxed break-words"
            dangerouslySetInnerHTML={{ __html: highlightContent(post.content) }}
          />
        </Link>
      </div>

      {mediaItems.length > 0 && (
        <div className="px-4 pb-4">
          <MediaCarousel items={mediaItems} className="aspect-[1.2]" />
        </div>
      )}

      {/* Stats Bar */}
      <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-500 border-t border-gray-50">
        <span>{post.likes?.length || 0} likes</span>
        <span>{comments.length || 0} comments</span>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-4 items-center gap-2 sm:gap-3 px-3 py-1.5 sm:py-2.5 border-t border-gray-100 bg-gray-50/60">
        <PostAction
          icon={
            <ThumbsUp
              size={20}
              className={`transition-all duration-300 ${
                isLiked
                  ? "text-blue-600 fill-blue-600 scale-110"
                  : "text-gray-600"
              }`}
            />
          }
          text={isLiked ? "Liked" : "Like"}
          onClick={handleLikePost}
          isDisabled={isLiking}
          className={`rounded-xl transition-all duration-200 ${
            isLiked
              ? "text-blue-600 font-semibold bg-blue-50"
              : "hover:bg-gray-100 text-gray-700"
          }`}
        />
        
        <PostAction
          icon={
            <MessageCircle
              size={20}
              className={`transition-colors duration-200 ${
                showComment ? "text-green-600 fill-green-600" : "text-gray-600"
              }`}
            />
          }
          text="Comment"
          onClick={() => setShowComment(!showComment)}
          className={`rounded-xl transition-all duration-200 ${
            showComment
              ? "text-green-600 font-semibold bg-green-50"
              : "hover:bg-gray-100 text-gray-700"
          }`}
        />

        <PostAction
          icon={
            <Share
              size={20}
              className="text-gray-600 transition-colors duration-200"
            />
          }
          text="Share"
          onClick={() => setShowShareMenu(true)}
          className="rounded-xl hover:bg-gray-100 text-gray-700 transition-all duration-200"
        />

        <PostAction
          icon={
            <Bookmark
              size={20}
              className={`transition-all duration-300 ${
                isBookmarked
                  ? "text-amber-600 fill-amber-600 scale-110"
                  : "text-gray-600"
              }`}
            />
          }
          text="Save"
          onClick={handleBookmarkPost}
          isDisabled={isBookmarking}
          className={`rounded-xl transition-all duration-200 ${
            isBookmarked
              ? "text-amber-600 font-semibold bg-amber-50"
              : "hover:bg-gray-100 text-gray-700"
          }`}
        />
      </div>

      {/* Comments Section */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          showComment ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="max-h-80 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50/30">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <MessageCircle size={40} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No comments yet. Be the first!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment._id}
                className="flex items-start gap-3 p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100"
              >
                <img
                  src={comment.user?.avatar || "/placeholder.png"}
                  alt={comment.user?.name || "User"}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-sm flex-shrink-0"
                  loading="lazy"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900 truncate">
                      {comment.user?.name || "Unknown"}
                    </span>
                    <time className="text-xs text-gray-400">
                      {formatDistanceToNowStrict(new Date(comment.createdAt))}
                    </time>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Comment Input */}
        {showComment && (
          <form
            onSubmit={handleAddComment}
            className="flex items-center gap-2 px-4 pb-4 pt-3 bg-white border-t border-gray-100"
          >
            <img
              src={authUser?.avatar || "/placeholder.png"}
              alt="Your avatar"
              className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-sm flex-shrink-0"
            />
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              disabled={isCommenting}
              className="flex-1 px-4 py-2 rounded-full bg-gray-100 border border-transparent text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-200 transition-all duration-200"
            />
            <button
              type="submit"
              disabled={!newComment.trim() || isCommenting}
              className={`p-2.5 rounded-full transition-all duration-200 ${
                newComment.trim()
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg active:scale-95"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Send size={18} />
            </button>
          </form>
        )}
      </div>

      {/* Share Menu */}
      {showShareMenu && (
        <ShareMenu
          onShare={handleShare}
          onClose={() => setShowShareMenu(false)}
        />
      )}

      {/* Delete Dialog */}
      <Dialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        headline="Delete Post?"
        description="This action cannot be undone. The post will be permanently removed from your profile."
        actionText="Delete"
        variant="destructive"
        isLoading={isDeleting}
        actionIcon={<Trash2 size={18} />}
        onAction={handleDeletePost}
        className="bg-white rounded-2xl shadow-2xl border border-gray-200"
      />

      {/* Edit Dialog */}
      <EditPostDialog
        post={post}
        showEditDialog={showEditDialog}
        setShowEditDialog={setShowEditDialog}
      />
    </article>
  );
}

export default React.memo(Post);
