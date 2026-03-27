import crypto from "crypto";

export const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const createToken = (type, userId, expiresInMinutes) => {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
  return {
    token,
    tokenHash,
    expiresAt,
    meta: {
      type,
      userId: userId?.toString(),
    },
  };
};
