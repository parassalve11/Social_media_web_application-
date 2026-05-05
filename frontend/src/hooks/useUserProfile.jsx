"use client";


import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../lib/axiosIntance";

export const useUserProfile = (username) => {
  return useQuery({
    queryKey: ["profile", username],
    queryFn: async () => {
      const res = await axiosInstance.get(`/users/${username}`);
      return res.data;
    },
    enabled: !!username, // ensures it only runs if username exists
  });
};
