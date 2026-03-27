"use client";

// store/follow/useFollow.js
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import {
  getFollowers,
  getFollowing,
  followUser as followUserThunk,
  unfollowUser as unfollowUserThunk,
} from "./followThunks";
import { incrementFollowers, decrementFollowers } from "./followSlice";
import { addFollowing, removeFollowing } from "../user/userSlice";
import { getSocket } from "../../services/chat.service";
import { store } from "../../store";

export const useFollow = () => {
  const dispatch = useDispatch();
  const follow = useSelector((state) => state.follow);
  const authUserId = useSelector((state) => state.user.user?._id);

  // Initialize socket listeners on mount
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !authUserId) return;

    // Remove existing listeners to prevent duplicates
    socket.off("follow_event");
    socket.off("unfollow_event");

    // Follow event handler
    const handleFollowEvent = ({ followerId, followedId }) => {
      const currentUserId = store.getState().user.user?._id;
      console.log("Follow event received:", { followerId, followedId, currentUserId });
      
      if (currentUserId === followedId) {
        dispatch(incrementFollowers({ followerId, followedId }));
      }
    };

    // Unfollow event handler
    const handleUnfollowEvent = ({ followerId, followedId }) => {
      const currentUserId = store.getState().user.user?._id;
      console.log("Unfollow event received:", { followerId, followedId, currentUserId });
      
      if (currentUserId === followedId) {
        dispatch(decrementFollowers({ followerId, followedId }));
      }
    };

    socket.on("follow_event", handleFollowEvent);
    socket.on("unfollow_event", handleUnfollowEvent);

    // Cleanup on unmount
    return () => {
      socket.off("follow_event", handleFollowEvent);
      socket.off("unfollow_event", handleUnfollowEvent);
    };
  }, [authUserId, dispatch]);

  return {
    /* ---------- STATE ---------- */
    followers: follow.followers,
    following: follow.following,
    followersCount: follow.followersCount,
    followingCount: follow.followingCount,
    loading: follow.loading,
    error: follow.error,

    /* ---------- API ACTIONS ---------- */
    getFollowers: (userId) => dispatch(getFollowers(userId)),
    getFollowing: (userId) => dispatch(getFollowing(userId)),

    followUser: async (userId) => {
      try {
        // 1. Optimistic update
        dispatch(addFollowing(userId));
        dispatch(incrementFollowers({ followerId: userId }));

        // 2. API call (await the result)
        const result = await dispatch(followUserThunk(userId)).unwrap();
        
        // 3. Emit socket event AFTER successful API call
        const socket = getSocket();
        if (socket) {
          socket.emit("follow_user", {
            followerId: authUserId,
            followedId: userId,
          });
        }

        return result;
      } catch (error) {
        // Rollback optimistic update on error
        console.error("Follow user failed:", error);
        dispatch(removeFollowing(userId));
        dispatch(decrementFollowers({ followerId: userId }));
        throw error;
      }
    },

    unfollowUser: async (userId) => {
      try {
        // 1. Optimistic update
        dispatch(removeFollowing(userId));
        dispatch(decrementFollowers({ followerId: userId }));

        // 2. API call (await the result)
        const result = await dispatch(unfollowUserThunk(userId)).unwrap();
        
        // 3. Emit socket event AFTER successful API call
        const socket = getSocket();
        if (socket) {
          socket.emit("unfollow_user", {
            followerId: authUserId,
            followedId: userId,
          });
        }

        return result;
      } catch (error) {
        // Rollback optimistic update on error
        console.error("Unfollow user failed:", error);
        dispatch(addFollowing(userId));
        dispatch(incrementFollowers({ followerId: userId }));
        throw error;
      }
    },
  };
};
