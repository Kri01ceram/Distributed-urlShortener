import {
  PrismaClientKnownRequestError,
} from "@prisma/client/runtime/library";

import { AppError } from "../../config/error";
import type { UrlCacheInterface } from "./url.cache.interface";
import { UrlRepositoryInterface } from "./url.repository.interface";
import {
  validateExpiresAt,
  validateLongUrl,
} from "./url.validation";
import type { CreateUrlRequest } from "./url.types";
import { UrlCodeGenerator } from "./url-code.generator";
import type { UrlCodeGeneratorInterface } from "./url-code.generator.interface";

export class UrlService {
  constructor(
  private readonly repository: UrlRepositoryInterface,
  private readonly cache: UrlCacheInterface,
  private readonly codeGenerator: UrlCodeGeneratorInterface
) {}

  async createUrl(data: CreateUrlRequest) {
    validateLongUrl(data.longUrl);

    const expiresAt = validateExpiresAt(data.expiresAt);

    for (let attempt = 0; attempt < 3; attempt++) {
      const shortCode = this.codeGenerator.generate();

      try {
        return await this.repository.create(
          shortCode,
          data.longUrl,
          expiresAt
        );
      } catch (error) {
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
      "Unable to generate a unique short code"
    );
  }

  async getUrl(shortCode: string) {
    const cached = await this.cache.get(shortCode);

    if (cached) {


  if (
    cached.expiresAt &&
    new Date(cached.expiresAt) <= new Date()
  ) {
    await this.cache.delete(shortCode);
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

    await this.cache.set(shortCode, url);

    return url;
  }


}