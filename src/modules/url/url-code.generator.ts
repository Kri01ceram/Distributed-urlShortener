import { encodeBase62 } from "../../core/base62";
import { SnowflakeGenerator } from "../../core/id-generator";

const workerId = BigInt(
  process.env.WORKER_ID ?? "0"
);

const snowflake = new SnowflakeGenerator(
  workerId
);

export function generateShortCode(): string {
  const id = snowflake.generate();

  return encodeBase62(id);
}