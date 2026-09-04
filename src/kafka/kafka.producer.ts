import { randomUUID } from "node:crypto";
import { kafkaProducer } from "./kafka.client";
import type { UrlRedirectedEvent } from "./kafka.types";

const topic = process.env.KAFKA_REDIRECT_TOPIC ?? "redirect-events";

let isConnected = false;

export type PublishUrlRedirectedEventInput = Omit<
  UrlRedirectedEvent,
  "eventId" | "eventType" | "timestamp"
>;

export interface UrlRedirectedEventPublisher {
  publishUrlRedirectedEvent(
    event: PublishUrlRedirectedEventInput,
  ): Promise<void>;
}

export async function connectKafkaProducer(): Promise<void> {
  if (isConnected) {
    return;
  }

  await kafkaProducer.connect();
  isConnected = true;
}

export async function disconnectKafkaProducer(): Promise<void> {
  if (!isConnected) {
    return;
  }

  await kafkaProducer.disconnect();
  isConnected = false;
}

export async function publishUrlRedirectedEvent(
  event: PublishUrlRedirectedEventInput,
): Promise<void> {
  if (!isConnected) {
    throw new Error("Kafka producer is not connected");
  }

  const message: UrlRedirectedEvent = {
    ...event,
    eventId: randomUUID(),
    eventType: "url.redirected",
    timestamp: new Date().toISOString(),
  };

  await kafkaProducer.send({
    topic,
    messages: [
      {
        key: event.shortCode,
        value: JSON.stringify(message),
      },
    ],
  });
}

export const kafkaEventPublisher: UrlRedirectedEventPublisher = {
  publishUrlRedirectedEvent,
};