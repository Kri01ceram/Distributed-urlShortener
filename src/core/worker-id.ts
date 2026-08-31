import { redis } from "../config/redis";

const MAX_WORKER_ID = 1023;

const WORKER_COUNTER_KEY = "system:worker:counter";

export async function allocateWorkerId(): Promise<bigint> {
  const counter = await redis.incr(WORKER_COUNTER_KEY);

  const workerId = counter - 1;

  if (workerId > MAX_WORKER_ID) {
    throw new Error(
      "Maximum number of worker IDs exceeded"
    );
  }

  return BigInt(workerId);
}