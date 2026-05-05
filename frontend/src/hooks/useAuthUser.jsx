"use client";

import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../lib/axiosIntance";



export const useAuthUser = () =>{
    return useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get("/auth/me");
        if (!res) return null;
        return res.data;
      } catch (error) {
        if (error.response || error.response.status === 401) return null;
        console.log("Error while locating authUser", error.message);
      }
    },
  });
}
