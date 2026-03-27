import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const memoryStore = new Map();

let redisClient = null;
let redisReady = false;

const initRedis = async () => {
  if (!process.env.REDIS_URL) return;
  try {
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on("error", () => {
      redisReady = false;
    });
    await redisClient.connect();
    redisReady = true;
    console.log("Redis connected for cache");
  } catch (error) {
    redisReady = false;
    console.log("Redis unavailable, falling back to memory cache");
  }
};

initRedis();

const getEntry = (key) => {
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (entry.expiresAt && entry.expiresAt <= Date.now()) {
    memoryStore.delete(key);
    return null;
  }
  return entry;
};

const setMemory = (key, value, ttlSeconds) => {
  const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
  memoryStore.set(key, { value, expiresAt });
};

export const cache = {
  async get(key) {
    if (redisReady) {
      return redisClient.get(key);
    }
    const entry = getEntry(key);
    return entry ? entry.value : null;
  },
  async set(key, value, options = {}) {
    const ttlSeconds = options.EX ?? null;
    if (redisReady) {
      if (ttlSeconds) {
        await redisClient.set(key, value, { EX: ttlSeconds });
        return;
      }
      await redisClient.set(key, value);
      return;
    }
    setMemory(key, value, ttlSeconds);
  },
  async del(key) {
    if (redisReady) {
      await redisClient.del(key);
      return;
    }
    memoryStore.delete(key);
  },
  async incr(key, ttlSeconds) {
    if (redisReady) {
      const count = await redisClient.incr(key);
      if (ttlSeconds && count === 1) {
        await redisClient.expire(key, ttlSeconds);
      }
      return count;
    }

    const entry = getEntry(key);
    if (!entry) {
      setMemory(key, 1, ttlSeconds);
      return 1;
    }
    const nextValue = Number(entry.value || 0) + 1;
    setMemory(key, nextValue, ttlSeconds ?? null);
    return nextValue;
  },
};

export const isRedisReady = () => redisReady;
