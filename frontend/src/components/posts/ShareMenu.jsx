"use client";

// components/Post/ShareMenu.jsx
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Link2, Facebook, Twitter, Linkedin, MessageCircle, Share } from "lucide-react";

const ShareMenu = ({ onShare, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async (platform) => {
    if (platform === "copy") {
      await onShare(platform);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      await onShare(platform);
      onClose();
    }
  };

  const shareOptions = [
    {
      id: "copy",
      label: copied ? "Copied!" : "Copy Link",
      icon: <Link2 size={20} />,
      color: "text-gray-700 hover:bg-gray-100",
    },
    {
      id: "twitter",
      label: "Twitter",
      icon: <Twitter size={20} />,
      color: "text-blue-400 hover:bg-blue-50",
    },
    {
      id: "facebook",
      label: "Facebook",
      icon: <Facebook size={20} />,
      color: "text-blue-600 hover:bg-blue-50",
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      icon: <Linkedin size={20} />,
      color: "text-blue-700 hover:bg-blue-50",
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      icon: <MessageCircle size={20} />,
      color: "text-green-600 hover:bg-green-50",
    },
  ];

  // Check if native share is available
  const hasNativeShare = navigator.share !== undefined;
  if (hasNativeShare) {
    shareOptions.unshift({
      id: "native",
      label: "Share via...",
      icon: <Share size={20} />,
      color: "text-purple-600 hover:bg-purple-50",
    });
  }

  useEffect(() => {
    if (typeof document === "undefined") return;
    const { body } = document;
    const prevOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = prevOverflow;
    };
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full transform animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Share Post</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Share Options */}
        <div className="p-4 space-y-2">
          {shareOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleShare(option.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${option.color}`}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-50">
                {option.icon}
              </div>
              <span className="font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ShareMenu;
