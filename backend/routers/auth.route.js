import { Router } from "express";
import {
  forgotPassword,
  getCurrentUser,
  googleAuth,
  refreshToken,
  resendVerification,
  resetPassword,
  signIn,
  signOut,
  signUp,
  verifyEmail,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/signup", signUp);
router.post("/signin", signIn);
router.post("/google-auth", googleAuth);
router.post("/signout", signOut);
router.post("/verify", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/forgot", forgotPassword);
router.post("/reset", resetPassword);
router.post("/refresh", refreshToken);

// Legacy aliases (OTP flow deprecated)
router.post("/forget-password/check", forgotPassword);

router.get("/me", protectRoute, getCurrentUser);

export default router;
