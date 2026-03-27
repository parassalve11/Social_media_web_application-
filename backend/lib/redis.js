import { createClient } from "redis";
import dotenv from "dotenv"

dotenv.config();

export const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient
  .connect()
  .then(() => console.log("Redis is connected 🍒🍒"))
  .catch((err) => console.log(" ❌ error while connecting to redies", err));
