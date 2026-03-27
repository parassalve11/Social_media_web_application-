import crypto from "crypto";

export const generateCsrfToken = () => crypto.randomBytes(24).toString("hex");

export const setCsrfCookie = (res, token) => {
  res.cookie("csrf_token", token, {
    httpOnly: false,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const verifyCsrf = (req) => {
  const headerToken = req.headers["x-csrf-token"];
  const cookieToken = req.cookies?.csrf_token;
  return Boolean(headerToken && cookieToken && headerToken === cookieToken);
};
