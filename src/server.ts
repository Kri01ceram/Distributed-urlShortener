import { createApp } from "./app";
import { prisma } from "./config/database";
import { env } from "./config/env";
import { connectRedis, disconnectRedis } from "./config/redis";
import {
  registerWorker,
  releaseWorker,
  renewWorker,
} from "./core/worker-registry";
import {
  connectKafkaProducer,
  disconnectKafkaProducer,
} from "./kafka/kafka.producer";

async function startServer() {
  let workerId: bigint | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  try {
    await prisma.$connect();
    console.log("PostgreSQL connected");

    await connectRedis();
    console.log("Redis connected");

    await connectKafkaProducer();
    console.log("Kafka producer connected");

    workerId = await registerWorker();
    console.log(`Worker ID registered: ${workerId}`);

    heartbeat = setInterval(async () => {
      try {
        await renewWorker(workerId!);
      } catch (error) {
        console.error("Failed to renew worker lease:", error);
      }
    }, 10_000);

    const app = createApp(workerId);

    app.listen(env.port, () => {
      console.log(`Worker ${workerId} running on port ${env.port}`);
    });

    const shutdown = async () => {
      console.log("Shutting down...");

      if (heartbeat) {
        clearInterval(heartbeat);
      }

      try {
        if (workerId !== undefined) {
          await releaseWorker(workerId);
        }

        await disconnectKafkaProducer();
        await disconnectRedis();
        await prisma.$disconnect();
      } catch (error) {
        console.error("Error during shutdown:", error);
      } finally {
        process.exit(0);
      }
    };

    process.on("SIGINT", () => {
      void shutdown();
    });

    process.on("SIGTERM", () => {
      void shutdown();
    });
  } catch (error) {
    console.error("Failed to start server:", error);

    try {
      await disconnectKafkaProducer();
      await disconnectRedis();
      await prisma.$disconnect();
    } catch (cleanupError) {
      console.error("Startup cleanup failed:", cleanupError);
    }

    process.exit(1);
  }
}

void startServer();