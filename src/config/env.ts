import "dotenv/config";

export const env = {
  port: Number(process.env.PORT ?? 3000),

  databaseUrl: process.env.DATABASE_URL ?? "",

  redis: {
    url: process.env.REDIS_URL ?? "redis://localhost:6379",
  },

  kafka: {
    brokers: (
      process.env.KAFKA_BROKERS ?? "localhost:9092"
    )
      .split(",")
      .map((broker) => broker.trim())
      .filter(Boolean),

    redirectTopic:
      process.env.KAFKA_REDIRECT_TOPIC ?? "redirect-events",

    clientId:
      process.env.KAFKA_CLIENT_ID ?? "url-shortener-api",

    consumerGroupId:
      process.env.KAFKA_CONSUMER_GROUP_ID ??
      "url-shortener-analytics",
  },
};