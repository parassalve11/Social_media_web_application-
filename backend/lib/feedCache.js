/**
 * lib/feedCache.js
 * ─────────────────────────────────────────────────────────────────
 * Feed-specific cache helpers built on top of lib/cache.js.
 *
 * Design — Timestamp-based Invalidation:
 * ───────────────────────────────────────
 * The existing cache.js has no pattern-delete (no KEYS/SCAN).
 * Instead of deleting every cached page on a write event, we store
 * a single "invalidation timestamp" per user.  On every read we
 * compare the page's _cachedAt timestamp to the invalidation marker.
 * If _cachedAt < invalidatedAt  →  stale miss  →  recompute.
 *
 * This gives O(1) invalidation (one write) and O(2) reads (get page
 * + get invalidation key) with zero pattern-delete complexity.
 *
 * Cache Key Patterns:
 *   feed:forYou:{userId}:{cursor}
 *   feed:following:{userId}:{cursor}
 *   feed:reels:{userId}:{cursor}
 *   feed:recommended:{userId}
 *   feed:invalidate:{userId}          ← invalidation timestamp
 *
 * TTL defaults:
 *   FEED_CACHE_TTL_SECONDS   = 90 s  (ranked feeds)
 *   FEED_CACHE_REC_TTL       = 300 s (recommended users — changes slowly)
 *   Invalidation marker TTL  = 3600 s
 * ─────────────────────────────────────────────────────────────────
 */

import { cache } from "./cache.js";
import { logWarn } from "./logger.js";

/* ── TTLs (overridable via env) ── */
const FEED_TTL_SEC = parseInt(process.env.FEED_CACHE_TTL_SECONDS || "90", 10);
const REC_TTL_SEC  = parseInt(process.env.FEED_CACHE_REC_TTL     || "300", 10);
const INV_TTL_SEC  = 3_600; // invalidation marker lives for 1 hour

/* ══════════════════════════════════════════════════════════════
   INTERNAL KEY BUILDERS
══════════════════════════════════════════════════════════════ */

const feedKey  = (type, userId, cursor) =>
  `feed:${type}:${userId}:${cursor || "first"}`;

const recKey   = (userId) => `feed:recommended:${userId}`;
const invalKey = (userId) => `feed:invalidate:${userId}`;

/* ══════════════════════════════════════════════════════════════
   READ  —  getCachedFeed
   Returns parsed feed data or null on miss / stale / error.
══════════════════════════════════════════════════════════════ */

/**
 * @param {"forYou"|"following"|"reels"} type
 * @param {string}  userId
 * @param {string|null} cursor
 * @returns {Object|null}
 */
export const getCachedFeed = async (type, userId, cursor) => {
  try {
    const [raw, invalRaw] = await Promise.all([
      cache.get(feedKey(type, userId, cursor)),
      cache.get(invalKey(userId)),
    ]);

    if (!raw) return null; // cache miss

    const cached = JSON.parse(raw);

    // Stale check: if an invalidation event happened AFTER this
    // page was cached, treat it as a miss so we recompute.
    if (invalRaw) {
      const invalidatedAt = parseInt(invalRaw, 10);
      if (cached._cachedAt < invalidatedAt) return null;
    }

    return cached.data;
  } catch (err) {
    // Cache errors are non-fatal — fall through to live query
    logWarn("feedCache.get.error", { type, userId, error: err.message });
    return null;
  }
};

/* ══════════════════════════════════════════════════════════════
   WRITE  —  setCachedFeed
══════════════════════════════════════════════════════════════ */

/**
 * @param {"forYou"|"following"|"reels"} type
 * @param {string}  userId
 * @param {string|null} cursor
 * @param {Object} data   — the full response payload to cache
 */
export const setCachedFeed = async (type, userId, cursor, data) => {
  try {
    const payload = JSON.stringify({ data, _cachedAt: Date.now() });
    await cache.set(feedKey(type, userId, cursor), payload, { EX: FEED_TTL_SEC });
  } catch (err) {
    logWarn("feedCache.set.error", { type, userId, error: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   INVALIDATE  —  invalidateUserFeedCache
   Call this on createPost / deletePost / createReel / deleteReel.
   One write invalidates ALL feed pages for this user simultaneously.
══════════════════════════════════════════════════════════════ */

/**
 * @param {string|ObjectId} userId
 */
export const invalidateUserFeedCache = async (userId) => {
  try {
    await cache.set(
      invalKey(userId.toString()),
      Date.now().toString(),
      { EX: INV_TTL_SEC }
    );
  } catch (err) {
    logWarn("feedCache.invalidate.error", { userId, error: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   RECOMMENDED USERS  —  separate TTL (slower-changing data)
══════════════════════════════════════════════════════════════ */

/**
 * Read recommended users from cache.
 * @param {string} userId
 * @returns {Array|null}
 */
export const getCachedRecommended = async (userId) => {
  try {
    const raw = await cache.get(recKey(userId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    logWarn("feedCache.recommended.get.error", { userId, error: err.message });
    return null;
  }
};

/**
 * Write recommended users to cache.
 * @param {string} userId
 * @param {Array}  data
 */
export const setCachedRecommended = async (userId, data) => {
  try {
    await cache.set(recKey(userId), JSON.stringify(data), { EX: REC_TTL_SEC });
  } catch (err) {
    logWarn("feedCache.recommended.set.error", { userId, error: err.message });
  }
};