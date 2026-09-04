import { describe, expect, test } from "bun:test";


import { AppError } from "../src/config/error";
import { UrlService } from "../src/modules/url/url.service";
import type {
  RedirectStats,
  UrlRepositoryInterface,
} from "../src/modules/url/url.repository.interface";

class FakeUrlCodeGenerator {
  private counter = 0;

  generate(): string {
    this.counter++;

    return `test${this.counter}`;
  }
}

class FakeUrlRepository implements UrlRepositoryInterface {
  private readonly urls = new Map<string, CachedUrl>();

  async create(
    shortCode: string,
    longUrl: string,
    expiresAt: Date | null,
  ): Promise<CachedUrl> {
    const url: CachedUrl = {
      id: BigInt(this.urls.size + 1),
      shortCode,
      longUrl,
      createdAt: new Date(),
      expiresAt,
    };

    this.urls.set(shortCode, url);

    return url;
  }

  async findByShortCode(
    shortCode: string,
  ): Promise<CachedUrl | null> {
    return this.urls.get(shortCode) ?? null;
  }

  async getRedirectStats(
    _urlId: bigint,
  ): Promise<RedirectStats> {
    return {
      totalClicks: 0,
      lastClickedAt: null,
      clicksByUserAgent: [],
      clicksByReferer: [],
    };
  }
}

import type {
  CachedUrl,
  UrlCacheInterface,
} from "../src/modules/url/url.cache.interface";

export class FakeUrlCache implements UrlCacheInterface {
  private readonly store = new Map<string, CachedUrl>();

  async get(shortCode: string): Promise<CachedUrl | null> {
    return this.store.get(shortCode) ?? null;
  }

  async set(shortCode: string, url: CachedUrl): Promise<void> {
    this.store.set(shortCode, url);
  }

  async delete(shortCode: string): Promise<void> {
    this.store.delete(shortCode);
  }
}

describe("UrlService", () => {
  test("creates a short URL", async () => {
    const repository = new FakeUrlRepository();
    const cache = new FakeUrlCache();
    const codeGenerator = new FakeUrlCodeGenerator();

    const service = new UrlService(
      repository,
      cache,
      codeGenerator
    );

    const result = await service.createUrl({
      longUrl: "https://www.google.com",
    });

    expect(result.longUrl).toBe(
      "https://www.google.com"
    );

    expect(result.shortCode).toMatch(
      /^[0-9A-Za-z]+$/
    );
  });

  test("rejects an invalid URL", async () => {
    const repository = new FakeUrlRepository();
    const cache = new FakeUrlCache();
    const codeGenerator = new FakeUrlCodeGenerator();

    const service = new UrlService(
      repository,
      cache,
      codeGenerator
    );

    await expect(
      service.createUrl({
        longUrl: "hello",
      })
    ).rejects.toBeInstanceOf(AppError);
  });

  test("rejects an expired expiration date", async () => {
    const repository = new FakeUrlRepository();
    const cache = new FakeUrlCache();
    const codeGenerator = new FakeUrlCodeGenerator();

    const service = new UrlService(
      repository,
      cache,
      codeGenerator
    );

    await expect(
      service.createUrl({
        longUrl: "https://www.google.com",
        expiresAt: "2020-01-01T00:00:00.000Z",
      })
    ).rejects.toBeInstanceOf(AppError);
  });

  test("returns null for a missing short code", async () => {
    const repository = new FakeUrlRepository();
    const cache = new FakeUrlCache();
    const codeGenerator = new FakeUrlCodeGenerator();

    const service = new UrlService(
      repository,
      cache,
      codeGenerator
    );

    const result = await service.getUrl(
      "doesnotexist"
    );

    expect(result).toBeNull();
  });

  test("returns null for an expired URL", async () => {
    const repository = new FakeUrlRepository();
    const cache = new FakeUrlCache();
    const codeGenerator = new FakeUrlCodeGenerator();

    const service = new UrlService(
      repository,
      cache,
      codeGenerator
    );

    await repository.create(
      "expired",
      "https://www.google.com",
      new Date(Date.now() - 60_000)
    );

    const result = await service.getUrl(
      "expired"
    );

    expect(result).toBeNull();
  });
});