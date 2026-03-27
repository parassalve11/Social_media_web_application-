"use client";

import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../lib/axiosIntance";
import FollowButton from "./FollowButton";
import { useToast } from "./UI/ToastManager";
import AvatarComponent from "./UI/AvatarComponent";
import { useSidebar } from "./UI/sidebar/context";

export default function RecommendedUsers() {
  const { addToast } = useToast();
  const { isOpen, isMobile } = useSidebar();

  const {
    data: recommendedUsers,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["recommendedUsers"],
    queryFn: async () => {
      const res = await axiosInstance.get("/users");
      if (!res.data) throw new Error("Users not found");
      return res.data;
    },
    onError: (err) => {
      console.error("Error fetching recommended users:", err.message);
      addToast("Failed to load recommended users", { type: "error", duration: 3000 });
    },
  });

  if (isMobile) return null;

  return (
    <div className={`p-4 border-t border-gray-200 ${isOpen ? "block" : "hidden"}`}>
      <h2 className="text-sm font-semibold text-gray-700 mb-3">
        {isOpen ? "Recommended Users" : ""}
      </h2>
      {isLoading ? (
        <div className="text-center text-gray-500 text-sm" aria-live="polite">
          Loading users...
        </div>
      ) : isError ? (
        <div className="text-center text-red-500 text-sm" aria-live="assertive">
          Error: {error?.message || "Could not load users"}
        </div>
      ) : recommendedUsers?.length > 0 ? (
        <ul className="space-y-3 max-h-[200px] overflow-y-auto" role="list">
          {recommendedUsers.slice(0, 3).map((user) => (
            <li
              key={user._id}
              className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md transition-colors duration-150"
              role="listitem"
            >
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <AvatarComponent src={user.avatar} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                </div>
              </div>
              <FollowButton userId={user._id} className="ml-2 shrink-0" />
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center text-gray-500 text-sm" aria-live="polite">
          No users to recommend
        </div>
      )}
    </div>
  );
}
