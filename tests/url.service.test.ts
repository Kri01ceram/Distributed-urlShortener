import { describe, expect, test } from "bun:test";
import type { Url } from "@prisma/client";

import { AppError } from "../src/config/error";
import { UrlService } from "../src/modules/url/url.service";
import type { UrlRepositoryInterface } from "../src/modules/url/url.repository.interface";

class FakeUrlCodeGenerator {
  private counter = 0;

  generate(): string {
    this.counter++;

    return `test${this.counter}`;
  }
}

class FakeUrlRepository implements UrlRepositoryInterface {
  private urls = new Map<string, Url>();

  async create(
    shortCode: string,
    longUrl: string,
    expiresAt?: Date
  ): Promise<Url> {
    const url: Url = {
      id: BigInt(this.urls.size + 1),
      shortCode,
      longUrl,
      createdAt: new Date(),
      expiresAt: expiresAt ?? null,
    };

    this.urls.set(shortCode, url);

    return url;
  }

  async findByShortCode(
    shortCode: string
  ): Promise<Url | null> {
    return this.urls.get(shortCode) ?? null;
  }
}

class FakeUrlCache {
  private cache = new Map<
    string,
    {
      shortCode: string;
      longUrl: string;
      expiresAt: string | null;
    }
  >();

  async get(shortCode: string) {
    return this.cache.get(shortCode) ?? null;
  }

  async set(
    shortCode: string,
    url: {
      shortCode: string;
      longUrl: string;
      expiresAt: Date | null;
    }
  ) {
    this.cache.set(shortCode, {
      shortCode: url.shortCode,
      longUrl: url.longUrl,
      expiresAt: url.expiresAt?.toISOString() ?? null,
    });
  }

  async delete(shortCode: string) {
    this.cache.delete(shortCode);
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