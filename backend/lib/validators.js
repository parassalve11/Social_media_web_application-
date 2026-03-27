const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const usernameRegex = /^[a-zA-Z0-9_]+$/;

export const normalizeEmail = (email) => email?.trim().toLowerCase();

export const isValidEmail = (email) => emailRegex.test(email || "");

export const isValidUsername = (username) =>
  usernameRegex.test(username || "") && (username || "").length >= 3;

export const getClientIp = (req) =>
  req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
  req.socket?.remoteAddress ||
  "unknown";
