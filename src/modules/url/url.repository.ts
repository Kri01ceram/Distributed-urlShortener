import { prisma } from "../../config/database";
import type {
  RedirectStats,
  UrlRepositoryInterface,
} from "./url.repository.interface";
import { observeDatabaseQuery } from "../../observability/metrics";

export class UrlRepository implements UrlRepositoryInterface {
  async create(
    shortCode: string,
    longUrl: string,
    expiresAt: Date | null,
  ) {
    return observeDatabaseQuery(() => prisma.url.create({
      data: { shortCode, longUrl, expiresAt },
    }));
  }

  async findByShortCode(shortCode: string) {
    return observeDatabaseQuery(() => prisma.url.findUnique({
      where: {
        shortCode,
      },
    }));
  }

  async getRedirectStats(urlId: bigint): Promise<RedirectStats> {
    const [aggregate, userAgents, referers] = await Promise.all([
      observeDatabaseQuery(() => prisma.redirectEvent.aggregate({
        where: { urlId },
        _count: { _all: true },
        _max: { occurredAt: true },
      })),
      observeDatabaseQuery(() => prisma.redirectEvent.groupBy({
        by: ["userAgent"],
        where: { urlId, userAgent: { not: null } },
        _count: { _all: true },
      })),
      observeDatabaseQuery(() => prisma.redirectEvent.groupBy({
        by: ["referer"],
        where: { urlId, referer: { not: null } },
        _count: { _all: true },
      })),
    ]);

    return {
      totalClicks: aggregate._count._all,
      lastClickedAt: aggregate._max.occurredAt,
      clicksByUserAgent: userAgents.map((entry) => ({
        userAgent: entry.userAgent ?? "unknown",
        clicks:
          typeof entry._count === "object" && entry._count !== null
            ? entry._count._all ?? 0
            : 0,
      })),
      clicksByReferer: referers.map((entry) => ({
        referer: entry.referer ?? "unknown",
        clicks:
          typeof entry._count === "object" && entry._count !== null
            ? entry._count._all ?? 0
            : 0,
      })),
    };
  }
}