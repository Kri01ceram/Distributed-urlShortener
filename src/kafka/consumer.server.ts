import "dotenv/config";

import {
  connectKafkaConsumer,
  disconnectKafkaConsumer,
} from "./kafka.consumer";

async function startConsumer() {
  try {
    await connectKafkaConsumer();

    console.log("Kafka analytics consumer running");
  } catch (error: unknown) {
    console.error(
      "Failed to start Kafka consumer:",
      error,
    );

    process.exit(1);
  }
}

async function shutdown() {
  console.log("Shutting down Kafka consumer...");

  await disconnectKafkaConsumer();

  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

startConsumer();