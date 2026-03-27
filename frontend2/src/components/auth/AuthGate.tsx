"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import axiosInstance from "@/lib/axiosIntance";
import { useUser } from "@/store/user/useUser";

type AuthGateProps = {
  children: React.ReactNode;
};

type QueryError = {
  message?: string;
  response?: {
    status?: number;
  };
};

export default function AuthGate({ children }: AuthGateProps) {
  const router = useRouter();
  const { setUser } = useUser();

  const { data: user, isLoading } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get("/auth/me");
        if (!res) return null;
        setUser(res?.data);
        return res.data;
      } catch (error) {
        const typedError = error as QueryError;
        if (typedError.response?.status === 401) return null;
        console.log(
          "Error while locating authUser",
          typedError.message || error
        );
        return null;
      }
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/signin");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}