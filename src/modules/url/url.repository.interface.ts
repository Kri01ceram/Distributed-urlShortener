import type { Url } from "@prisma/client";

export interface UrlRepositoryInterface {
  create(
    shortCode: string,
    longUrl: string,
    expiresAt?: Date
  ): Promise<Url>;

  findByShortCode(shortCode: string): Promise<Url | null>;
}