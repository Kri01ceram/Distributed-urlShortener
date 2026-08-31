import { createApp } from "./app";
import { prisma } from "./config/database";
import { env } from "./config/env";
import { connectRedis } from "./config/redis";
import { allocateWorkerId } from "./core/worker-id";

async function startServer() {
  try {
    await prisma.$connect();

    console.log(
      "PostgreSQL connected"
    );

    await connectRedis();

    console.log(
      "Redis connected"
    );

    const workerId =
      await allocateWorkerId();

    console.log(
      `Worker ID allocated: ${workerId}`
    );

    const app = createApp(workerId);

    app.listen(env.port, () => {
      console.log(
        `Server running on http://localhost:${env.port}`
      );
    });
  } catch (error) {
    console.error(
      "Failed to start server:",
      error
    );

    process.exit(1);
  }
}

startServer();