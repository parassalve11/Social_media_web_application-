import test, { before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import createApp from "./app.js";
import User from "./models/user.model.js";
import Message from "./models/message.model.js";
import Conversation from "./models/conversation.model.js";
import { hashPassword } from "./lib/password.js";

process.env.JWT_SECRET = "test-secret";
process.env.CLIENT_URL = "http://localhost:3000";

let mongoServer;
let app;
let sender;
let recipient;

const buildAuthHeader = (userId) =>
  `Bearer ${jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "1h" })}`;

const aiService = {
  isConfigured: () => true,
  async generatePostDraft({ prompt, tone }) {
    return `Post draft for ${tone}: ${prompt}`;
  },
  async generateMessageDraft({ prompt, recipientName }) {
    return `Message draft for ${recipientName || "friend"}: ${prompt}`;
  },
};

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  app = createApp({
    emailService: {
      sendVerificationEmail: async () => {},
      sendPasswordResetEmail: async () => {},
    },
    aiService,
    getIo: () => null,
  });
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Message.deleteMany({}),
    Conversation.deleteMany({}),
  ]);

  sender = await User.create({
    name: "Sender User",
    username: "senderuser",
    email: "sender@example.com",
    password: await hashPassword("StrongPass1!"),
    emailVerified: true,
  });

  recipient = await User.create({
    name: "Recipient User",
    username: "recipientuser",
    email: "recipient@example.com",
    password: await hashPassword("StrongPass1!"),
    emailVerified: true,
  });
});

after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

test("generates an AI post draft for an authenticated user", async () => {
  const apiResponse = await request(app)
    .post("/api/v1/ai/posts/draft")
    .set("Authorization", buildAuthHeader(sender._id.toString()))
    .send({
      prompt: "Launch our new feature update",
      tone: "professional",
      length: "medium",
      includeHashtags: true,
    });

  assert.equal(apiResponse.status, 200);
  assert.equal(apiResponse.body.status, "success");
  assert.match(apiResponse.body.data.draft, /professional/);
});

test("generates an AI message draft with conversation context", async () => {
  const apiResponse = await request(app)
    .post("/api/v1/ai/messages/draft")
    .set("Authorization", buildAuthHeader(sender._id.toString()))
    .send({
      prompt: "Reply with a clear meeting confirmation",
      recipientName: recipient.username,
      tone: "friendly",
      recentMessages: [
        { role: "recipient", content: "Can we meet tomorrow at 4?" },
        { role: "me", content: "Yes, I can make that work." },
      ],
    });

  assert.equal(apiResponse.status, 200);
  assert.equal(apiResponse.body.status, "success");
  assert.match(apiResponse.body.data.draft, /recipientuser/);
});

test("send-message ignores a forged senderId and uses the authenticated user", async () => {
  const attacker = await User.create({
    name: "Attacker User",
    username: "attackeruser",
    email: "attacker@example.com",
    password: await hashPassword("StrongPass1!"),
    emailVerified: true,
  });

  const apiResponse = await request(app)
    .post("/api/v1/message/send-message")
    .set("Authorization", buildAuthHeader(sender._id.toString()))
    .send({
      senderId: attacker._id.toString(),
      receiverId: recipient._id.toString(),
      content: "This should still come from the signed-in user",
    });

  assert.equal(apiResponse.status, 201);
  assert.equal(String(apiResponse.body.data.sender._id), String(sender._id));
  assert.equal(String(apiResponse.body.data.receiver._id), String(recipient._id));
});
