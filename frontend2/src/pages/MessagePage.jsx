"use client";

//frontend\src\pages\MessagePage.jsx
import React, { useMemo } from "react";


import { motion as Motion } from "framer-motion";

import MessagesLayout from "../components/message/MessageLayout";
import ChatList from "../components/message/chat/ChatList";
import axiosInstance from '../lib/axiosIntance'
import { useQuery } from "@tanstack/react-query";
import { useUser } from "../store/user/useUser";


function MessagePage() {
  const { user } = useUser();

  const { data: allUsers = [] } = useQuery({
    queryKey: ["AllUsers"],
    queryFn: async () => {
      const res = await axiosInstance.get("/users/all");
      return res?.data?.data || [];
    },
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ["Conversations"],
    queryFn: async () => {
      const res = await axiosInstance.get("/message/conversations");
      return res?.data?.data || [];
    },
  });

  const contacts = useMemo(() => {
    const userId = user?._id ? String(user._id) : null;

    const conversationByUserId = new Map();
    conversations.forEach((conv) => {
      const other = conv?.participants?.find(
        (p) => String(p?._id) !== userId
      );
      if (other?._id) {
        conversationByUserId.set(String(other._id), {
          conversation: conv,
          participant: other,
        });
      }
    });

    const result = [];
    const seen = new Set();

    allUsers.forEach((u) => {
      if (!u?._id || String(u._id) === userId) return;
      const mapped = conversationByUserId.get(String(u._id));
      result.push({
        ...u,
        avatar: u.avatar || u.profilePicture,
        conversation: mapped?.conversation || null,
      });
      seen.add(String(u._id));
    });

    // Add users from conversations that might not be in allUsers list
    conversationByUserId.forEach((value, otherId) => {
      if (seen.has(otherId)) return;
      const p = value.participant;
      if (!p) return;
      result.push({
        _id: p._id,
        username: p.username,
        name: p.name,
        avatar: p.avatar || p.profilePicture,
        isOnline: p.isOnline,
        conversation: value.conversation,
      });
    });

    return result;
  }, [allUsers, conversations, user?._id]);

  return (
    <MessagesLayout>
      <Motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className=""
      >
         <ChatList contacts={contacts}  />
     
      </Motion.div>
    </MessagesLayout>
  );
}

export default MessagePage;
