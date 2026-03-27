import test, { before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import createApp from "./app.js";
import User from "./models/user.model.js";
import { hashPassword } from "./lib/password.js";
import { hashToken } from "./lib/tokens.js";

process.env.JWT_SECRET = "test-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.ACCESS_TOKEN_MINUTES = "15";
process.env.REFRESH_TOKEN_DAYS = "7";
process.env.TOKEN_EXPIRES_MINUTES_VERIFY = "60";
process.env.TOKEN_EXPIRES_MINUTES_PWD_RESET = "60";
process.env.MAX_FAILED_LOGINS = "3";
process.env.LOCKOUT_DURATION_MIN = "30";
process.env.LOGIN_RATE_LIMIT_PER_IP = "100";
process.env.RESET_RATE_LIMIT_PER_IP = "100";
process.env.CLIENT_URL = "http://localhost:5173";

let mongoServer;
let app;
let sentEmails = [];

const emailService = {
  sendVerificationEmail: async ({ user, token }) => {
    sentEmails.push({ type: "verify", email: user.email, token });
  },
  sendPasswordResetEmail: async ({ user, token }) => {
    sentEmails.push({ type: "reset", email: user.email, token });
  },
};

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  app = createApp({ emailService, getIo: () => null });
});

beforeEach(async () => {
  sentEmails = [];
  await User.deleteMany({});
});

after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

test("signup -> verify -> login", async () => {
  const payload = {
    name: "Jane Doe",
    username: "janedoe",
    email: "jane@example.com",
    password: "StrongPass1!",
  };

  await request(app).post("/api/v1/auth/signup").send(payload).expect(200);
  assert.equal(sentEmails.length, 1);
  const { token } = sentEmails[0];

  const user = await User.findOne({ email: payload.email }).select(
    "+verificationTokenHash +verificationTokenExpiresAt"
  );
  assert.ok(user);
  assert.equal(user.verificationTokenHash, hashToken(token));
  assert.notEqual(user.verificationTokenHash, token);

  await request(app).post("/api/v1/auth/verify").send({ token }).expect(200);

  const verified = await User.findOne({ email: payload.email });
  assert.equal(verified.emailVerified, true);

  await request(app)
    .post("/api/v1/auth/signin")
    .send({ identifier: payload.email, password: payload.password })
    .expect(200);
});

test("signup rejects an existing verified email", async () => {
  await User.create({
    name: "Existing User",
    username: "existinguser",
    email: "existing@example.com",
    password: await hashPassword("StrongPass1!"),
    emailVerified: true,
  });

  const response = await request(app).post("/api/v1/auth/signup").send({
    name: "Another User",
    username: "anotheruser",
    email: "existing@example.com",
    password: "AnotherPass1!",
  });

  assert.equal(response.status, 409);
  assert.equal(response.body.code, "EMAIL_ALREADY_EXISTS");
  assert.equal(response.body.message, "Email already exists. Please sign in instead.");
  assert.equal(sentEmails.length, 0);
});

test("signup with an existing unverified email resends verification", async () => {
  await User.create({
    name: "Pending User",
    username: "pendinguser",
    email: "pending@example.com",
    password: await hashPassword("StrongPass1!"),
    emailVerified: false,
  });

  const response = await request(app).post("/api/v1/auth/signup").send({
    name: "Pending User",
    username: "pendinguser2",
    email: "pending@example.com",
    password: "StrongPass1!",
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.code, "EMAIL_ALREADY_EXISTS_UNVERIFIED");
  assert.equal(sentEmails.length, 1);
  assert.equal(sentEmails[0].type, "verify");
  assert.equal(sentEmails[0].email, "pending@example.com");
});

test("signup reports a delivery failure for an existing unverified email", async () => {
  const failingApp = createApp({
    emailService: {
      sendVerificationEmail: async () => {
        throw new Error("SMTP not configured");
      },
      sendPasswordResetEmail: async () => {},
    },
    getIo: () => null,
  });

  await User.create({
    name: "Pending User",
    username: "pendinguser",
    email: "pending@example.com",
    password: await hashPassword("StrongPass1!"),
    emailVerified: false,
  });

  const response = await request(failingApp).post("/api/v1/auth/signup").send({
    name: "Pending User",
    username: "pendinguser2",
    email: "pending@example.com",
    password: "StrongPass1!",
  });

  assert.equal(response.status, 503);
  assert.equal(response.body.code, "VERIFICATION_EMAIL_FAILED");
});

test("forgot password -> reset -> login", async () => {
  const password = "StrongPass1!";
  const email = "reset@example.com";
  const user = await User.create({
    name: "Reset User",
    username: "resetuser",
    email,
    password: await hashPassword(password),
    emailVerified: true,
  });

  await request(app).post("/api/v1/auth/forgot").send({ email }).expect(200);

  const resetEmail = sentEmails.find((item) => item.type === "reset");
  assert.ok(resetEmail);

  await request(app)
    .post("/api/v1/auth/reset")
    .send({ token: resetEmail.token, newPassword: "NewPass1!" })
    .expect(200);

  await request(app)
    .post("/api/v1/auth/signin")
    .send({ identifier: email, password: "NewPass1!" })
    .expect(200);
});

test("forgot password reports when the reset email cannot be sent", async () => {
  const failingApp = createApp({
    emailService: {
      sendVerificationEmail: async () => {},
      sendPasswordResetEmail: async () => {
        throw new Error("SMTP not configured");
      },
    },
    getIo: () => null,
  });

  await User.create({
    name: "Reset User",
    username: "resetuser",
    email: "reset@example.com",
    password: await hashPassword("StrongPass1!"),
    emailVerified: true,
  });

  const response = await request(failingApp)
    .post("/api/v1/auth/forgot")
    .send({ email: "reset@example.com" });

  assert.equal(response.status, 503);
  assert.equal(response.body.code, "RESET_EMAIL_FAILED");
});

test("resend verification reports when email is missing", async () => {
  const response = await request(app)
    .post("/api/v1/auth/resend-verification")
    .send({ email: "missing@example.com" });

  assert.equal(response.status, 404);
  assert.equal(response.body.code, "EMAIL_NOT_FOUND");
  assert.equal(response.body.message, "Email does not exist in our database.");
});

test("locks account after repeated failed logins", async () => {
  const email = "lock@example.com";
  const password = "StrongPass1!";

  await User.create({
    name: "Locked User",
    username: "lockeduser",
    email,
    password: await hashPassword(password),
    emailVerified: true,
  });

  await request(app)
    .post("/api/v1/auth/signin")
    .send({ identifier: email, password: "WrongPass1!" })
    .expect(401);

  await request(app)
    .post("/api/v1/auth/signin")
    .send({ identifier: email, password: "WrongPass1!" })
    .expect(401);

  const locked = await request(app)
    .post("/api/v1/auth/signin")
    .send({ identifier: email, password: "WrongPass1!" })
    .expect(423);

  assert.ok(locked.body.lockedUntil);
});

test("signin accepts a legacy mixed-case username", async () => {
  const password = "StrongPass1!";

  await User.collection.insertOne({
    name: "Legacy User",
    username: "LegacyUser",
    email: "legacy@example.com",
    password: await hashPassword(password),
    emailVerified: true,
    authSource: "local",
    failedLoginAttempts: 0,
    followers: [],
    following: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await request(app)
    .post("/api/v1/auth/signin")
    .send({ identifier: "legacyuser", password })
    .expect(200);
});
