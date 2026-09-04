import { randomUUID } from "node:crypto";

import type { UrlRedirectedEvent } from "./kafka.types";
import {
  kafkaProducer,
} from "./kafka.client";

export type PublishUrlRedirectedEventInput = {
  urlId: string;
  shortCode: string;
  userAgent?: string;
  referer?: string;
};

export interface UrlRedirectedEventPublisher {
  publishUrlRedirectedEvent(
    input: PublishUrlRedirectedEventInput,
  ): Promise<void>;
}

export async function connectKafkaProducer(): Promise<void> {
  await kafkaProducer.connect();

  console.log("Kafka producer connected");
}

export async function disconnectKafkaProducer(): Promise<void> {
  await kafkaProducer.disconnect();
}

export async function publishUrlRedirectedEvent(
  input: PublishUrlRedirectedEventInput,
): Promise<void> {
  const event: UrlRedirectedEvent = {
    eventId: randomUUID(),
    eventType: "url.redirected",
    urlId: input.urlId,
    shortCode: input.shortCode,
    timestamp: new Date().toISOString(),
    userAgent: input.userAgent,
    referer: input.referer,
  };

  await kafkaProducer.send({
    topic:
      process.env.KAFKA_REDIRECT_TOPIC ??
      "redirect-events",
    messages: [
      {
        key: input.shortCode,
        value: JSON.stringify(event),
      },
    ],
  });
}

export const kafkaEventPublisher: UrlRedirectedEventPublisher = {
  publishUrlRedirectedEvent,
};