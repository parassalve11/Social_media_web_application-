import { configureStore } from "@reduxjs/toolkit";
import createWebStorage from "redux-persist/lib/storage/createWebStorage";
import { persistReducer, persistStore } from "redux-persist";

import userReducer from "./user/userSlice";
import chatReducer from "./chat/chatSlice";
import messageLayoutReducer from "../store/message/messageLayoutSplice"
import  followReducer from '../store/follow/followSlice'

const createNoopStorage = () => ({
  getItem() {
    return Promise.resolve(null);
  },
  setItem(_, value) {
    return Promise.resolve(value);
  },
  removeItem() {
    return Promise.resolve();
  },
});

const storage =
  typeof window !== "undefined" ? createWebStorage("local") : createNoopStorage();

// persist configs
const userPersistConfig = {
  key: "user-storage",
  storage,
};

const layoutPersistConfig = {
  key: "layout-storage",
  storage,
};

const persistedUserReducer = persistReducer(
  userPersistConfig,
  userReducer
);

const persistedLayoutReducer = persistReducer(
  layoutPersistConfig,
  messageLayoutReducer
);

export const store = configureStore({
  reducer: {
    user: persistedUserReducer,
    chat: chatReducer,                  // ❌ NOT persisted
    messageLayout: persistedLayoutReducer, // ✅ persisted
     follow: followReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);
