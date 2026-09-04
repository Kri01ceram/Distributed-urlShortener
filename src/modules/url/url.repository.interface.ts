import type { CachedUrl } from "./url.cache.interface";

export interface UrlRepositoryInterface {
  create(
    shortCode: string,
    longUrl: string,
    expiresAt: Date | null,
  ): Promise<CachedUrl>;

  findByShortCode(
    shortCode: string,
  ): Promise<CachedUrl | null>;
}