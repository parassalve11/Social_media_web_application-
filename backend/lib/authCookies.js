import { setCsrfCookie } from "./csrf.js";

export const setAuthCookies = ({ res, accessToken, refreshToken, csrfToken }) => {
  const isProduction = process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    sameSite: isProduction ? "none" : "strict",
    secure: isProduction,
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
  const isProduction = process.env.NODE_ENV === "production";
  const cookieOptions = {
    sameSite: isProduction ? "none" : "strict",
    secure: isProduction,
  };

  res.clearCookie("jwt_social", cookieOptions);
  res.clearCookie("refresh_token", cookieOptions);
  res.clearCookie("csrf_token", cookieOptions);
};
