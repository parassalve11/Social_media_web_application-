import { cache } from "./cache.js";

export const rateLimit = async ({ key, limit, windowSeconds }) => {
  const count = await cache.incr(key, windowSeconds);
  const allowed = count <= limit;
  const remaining = Math.max(0, limit - count);
  return { allowed, remaining };
};
