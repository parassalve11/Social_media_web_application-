import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

import authRouters from "./routers/auth.route.js";
import postRoutes from "./routers/post.route.js";
import notificationRoutes from "./routers/notification.route.js";
import followRoutes from "./routers/follow.route.js";
import userRoutes from "./routers/user.route.js";
import MessageRoutes from "./routers/message.route.js";
import StatusRoutes from "./routers/status.route.js";
import ReelRoutes from "./routers/reel.route.js";          // ← NEW
import { csrfProtect } from "./middlewares/csrf.middleware.js";

dotenv.config();

const __dirname = path.resolve();

const createApp = ({ emailService, getIo } = {}) => {
  const app = express();

  app.use(cookieParser());
  app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
  app.use(express.json({ limit: "5mb" }));

  app.use((req, res, next) => {
    if (getIo) {
      const io = getIo();
      if (io) {
        req.io = io;
        req.socketUserMap = io.socketUserMap;
      }
    }
    next();
  });

  app.use(csrfProtect);

  app.locals.emailService = emailService;

  app.use("/api/v1/auth",          authRouters);
  app.use("/api/v1/posts",         postRoutes);
  app.use("/api/v1/notifications", notificationRoutes);
  app.use("/api/v1/follows",       followRoutes);
  app.use("/api/v1/users",         userRoutes);
  app.use("/api/v1/message",       MessageRoutes);
  app.use("/api/v1/status",        StatusRoutes);
  app.use("/api/v1/reels",         ReelRoutes);             // ← NEW

  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "/frontend/dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
    });
  }

  return app;
};

export default createApp;