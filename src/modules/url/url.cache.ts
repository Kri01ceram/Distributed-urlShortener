import { redis } from "../../config/redis";
import type { UrlCacheInterface } from "./url.cache.interface";

interface CachedUrl {
  shortCode: string;
  longUrl: string;
  expiresAt: string | null;
}


export class UrlCache implements UrlCacheInterface  {
  private readonly prefix = "url:";

  async get(shortCode: string): Promise<CachedUrl | null> {
    const data = await redis.get(`${this.prefix}${shortCode}`);

    if (!data) {
      return null;
    }

    return JSON.parse(data) as CachedUrl;
  }

  async set(
    shortCode: string,
    url: {
      shortCode: string;
      longUrl: string;
      expiresAt: Date | null;
    }
  ): Promise<void> {
    const value: CachedUrl = {
      shortCode: url.shortCode,
      longUrl: url.longUrl,
      expiresAt: url.expiresAt?.toISOString() ?? null,
    };

    if (url.expiresAt) {
      const ttl = Math.ceil(
        (url.expiresAt.getTime() - Date.now()) / 1000
      );

      if (ttl > 0) {
        await redis.set(
          `${this.prefix}${shortCode}`,
          JSON.stringify(value),
          {
            EX: ttl,
          }
        );
      }

      return;
    }

    await redis.set(
      `${this.prefix}${shortCode}`,
      JSON.stringify(value)
    );
  }

  async delete(shortCode: string): Promise<void> {
    await redis.del(`${this.prefix}${shortCode}`);
  }
}