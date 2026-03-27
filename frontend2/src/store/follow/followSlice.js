import { createSlice } from "@reduxjs/toolkit";
import { getFollowers, getFollowing, followUser, unfollowUser } from "./followThunks";

const initialState = {
  followers: [],
  following: [],
  followersCount: 0,
  followingCount: 0,
  loading: false,
  error: null,
};

const followSlice = createSlice({
  name: "follow",
  initialState,
  reducers: {
    incrementFollowers: (state, action) => {
      const { followerId } = action.payload;
      state.followersCount += 1;
      if (!state.followers.includes(followerId)) state.followers.push(followerId);
    },
    decrementFollowers: (state, action) => {
      const { followerId } = action.payload;
      state.followersCount = Math.max(0, state.followersCount - 1);
      state.followers = state.followers.filter((id) => id !== followerId);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getFollowers.fulfilled, (state, action) => {
        state.followers = action.payload.followers;
        state.followersCount = action.payload.followers.length;
      })
      .addCase(getFollowing.fulfilled, (state, action) => {
        state.following = action.payload.following;
        state.followingCount = action.payload.following.length;
      });
  },
});

export const { incrementFollowers, decrementFollowers } = followSlice.actions;
export default followSlice.reducer;
