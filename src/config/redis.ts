import { createClient } from "redis";
import { env } from "./env";

export const redis = createClient({
  url: env.redis.url,
});

redis.on("error", (error: unknown) => {
  console.error("Redis error:", error);
});

export async function connectRedis(): Promise<void> {
  if (!redis.isOpen) {
    await redis.connect();
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redis.isOpen) {
    await redis.quit();
  }
}