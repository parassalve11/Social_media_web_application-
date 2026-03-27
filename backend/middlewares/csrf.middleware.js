import { verifyCsrf } from "../lib/csrf.js";

export const csrfProtect = (req, res, next) => {
  const safeMethods = ["GET", "HEAD", "OPTIONS"];
  if (safeMethods.includes(req.method)) {
    return next();
  }
  if (!req.cookies?.jwt_social) {
    return next();
  }
  if (!verifyCsrf(req)) {
    return res.status(403).json({ message: "Invalid CSRF token" });
  }
  return next();
};
