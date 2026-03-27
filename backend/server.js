
import dotenv from "dotenv";
import http from "http";
import createApp from "./app.js";
import { connectDB } from "./lib/db.js";
import { initializeSocket } from "./socket/socket.js";
import { createEmailService, startEmailWorkers } from "./lib/email.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

let io;
const { emailService, directSender } = createEmailService();

const app = createApp({
  emailService,
  getIo: () => io,
});

const server = http.createServer(app);
io = initializeSocket(server);

const start = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log("Server is Running on ", PORT);
    startEmailWorkers({ directSender });
  });
};

start();
