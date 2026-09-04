import type { Consumer, EachMessagePayload } from "kafkajs";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

import { kafka } from "./kafka.client";
import { prisma } from "../config/database";
import type { UrlRedirectedEvent } from "./kafka.types";

const consumer: Consumer = kafka.consumer({
  groupId:
    process.env.KAFKA_CONSUMER_GROUP_ID ??
    "url-shortener-analytics",
});

function parseRedirectEvent(value: string): UrlRedirectedEvent {
  const parsed: unknown = JSON.parse(value);

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as Record<string, unknown>).eventId !== "string" ||
    (parsed as Record<string, unknown>).eventType !== "url.redirected" ||
    typeof (parsed as Record<string, unknown>).urlId !== "string" ||
    typeof (parsed as Record<string, unknown>).shortCode !== "string" ||
    typeof (parsed as Record<string, unknown>).timestamp !== "string"
  ) {
    throw new Error("Invalid redirect event");
  }

  return parsed as UrlRedirectedEvent;
}

async function persistRedirectEvent(event: UrlRedirectedEvent): Promise<void> {
  try {
    await prisma.redirectEvent.create({
      data: {
        eventId: event.eventId,
        eventType: event.eventType,
        urlId: BigInt(event.urlId),
        shortCode: event.shortCode,
        userAgent: event.userAgent,
        referer: event.referer,
        occurredAt: new Date(event.timestamp),
      },
    });
  } catch (error: unknown) {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return;
    }

    throw error;
  }
}

export async function connectKafkaConsumer(): Promise<void> {
  const topic =
    process.env.KAFKA_REDIRECT_TOPIC ??
    "redirect-events";

  const admin = kafka.admin();
  await admin.connect();
  await admin.createTopics({
    topics: [{ topic, numPartitions: 1, replicationFactor: 1 }],
    waitForLeaders: true,
  });
  await admin.disconnect();

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
          const event = parseRedirectEvent(message.value.toString());

          if (Number.isNaN(new Date(event.timestamp).getTime())) {
            throw new Error("Invalid redirect event timestamp");
          }

          await persistRedirectEvent(event);

          console.log("Redirect event persisted:", {
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

          throw error;
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