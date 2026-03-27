import { setCsrfCookie } from "./csrf.js";

export const setAuthCookies = ({ res, accessToken, refreshToken, csrfToken }) => {
  const cookieOptions = {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  };
  const accessMinutes = Number.parseInt(process.env.ACCESS_TOKEN_MINUTES || "15", 10);
  const refreshDays = Number.parseInt(process.env.REFRESH_TOKEN_DAYS || "30", 10);

  res.cookie("jwt_social", accessToken, {
    ...cookieOptions,
    maxAge: accessMinutes * 60 * 1000,
  });

  if (refreshToken) {
    res.cookie("refresh_token", refreshToken, {
      ...cookieOptions,
      maxAge: refreshDays * 24 * 60 * 60 * 1000,
    });
  }

  if (csrfToken) {
    setCsrfCookie(res, csrfToken);
  }
};

export const clearAuthCookies = (res) => {
  res.clearCookie("jwt_social");
  res.clearCookie("refresh_token");
  res.clearCookie("csrf_token");
};
