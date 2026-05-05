"use client";

// frontend/src/pages/ProfilePage.jsx
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion as Motion, AnimatePresence } from "framer-motion";
import {
  Grid3x3,
  Clapperboard,
  Bookmark,
  Loader2,
  AlertCircle,
  Camera,
  Save,
} from "lucide-react";

import axiosInstance from "../lib/axiosIntance";
import { useUser } from "../store/user/useUser";
import ProfileHeader from "../components/profile/ProfileHeader";
import ProfilePostsGrid from "../components/profile/ProfilePostsGrid";
import ProfileReelsGrid from "../components/profile/ProfileReelsGrid";
import Dialog from "../components/UI/Dialog";

/* ─── Tab config ─── */
const TABS = [
  { id: "posts", label: "Posts",  Icon: Grid3x3     },
  { id: "reels", label: "Reels",  Icon: Clapperboard },
  { id: "saved", label: "Saved",  Icon: Bookmark,    ownOnly: true },
];

/* ─── Inline edit form ─── */
const EditProfileForm = ({ userData, onSuccess }) => {
  const [form, setForm] = useState({
    name:     userData?.name     ?? "",
    bio:      userData?.bio      ?? "",
    location: userData?.location ?? "",
    website:  userData?.website  ?? "",
  });
  const [avatarFile,     setAvatarFile]     = useState(null);
  const [bannerFile,     setBannerFile]     = useState(null);
  const [avatarPreview,  setAvatarPreview]  = useState(null);
  const [bannerPreview,  setBannerPreview]  = useState(null);

  const queryClient = useQueryClient();

  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: async (payload) => {
      const res = await axiosInstance.put("/users/profile", payload, {
        headers: { "Content-Type": "application/json" },
      });
      return res?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", userData?.username] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      onSuccess?.();
    },
    onError: (error) => {
      console.error("Error updating profile:", error?.message || error);
    },
  });

  const readFileAsDataURL = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const pickImage = (type) => {
    const input   = document.createElement("input");
    input.type    = "file";
    input.accept  = "image/*";
    input.onchange = (e) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const url = URL.createObjectURL(f);
      if (type === "avatar") { setAvatarFile(f); setAvatarPreview(url); }
      else                   { setBannerFile(f); setBannerPreview(url);  }
    };
    input.click();
  };

  const submit = async () => {
    const payload = { ...form };

    if (avatarFile) {
      payload.avatar = await readFileAsDataURL(avatarFile);
    }
    if (bannerFile) {
      payload.bannerImage = await readFileAsDataURL(bannerFile);
    }

    updateProfile(payload);
  };

  const Field = ({ k, label, placeholder, multiline = false }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={form[k]}
          onChange={(e) => setForm({ ...form, [k]: e.target.value })}
          placeholder={placeholder}
          rows={3}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
            text-gray-800 placeholder-gray-400 resize-none outline-none bg-gray-50
            focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100
            transition-all"
        />
      ) : (
        <input
          value={form[k]}
          onChange={(e) => setForm({ ...form, [k]: e.target.value })}
          placeholder={placeholder}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
            text-gray-800 placeholder-gray-400 outline-none bg-gray-50
            focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100
            transition-all"
        />
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Photo pickers */}
      <div className="flex items-center gap-5 pb-4 border-b border-gray-100">
        {/* avatar */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative w-16 h-16">
            <img
              src={avatarPreview || userData?.avatar}
              alt=""
              className="w-16 h-16 rounded-full object-cover ring-2 ring-gray-200"
            />
            <button
              onClick={() => pickImage("avatar")}
              className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center
                opacity-0 hover:opacity-100 transition-opacity"
            >
              <Camera className="w-4 h-4 text-white" />
            </button>
          </div>
          <span className="text-xs text-gray-400">Avatar</span>
        </div>

        {/* banner preview */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="relative w-full h-14 rounded-xl overflow-hidden bg-gradient-to-r from-blue-100 to-purple-100">
            {(bannerPreview || userData?.bannerImage) && (
              <img
                src={bannerPreview || userData?.bannerImage}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
            <button
              onClick={() => pickImage("banner")}
              className="absolute inset-0 flex items-center justify-center
                bg-black/20 hover:bg-black/35 transition-colors"
            >
              <div className="flex items-center gap-1.5 bg-white/80 px-3 py-1 rounded-full">
                <Camera className="w-3 h-3 text-gray-600" />
                <span className="text-xs font-medium text-gray-600">Banner</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <Field k="name"     label="Full Name" placeholder="Your full name" />
      <Field k="bio"      label="Bio"       placeholder="Tell your story…" multiline />
      <Field k="location" label="Location"  placeholder="City, Country" />
      <Field k="website"  label="Website"   placeholder="https://…" />

      <button
        onClick={submit}
        disabled={isPending}
        className="w-full py-3 rounded-xl text-sm font-bold text-white
          bg-gradient-to-r from-blue-600 to-blue-700
          hover:from-blue-500 hover:to-blue-600
          disabled:opacity-40 disabled:cursor-not-allowed
          transition-all shadow-md shadow-blue-200
          flex items-center justify-center gap-2"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Changes</>}
      </button>
    </div>
  );
};

/* ════════════════════════════════════════════════ */

export default function ProfilePage() {
  const { username } = useParams();
  const { user: me } = useUser();
  const [activeTab, setActiveTab] = useState("posts");
  const [editOpen, setEditOpen]   = useState(false);

  /* ── fetch profile ── */
  const { data: userData, isLoading, isError } = useQuery({
    queryKey: ["profile", username],
    queryFn: async () => {
      const res = await axiosInstance.get(`/users/${username}`);
      const d   = res?.data;
      return d?.data ?? d?.user ?? (d?._id ? d : null);
    },
    enabled: Boolean(username),
    retry: 1,
  });

  /* ── fetch posts ── */
  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["userPosts", username],
    queryFn: async () => {
      const res = await axiosInstance.get(`/posts/user/${username}`);
      const d   = res?.data;
      return Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : [];
    },
    enabled: Boolean(username),
    retry: 1,
  });

  const isOwnProfile = me && userData && String(me._id) === String(userData._id);
  const visibleTabs  = TABS.filter((t) => !t.ownOnly || isOwnProfile);
  const postsCount = postsLoading
    ? (userData?.postsCount ?? 0)
    : posts.length;

  /* ─── loading ─── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-gray-500 text-sm">Loading profile…</p>
        </div>
      </div>
    );
  }

  /* ─── error ─── */
  if (isError || !userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center shadow-sm">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-gray-800">Profile not found</p>
          <p className="text-sm text-gray-400 mt-1">
            Could not load <span className="font-medium">@{username}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 pb-16">

      {/* ══ PROFILE HEADER ══ */}
      <ProfileHeader
        userData={userData}
        isOwnProfile={isOwnProfile}
        postsCount={postsCount}
        openEditDialog={() => setEditOpen(true)}
      />

      {/* ══ TAB NAV ══ */}
      <div className="max-w-3xl mx-auto px-4 mt-5">
        <div className="flex items-center bg-white rounded-2xl shadow-sm border border-gray-100 p-1 gap-1">
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative flex-1 flex items-center justify-center gap-2
                  py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{ color: isActive ? "white" : "#6b7280" }}
              >
                {isActive && (
                  <Motion.div
                    layoutId="tab-active"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 shadow-md shadow-blue-200"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <tab.Icon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{tab.label}</span>
                {tab.id === "posts" && (
                  <span className={`relative z-10 text-[10px] px-1.5 py-0.5 rounded-full font-bold
                    ${isActive ? "bg-white/25 text-white" : "bg-gray-100 text-gray-500"}`}>
                    {postsCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ══ TAB CONTENT ══ */}
      <div className="max-w-3xl mx-auto px-4 mt-5">
        <AnimatePresence mode="wait">
          {activeTab === "posts" && (
            <Motion.div
              key="posts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <ProfilePostsGrid posts={posts} isLoading={postsLoading} />
            </Motion.div>
          )}

          {activeTab === "reels" && (
            <Motion.div
              key="reels"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <ProfileReelsGrid userId={userData._id} />
            </Motion.div>
          )}

          {activeTab === "saved" && (
            <Motion.div
              key="saved"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center py-20 gap-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center shadow-sm">
                <Bookmark className="w-8 h-8 text-amber-400" />
              </div>
              <p className="text-gray-500 text-sm">No saved posts yet</p>
            </Motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ══ EDIT DIALOG ══ */}
      <Dialog
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        headline="Edit Profile"
        variant="default"
      >
        <EditProfileForm
          userData={userData}
          onSuccess={() => setEditOpen(false)}
        />
      </Dialog>
    </div>
  );
}
