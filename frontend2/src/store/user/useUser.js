"use client";

// store/user/useUser.js
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { clearUser, setUser } from "./userSlice";

export const useUser = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user, shallowEqual);
  const userId = useSelector((state) => state.user.user?._id);

  return {
    user,
    userId,
    setUser: (data) => dispatch(setUser(data)),
    clearUser: () => dispatch(clearUser()),
  };
};

// Small hook that components like FollowButton should use to avoid subscribing to whole user.
export const useIsFollowing = (targetUserId) => {
  return useSelector(
    (state) => !!state.user.user?.following?.includes(targetUserId),
    shallowEqual
  );
};

// Minimal auth user selector for feed-heavy components to avoid rerenders on follow list changes.
export const useAuthUserSummary = () => {
  return useSelector((state) => {
    const u = state.user.user;
    if (!u) return null;
    return {
      _id: u._id,
      name: u.name,
      avatar: u.avatar,
      username: u.username,
    };
  }, shallowEqual);
};
