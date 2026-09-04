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

  getRedirectStats(urlId: bigint): Promise<RedirectStats>;
}

export type RedirectStats = {
  totalClicks: number;
  lastClickedAt: Date | null;
  clicksByUserAgent: Array<{
    userAgent: string;
    clicks: number;
  }>;
  clicksByReferer: Array<{
    referer: string;
    clicks: number;
  }>;
};