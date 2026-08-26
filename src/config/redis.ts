import { createClient } from "redis";

const redis = createClient({
  socket: {
    host: process.env.REDIS_HOST ?? "localhost",
    port: Number(process.env.REDIS_PORT ?? 6379),
  },
});

redis.on("error", (error) => {
  console.error("Redis error:", error);
});

export async function connectRedis() {
  if (!redis.isOpen) {
    await redis.connect();
  }
}

export { redis };