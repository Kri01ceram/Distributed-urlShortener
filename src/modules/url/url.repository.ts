import { prisma } from "../../config/database";
import type { UrlRepositoryInterface } from "./url.repository.interface";

export class UrlRepository implements UrlRepositoryInterface {
  async create(
    shortCode: string,
    longUrl: string,
    expiresAt: Date | null,
  ) {
    return prisma.url.create({
      data: {
        shortCode,
        longUrl,
        expiresAt,
      },
    });
  }

  async findByShortCode(shortCode: string) {
    return prisma.url.findUnique({
      where: {
        shortCode,
      },
    });
  }
}