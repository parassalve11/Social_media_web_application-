import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../lib/axiosIntance"; 

// Get followers
export const getFollowers = createAsyncThunk(
  "follow/getFollowers",
  async (userId, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(
        `/follows/${userId}/followers`
      );
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

// Get following
export const getFollowing = createAsyncThunk(
  "follow/getFollowing",
  async (userId, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(
        `/follows/${userId}/following`
      );
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

// Follow user
export const followUser = createAsyncThunk(
  "follow/followUser",
  async (userId, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(
        `/follows/${userId}/follow`
      );
      return { userId, data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

// Unfollow user
export const unfollowUser = createAsyncThunk(
  "follow/unfollowUser",
  async (userId, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(
        `/follows/${userId}/unfollow`
      );
      return { userId, data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);
