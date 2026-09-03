import { createApp } from "./app";
import { prisma } from "./config/database";
import { env } from "./config/env";
import { connectRedis } from "./config/redis";
import {
  registerWorker,
  releaseWorker,
  renewWorker,
} from "./core/worker-registry";

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
  await registerWorker();

console.log(
  `Worker ID registered: ${workerId}`
);
const heartbeat = setInterval(
  async () => {
    try {
      await renewWorker(workerId);
    } catch (error) {
      console.error(
        "Failed to renew worker lease:",
        error
      );
    }
  },
  10_000
);

    const app = createApp(workerId);

    app.listen(env.port, () => {
      console.log(
  `Worker ${workerId} running on port ${env.port}`
);
    });
    const shutdown = async () => {
  console.log("Shutting down...");

  clearInterval(heartbeat);

  await releaseWorker(workerId);

  await prisma.$disconnect();

  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error(
      "Failed to start server:",
      error
    );

    process.exit(1);
  }
}

startServer();