"use client";

import { useDispatch, useSelector } from "react-redux";
import {
  setActiveTab,
  setSelectedContact,
  togglePinChat
} from "./messageLayoutSplice"

export const useMessageLayout = () => {
  const dispatch = useDispatch();
  const messageLayoutState = useSelector((state) => state.messageLayout);

  return {
    activeTab: messageLayoutState.activeTab,
    selectedContact: messageLayoutState.selectedContact,
    pinnedChats: messageLayoutState.pinnedChats,

    // Zustand-like setters
    setActiveTab: (tab) => dispatch(setActiveTab(tab)),
    setSelectedContact: (contact) =>
      dispatch(setSelectedContact(contact)),
    togglePinChat: (contactId) =>
      dispatch(togglePinChat(contactId)),
  };
};
