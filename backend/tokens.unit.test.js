import test from "node:test";
import assert from "node:assert/strict";
import { createToken, hashToken } from "./lib/tokens.js";

test("createToken returns hashed token and expiry", () => {
  const { token, tokenHash, expiresAt } = createToken("verify", "user123", 10);
  assert.ok(token);
  assert.ok(tokenHash);
  assert.notEqual(token, tokenHash);
  assert.equal(tokenHash, hashToken(token));
  assert.ok(expiresAt instanceof Date);
  assert.ok(expiresAt.getTime() > Date.now());
});
