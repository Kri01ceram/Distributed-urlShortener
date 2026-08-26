import { prisma } from "../../config/database";

export class UrlRepository {
  async create(
    shortCode: string,
    longUrl: string,
    expiresAt?: Date
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