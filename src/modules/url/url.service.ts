import { Prisma } from "@prisma/client";

import { AppError } from "../../config/error";
import { UrlRepository } from "./url.repository";
import { validateExpiresAt, validateLongUrl } from "./url.validation";
import type { CreateUrlRequest } from "./url.types";
import type { UrlRepositoryInterface } from "./url.repository.interface";

export class UrlService {
  constructor(
  private readonly repository: UrlRepositoryInterface,
  private readonly cache: UrlCache
) {}

  async createUrl(data: CreateUrlRequest) {
    validateLongUrl(data.longUrl);

    const expiresAt = validateExpiresAt(data.expiresAt);

    for (let attempt = 0; attempt < 3; attempt++) {
      const shortCode = this.generateShortCode();

      try {
        return await this.repository.create(
          shortCode,
          data.longUrl,
          expiresAt
        );
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          continue;
        }

        throw error;
      }
    }

    throw new AppError(
      500,
      "Unable to generate a unique short code"
    );
  }

  async getUrl(shortCode: string) {
    const url = await this.repository.findByShortCode(shortCode);

    if (!url) {
      return null;
    }

    if (url.expiresAt && url.expiresAt <= new Date()) {
      return null;
    }

    return url;
  }

  private generateShortCode(): string {
    return Math.random().toString(36).substring(2, 8);
  }
}