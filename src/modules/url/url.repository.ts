import { prisma } from "../../config/database";

export class UrlRepository {
  async create(shortCode: string, longUrl: string) {
    return prisma.url.create({
      data: {
        shortCode,
        longUrl,
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