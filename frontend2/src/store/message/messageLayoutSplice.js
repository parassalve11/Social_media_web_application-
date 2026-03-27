import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  activeTab: "chats",
  selectedContact: null,
  pinnedChats: [], // stores contact _id
};

const messageLayoutSlice = createSlice({
  name: "messageLayout",
  initialState,
  reducers: {
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },

    setSelectedContact: (state, action) => {
      state.selectedContact = action.payload;
    },

    togglePinChat: (state, action) => {
      const contactId = action.payload;

      if (state.pinnedChats.includes(contactId)) {
        state.pinnedChats = state.pinnedChats.filter(
          (id) => id !== contactId
        );
      } else {
        state.pinnedChats.unshift(contactId); // pinned on top
      }
    },
  },
});

export const {
  setActiveTab,
  setSelectedContact,
  togglePinChat,
} = messageLayoutSlice.actions;

export default messageLayoutSlice.reducer;
