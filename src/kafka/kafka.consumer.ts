import type { Consumer, EachMessagePayload } from "kafkajs";

import { kafka } from "./kafka.client";
import type { UrlRedirectedEvent } from "./kafka.types";

const consumer: Consumer = kafka.consumer({
  groupId:
    process.env.KAFKA_CONSUMER_GROUP_ID ??
    "url-shortener-analytics",
});

export async function connectKafkaConsumer(): Promise<void> {
  const topic =
    process.env.KAFKA_REDIRECT_TOPIC ??
    "redirect-events";

  await consumer.connect();

  await consumer.subscribe({
    topic,
    fromBeginning: false,
  });

  console.log("Kafka consumer connected");

  void consumer
    .run({
      eachMessage: async ({
        topic,
        partition,
        message,
      }: EachMessagePayload) => {
        if (!message.value) {
          return;
        }

        try {
          const event = JSON.parse(
            message.value.toString(),
          ) as UrlRedirectedEvent;

          console.log("Redirect event received:", {
            topic,
            partition,
            offset: message.offset,
            event,
          });
        } catch (error: unknown) {
          console.error(
            "Failed to process redirect event:",
            error,
          );
        }
      },
    })
    .catch((error: unknown) => {
      console.error("Kafka consumer crashed:", error);
      process.exit(1);
    });
}

export async function disconnectKafkaConsumer(): Promise<void> {
  await consumer.disconnect();
}