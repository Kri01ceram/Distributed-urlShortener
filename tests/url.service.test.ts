import { describe, expect, test } from "bun:test";

import { AppError } from "../src/config/error";
import { UrlService } from "../src/modules/url/url.service";
import type { Url } from "@prisma/client";

class FakeUrlRepository {
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

describe("UrlService", () => {
  test("creates a short URL", async () => {
    const repository = new FakeUrlRepository();
    const service = new UrlService(repository);

    const result = await service.createUrl({
      longUrl: "https://www.google.com",
    });

    expect(result.longUrl).toBe("https://www.google.com");
    expect(result.shortCode).toHaveLength(6);
  });

  test("rejects an invalid URL", async () => {
    const repository = new FakeUrlRepository();
    const service = new UrlService(repository);

    expect(
      service.createUrl({
        longUrl: "hello",
      })
    ).rejects.toBeInstanceOf(AppError);
  });

  test("rejects an expired expiration date", async () => {
    const repository = new FakeUrlRepository();
    const service = new UrlService(repository);

    expect(
      service.createUrl({
        longUrl: "https://www.google.com",
        expiresAt: "2020-01-01T00:00:00.000Z",
      })
    ).rejects.toBeInstanceOf(AppError);
  });

  test("returns null for a missing short code", async () => {
    const repository = new FakeUrlRepository();
    const service = new UrlService(repository);

    const result = await service.getUrl("doesnotexist");

    expect(result).toBeNull();
  });

  test("returns null for an expired URL", async () => {
    const repository = new FakeUrlRepository();

    const expiredUrl = {
      shortCode: "expired",
      longUrl: "https://www.google.com",
      expiresAt: new Date(Date.now() - 60_000),
    };

    await repository.create(
      expiredUrl.shortCode,
      expiredUrl.longUrl,
      expiredUrl.expiresAt
    );

    const service = new UrlService(repository);

    const result = await service.getUrl("expired");

    expect(result).toBeNull();
  });
});