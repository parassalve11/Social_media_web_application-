"use client";

// components/TrendingBar.jsx
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../lib/axiosIntance";
import { Hash, TrendingUp, X, Flame } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useSidebar } from "./UI/sidebar/context";
import { useToast } from "./UI/ToastManager";
import React, { useState } from "react";
import { motion as Motion , AnimatePresence } from "framer-motion";

const TrendingBar = () => {
  const { addToast } = useToast();
  const { isOpen, isMobile } = useSidebar();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: trendingHashtags, isLoading, error } = useQuery({
    queryKey: ["trendingHashtags"],
    queryFn: async () => {
      const response = await axiosInstance.get("/posts/trending-hashtags");
      return response.data.slice(0, 5);
    },
    staleTime: 5 * 60 * 1000,
    onError: (err) => {
      console.error("Error fetching trending hashtags:", err.message);
      addToast("Failed to load trending hashtags", { type: "error", duration: 3000 });
    },
  });

  const currentHashtag = location.pathname.split("/hashtag/")[1]?.toLowerCase();
  const toggleModal = () => setIsModalOpen((prev) => !prev);

  // Mobile Modal
  if (isMobile) {
    return (
      <>
        <Motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleModal}
          className="flex flex-col items-center justify-center p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 relative"
          aria-label="View trending hashtags"
        >
          <div className="relative">
            <TrendingUp className="h-6 w-6" />
            <Flame size={12} className="absolute -top-1 -right-1 text-orange-500 animate-pulse" />
          </div>
          <span className="text-xs mt-1 font-medium">Trending</span>
        </Motion.button>

        <AnimatePresence>
          {isModalOpen && (
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={toggleModal}
            >
              <Motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl"
              >
                {/* Modal Header */}
                <div className="p-5 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                        <Flame size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">Trending Now</h3>
                        <p className="text-sm text-blue-100">Popular hashtags today</p>
                      </div>
                    </div>
                    <Motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={toggleModal}
                      className="p-2 hover:bg-white/20 rounded-full transition-colors"
                      aria-label="Close"
                    >
                      <X size={20} />
                    </Motion.button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-4 max-h-[60vh] overflow-y-auto">
                  {isLoading && (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3" />
                      <p className="text-gray-500 text-sm">Loading trending hashtags...</p>
                    </div>
                  )}

                  {error && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <X size={24} className="text-red-500" />
                      </div>
                      <p className="text-red-500 font-medium">Failed to load hashtags</p>
                    </div>
                  )}

                  {!isLoading && !error && trendingHashtags?.length > 0 ? (
                    <div className="space-y-2">
                      {trendingHashtags.map(({ hashtag, count }, index) => {
                        const tag = typeof hashtag === "string" ? hashtag : String(hashtag);
                        const isActive = currentHashtag === tag.slice(1).toLowerCase();

                        return (
                          <Motion.div
                            key={tag}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <Link
                              to={`/hashtag/${tag.slice(1)}`}
                              onClick={toggleModal}
                              className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 group ${
                                isActive
                                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105"
                                  : "bg-gray-50 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:shadow-md"
                              }`}
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div
                                  className={`flex items-center justify-center w-10 h-10 rounded-lg font-bold ${
                                    isActive ? "bg-white/20" : "bg-blue-100 text-blue-600"
                                  }`}
                                >
                                  #{index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Hash size={16} className={isActive ? "text-white" : "text-gray-600"} />
                                    <span className={`font-bold truncate ${isActive ? "text-white" : "text-gray-900"}`}>
                                      {tag.slice(1)}
                                    </span>
                                  </div>
                                  <p className={`text-xs ${isActive ? "text-blue-100" : "text-gray-500"}`}>
                                    {count.toLocaleString()} {count === 1 ? "post" : "posts"}
                                  </p>
                                </div>
                              </div>
                              <TrendingUp
                                size={20}
                                className={`ml-2 transition-transform group-hover:scale-110 ${
                                  isActive ? "text-white" : "text-blue-500"
                                }`}
                              />
                            </Link>
                          </Motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    !isLoading &&
                    !error && (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Hash size={24} className="text-gray-400" />
                        </div>
                        <p className="text-gray-500">No trending hashtags right now</p>
                      </div>
                    )
                  )}
                </div>
              </Motion.div>
            </Motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Desktop Sidebar
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/80 backdrop-blur-md shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          {isOpen ? (
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-sm">
                <TrendingUp size={18} className="text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Trending Now</h3>
                <p className="text-xs text-slate-500">Popular hashtags</p>
              </div>
            </div>
          ) : (
            <div className="mx-auto p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-sm">
              <TrendingUp size={18} className="text-white" />
            </div>
          )}
        </div>

        {isLoading && isOpen && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-10 h-10 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-2" />
            <p className="text-xs text-slate-500">Loading...</p>
          </div>
        )}

        {error && isOpen && (
          <div className="text-center py-4">
            <p className="text-sm text-red-500">Failed to load</p>
          </div>
        )}

        {!isLoading && !error && trendingHashtags?.length > 0 && isOpen && (
          <div className="space-y-3 max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
            {trendingHashtags.map(({ hashtag, count }, index) => {
              const tag = typeof hashtag === "string" ? hashtag : String(hashtag);
              const cleanTag = tag.startsWith("#") ? tag.slice(1) : tag;
              const isActive = currentHashtag === cleanTag.toLowerCase();

              return (
                <Motion.div
                  key={tag}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={`/hashtag/${cleanTag}`}
                    className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-3 transition-all duration-200 ${
                      isActive
                        ? "border-blue-500/40 bg-blue-50/80 shadow-sm"
                        : "border-slate-200/70 bg-white/80 hover:shadow-sm hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex items-center justify-center w-9 h-9 rounded-lg text-sm font-semibold ${
                          isActive ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Hash size={14} className="text-slate-500" />
                          <span className="text-sm font-semibold text-slate-900 truncate">
                            {cleanTag}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {count.toLocaleString()} posts
                        </p>
                      </div>
                    </div>
                    <TrendingUp
                      size={16}
                      className={isActive ? "text-blue-600" : "text-slate-400"}
                    />
                  </Link>
                </Motion.div>
              );
            })}
          </div>
        )}

        {!isLoading && !error && trendingHashtags?.length === 0 && isOpen && (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Hash size={20} className="text-slate-400" />
            </div>
            <p className="text-xs text-slate-500">No trending hashtags</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(TrendingBar);
