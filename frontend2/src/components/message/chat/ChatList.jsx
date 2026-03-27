"use client";

// components/Chat/ChatList.jsx
import React, { useMemo, useState } from "react";
import { Plus, X, Pin, Search, Users, ArrowLeft } from "lucide-react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { useMessageLayout } from "../../../store/message/useMessageLayout";
import { useUser } from "../../../store/user/useUser";
import formatTimestamp from "../../../lib/formateDate";
import StatusBar from "../status/StatusBar";
import Logo from "../../UI/Logo";
import { Link } from "react-router-dom";

const getLastMessagePreview = (lastMessage) => {
  if (!lastMessage) return "No messages yet";
  if (lastMessage.content) return lastMessage.content;
  if (lastMessage.contentType === "image") return "📷 Photo";
  if (lastMessage.contentType === "video") return "🎥 Video";
  if (Array.isArray(lastMessage.imageOrVideoUrl) && lastMessage.imageOrVideoUrl.length) {
    return "📎 Media";
  }
  return "No messages yet";
};

function ChatList({ contacts = [] }) {
  const { selectedContact, setSelectedContact, pinnedChats, togglePinChat } =
    useMessageLayout();
  const { user: currentUser } = useUser();

  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  /* chat list with pin + sort */
  const chatList = useMemo(() => {
    const chats = contacts.filter((c) => c.conversation);
    return chats.sort((a, b) => {
      const aPinned = pinnedChats.includes(a._id);
      const bPinned = pinnedChats.includes(b._id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      const aTime = new Date(a.conversation.lastMessage?.createdAt || 0);
      const bTime = new Date(b.conversation.lastMessage?.createdAt || 0);
      return bTime - aTime;
    });
  }, [contacts, pinnedChats]);

  /* search users (new chat) */
  const searchedUsers = useMemo(() => {
    return contacts.filter(
      (c) =>
        !c.conversation &&
        c.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [contacts, searchTerm]);

  return (
    <div className="w-full max-w-md border-r border-gray-200 bg-gradient-to-b from-white to-gray-50 h-screen flex flex-col relative shadow-sm">

      {/* ══ HEADER ══ */}
      <div className="px-5 pt-5 pb-3 flex justify-between items-center bg-white sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            title="Back to home"
            className="w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-700
              shadow-sm hover:shadow-md hover:border-gray-300 hover:text-gray-900
              flex items-center justify-center transition"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Messages</h2>
            <p className="text-xs text-gray-500">{chatList.length} conversations</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Logo variant="full" alt="Sangya logo" className="h-10 sm:h-12 w-auto" />
          <Motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSearch(true)}
            className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Plus size={20} />
          </Motion.button>
        </div>
      </div>

      {/* ══ STATUS BAR ══ */}
      <StatusBar currentUser={currentUser} />

      {/* ══ CONVERSATIONS LABEL ══ */}
      {chatList.length > 0 && (
        <div className="px-4 pt-3 pb-1">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Recent
          </p>
        </div>
      )}

      {/* ══ CHAT LIST ══ */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {chatList.length === 0 ? (
          <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full px-8 text-center"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
              <Users size={40} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No conversations yet
            </h3>
            <p className="text-sm text-gray-500">
              Start a new conversation by clicking the + button above
            </p>
          </Motion.div>
        ) : (
          <Motion.div layout className="py-2">
            {chatList.map((contact) => {
              const isActive = selectedContact?._id === contact._id;
              const lastMessage = contact.conversation?.lastMessage;
              const isPinned = pinnedChats.includes(contact._id);
              const avatar = contact.avatar || contact.profilePicture;
              const lastMessagePreview = getLastMessagePreview(lastMessage);

              return (
                <Motion.div
                  key={contact._id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  whileHover={{ x: 4 }}
                  onClick={() => setSelectedContact(contact)}
                  className={`mx-2 mb-1.5 px-4 py-3 flex gap-3 cursor-pointer rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg scale-[1.01]"
                      : "hover:bg-white hover:shadow-md"
                  }`}
                >
                  {/* avatar */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={avatar}
                      alt={contact.username}
                      className={`w-12 h-12 rounded-full object-cover ring-2 transition-all ${
                        isActive ? "ring-white" : "ring-gray-200"
                      }`}
                    />
                    {contact.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full ring-2 ring-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <h3 className={`font-semibold truncate text-sm ${isActive ? "text-white" : "text-gray-900"}`}>
                        {contact.username}
                      </h3>

                      <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                        {lastMessage && (
                          <span className={`text-xs ${isActive ? "text-blue-100" : "text-gray-400"}`}>
                            {formatTimestamp(lastMessage.createdAt)}
                          </span>
                        )}
                        <Motion.button
                          whileHover={{ scale: 1.2, rotate: 15 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => { e.stopPropagation(); togglePinChat(contact._id); }}
                        >
                          <Pin
                            size={13}
                            className={`transition-all ${
                              isPinned
                                ? isActive ? "text-yellow-300 fill-yellow-300" : "text-blue-500 fill-blue-500"
                                : isActive ? "text-blue-200" : "text-gray-300"
                            }`}
                          />
                        </Motion.button>
                      </div>
                    </div>

                    <p className={`text-xs truncate ${isActive ? "text-blue-100" : "text-gray-500"}`}>
                      {lastMessagePreview}
                    </p>
                  </div>
                </Motion.div>
              );
            })}
          </Motion.div>
        )}
      </div>

      {/* ══ NEW CHAT SEARCH OVERLAY ══ */}
      <AnimatePresence>
        {showSearch && (
          <Motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-white z-50 flex flex-col shadow-2xl"
          >
            <div className="p-4 flex items-center gap-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <Motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => { setShowSearch(false); setSearchTerm(""); }}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <X size={20} />
              </Motion.button>
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  autoFocus
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search people..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {searchTerm && searchedUsers.length === 0 ? (
                <Motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-full text-center px-8"
                >
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Search size={32} className="text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">No users found</p>
                </Motion.div>
              ) : (
                <div className="py-2">
                  {searchedUsers.map((user, index) => (
                    <Motion.div
                      key={user._id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      onClick={() => { setSelectedContact(user); setShowSearch(false); setSearchTerm(""); }}
                      className="mx-2 mb-1.5 px-4 py-3 flex items-center gap-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 cursor-pointer rounded-xl transition-all hover:shadow-md"
                    >
                      <div className="relative">
                        <img
                          src={user.avatar || user.profilePicture}
                          alt={user.username}
                          className="w-11 h-11 rounded-full object-cover ring-2 ring-gray-200"
                        />
                        {user.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{user.username}</p>
                        <p className="text-xs text-gray-400">{user.bio || "No bio"}</p>
                      </div>
                    </Motion.div>
                  ))}
                </div>
              )}
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ChatList;
