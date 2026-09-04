import { redis } from "../../config/redis";
import type {
  CachedUrl,
  UrlCacheInterface,
} from "./url.cache.interface";

export class UrlCache implements UrlCacheInterface {
  private readonly ttlSeconds = 60 * 60;

  async get(shortCode: string): Promise<CachedUrl | null> {
    const value = await redis.get(this.getKey(shortCode));

    if (!value) {
      return null;
    }

    const parsed = JSON.parse(value) as {
      id: string;
      shortCode: string;
      longUrl: string;
      createdAt: string;
      expiresAt: string | null;
    };

    return {
      id: BigInt(parsed.id),
      shortCode: parsed.shortCode,
      longUrl: parsed.longUrl,
      createdAt: new Date(parsed.createdAt),
      expiresAt: parsed.expiresAt
        ? new Date(parsed.expiresAt)
        : null,
    };
  }

  async set(shortCode: string, url: CachedUrl): Promise<void> {
    const serialized = JSON.stringify({
      id: url.id.toString(),
      shortCode: url.shortCode,
      longUrl: url.longUrl,
      createdAt: url.createdAt.toISOString(),
      expiresAt: url.expiresAt
        ? url.expiresAt.toISOString()
        : null,
    });

    await redis.set(
      this.getKey(shortCode),
      serialized,
      {
        EX: this.ttlSeconds,
      },
    );
  }

  async delete(shortCode: string): Promise<void> {
    await redis.del(this.getKey(shortCode));
  }

  private getKey(shortCode: string): string {
    return `url:${shortCode}`;
  }
}