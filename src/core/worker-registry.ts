import { redis } from "../config/redis";

const WORKER_PREFIX = "system:worker:";
const WORKER_TTL = 30;

const MAX_WORKERS = 1024;

export async function registerWorker(): Promise<bigint> {
  for (let workerId = 0; workerId < MAX_WORKERS; workerId++) {
    const key = `${WORKER_PREFIX}${workerId}`;

    const acquired = await redis.set(
      key,
      process.pid.toString(),
      {
        NX: true,
        EX: WORKER_TTL,
      }
    );

    if (acquired === "OK") {
      return BigInt(workerId);
    }
  }

  throw new Error(
    "No worker IDs are currently available"
  );
}

export async function renewWorker(
  workerId: bigint
): Promise<void> {
  const key = `${WORKER_PREFIX}${workerId}`;

  await redis.expire(
    key,
    WORKER_TTL
  );
}

export async function releaseWorker(
  workerId: bigint
): Promise<void> {
  const key = `${WORKER_PREFIX}${workerId}`;

  await redis.del(key);
}