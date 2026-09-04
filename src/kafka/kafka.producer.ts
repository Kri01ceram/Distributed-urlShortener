import { randomUUID } from "node:crypto";

import type { UrlRedirectedEvent } from "./kafka.types";
import {
  kafkaProducer,
} from "./kafka.client";
import { incrementCounter } from "../observability/metrics";

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
  producerConnected = true;

  console.log("Kafka producer connected");
}

let producerConnected = false;

export async function disconnectKafkaProducer(): Promise<void> {
  if (producerConnected) {
    await kafkaProducer.disconnect();
    producerConnected = false;
  }
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

  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (!producerConnected) {
        await connectKafkaProducer();
      }

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

      return;
    } catch (error: unknown) {
      producerConnected = false;

      try {
        await kafkaProducer.disconnect();
      } catch {
        // The next attempt will create a fresh connection.
      }

      if (attempt === maxAttempts) {
        incrementCounter("kafka_publish_failures_total");
        throw error;
      }

      await new Promise((resolve) => {
        setTimeout(resolve, attempt * 500);
      });
    }
  }
}

export const kafkaEventPublisher: UrlRedirectedEventPublisher = {
  publishUrlRedirectedEvent,
};