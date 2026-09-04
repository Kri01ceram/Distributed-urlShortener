import { Kafka, Partitioners } from "kafkajs";

const brokers = (
  process.env.KAFKA_BROKERS ?? "localhost:9092"
)
  .split(",")
  .map((broker) => broker.trim())
  .filter(Boolean);

console.log("Kafka brokers:", brokers);

export const kafka = new Kafka({
  clientId:
    process.env.KAFKA_CLIENT_ID ??
    "url-shortener-api",
  brokers,
});

export const kafkaProducer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner,
});