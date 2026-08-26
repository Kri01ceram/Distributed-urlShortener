import app from "./app";
import { env } from "./config/env";
import { prisma } from "./config/database";
import { connectRedis } from "./config/redis";

async function startServer() {
  try {
    await prisma.$connect();
    console.log("PostgreSQL connected");

    await connectRedis();
    console.log("Redis connected");

    app.listen(env.port, () => {
      console.log(`Server running on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();