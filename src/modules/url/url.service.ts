import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

import { AppError } from "../../config/error";
import type { UrlCacheInterface } from "./url.cache.interface";
import type { UrlRepositoryInterface } from "./url.repository.interface";
import {
  validateExpiresAt,
  validateLongUrl,
} from "./url.validation";
import type { CreateUrlRequest } from "./url.types";
import type { UrlCodeGeneratorInterface } from "./url-code.generator.interface";
import type {
  PublishUrlRedirectedEventInput,
  UrlRedirectedEventPublisher,
} from "../../kafka/kafka.producer";

export class UrlService {
  constructor(
    private readonly repository: UrlRepositoryInterface,
    private readonly cache: UrlCacheInterface,
    private readonly codeGenerator: UrlCodeGeneratorInterface,
    private readonly eventPublisher?: UrlRedirectedEventPublisher,
  ) {}

  private async withCacheTimeout<T>(operation: Promise<T>): Promise<T> {
    return Promise.race([
      operation,
      new Promise<T>((_, reject) => {
        setTimeout(() => {
          reject(new Error("Cache operation timed out"));
        }, 750);
      }),
    ]);
  }

  async createUrl(data: CreateUrlRequest) {
    validateLongUrl(data.longUrl);

    const expiresAt = validateExpiresAt(data.expiresAt);

    for (let attempt = 0; attempt < 3; attempt++) {
      const shortCode = this.codeGenerator.generate();

      try {
        return await this.repository.create(
          shortCode,
          data.longUrl,
          expiresAt,
        );
      } catch (error: unknown) {
        if (
          error instanceof PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          continue;
        }

        throw error;
      }
    }

    throw new AppError(
      500,
      "Unable to generate a unique short code",
    );
  }

  async getUrl(shortCode: string) {
    let cached = null;

    try {
      cached = await this.withCacheTimeout(
        this.cache.get(shortCode),
      );
    } catch (error: unknown) {
      console.error("Cache read failed; using PostgreSQL:", error);
    }

    if (cached) {
      if (
        cached.expiresAt &&
        cached.expiresAt <= new Date()
      ) {
        try {
          await this.withCacheTimeout(
            this.cache.delete(shortCode),
          );
        } catch (error: unknown) {
          console.error("Cache delete failed:", error);
        }

        return null;
      }

      return cached;
    }

    const url = await this.repository.findByShortCode(shortCode);

    if (!url) {
      return null;
    }

    if (
      url.expiresAt &&
      url.expiresAt <= new Date()
    ) {
      return null;
    }

    try {
      await this.withCacheTimeout(
        this.cache.set(shortCode, url),
      );
    } catch (error: unknown) {
      console.error("Cache write failed; continuing with PostgreSQL result:", error);
    }

    return url;
  }

  async getRedirectStats(shortCode: string) {
    const url = await this.repository.findByShortCode(shortCode);

    if (!url) {
      return null;
    }

    const stats = await this.repository.getRedirectStats(url.id);

    return {
      shortCode: url.shortCode,
      ...stats,
    };
  }

  async redirectUrl(
    shortCode: string,
    metadata?: {
      userAgent?: string;
      referer?: string;
    },
  ) {
    const url = await this.getUrl(shortCode);

    if (!url) {
      return null;
    }

    const event: PublishUrlRedirectedEventInput = {
      urlId: url.id.toString(),
      shortCode: url.shortCode,
      userAgent: metadata?.userAgent,
      referer: metadata?.referer,
    };

    if (this.eventPublisher) {
      void this.eventPublisher
        .publishUrlRedirectedEvent(event)
        .catch((error: unknown) => {
          console.error(
            "Failed to publish URL redirect event:",
            error,
          );
        });
    }

    return url;
  }
}