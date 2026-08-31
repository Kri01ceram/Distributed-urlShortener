const EPOCH = 1735689600000n;

const WORKER_ID_BITS = 10n;
const SEQUENCE_BITS = 12n;

const MAX_WORKER_ID = (1n << WORKER_ID_BITS) - 1n;
const MAX_SEQUENCE = (1n << SEQUENCE_BITS) - 1n;

const WORKER_ID_SHIFT = SEQUENCE_BITS;
const TIMESTAMP_SHIFT =
  SEQUENCE_BITS + WORKER_ID_BITS;

export class SnowflakeGenerator {
  private sequence = 0n;
  private lastTimestamp = -1n;

  constructor(
    private readonly workerId: bigint
  ) {
    if (
      workerId < 0n ||
      workerId > MAX_WORKER_ID
    ) {
      throw new Error(
        `Worker ID must be between 0 and ${MAX_WORKER_ID}`
      );
    }
  }

  generate(): bigint {
    let timestamp = this.currentTimestamp();

    if (timestamp < this.lastTimestamp) {
      throw new Error(
        "System clock moved backwards"
      );
    }

    if (timestamp === this.lastTimestamp) {
      this.sequence =
        (this.sequence + 1n) & MAX_SEQUENCE;

      if (this.sequence === 0n) {
        timestamp = this.waitNextMillisecond();
      }
    } else {
      this.sequence = 0n;
    }

    this.lastTimestamp = timestamp;

    return (
      ((timestamp - EPOCH) << TIMESTAMP_SHIFT) |
      (this.workerId << WORKER_ID_SHIFT) |
      this.sequence
    );
  }

  private currentTimestamp(): bigint {
    return BigInt(Date.now());
  }

  private waitNextMillisecond(): bigint {
    let timestamp = this.currentTimestamp();

    while (timestamp <= this.lastTimestamp) {
      timestamp = this.currentTimestamp();
    }

    return timestamp;
  }
}