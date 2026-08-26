import { validateLongUrl } from "./url.validation";
import { UrlRepository } from "./url.repository";
import type { CreateUrlRequest } from "./url.types";

export class UrlService {
  constructor(private readonly repository: UrlRepository) {}

  async createUrl(data: CreateUrlRequest) {
    validateLongUrl(data.longUrl);

    const shortCode = this.generateShortCode();

    return this.repository.create(shortCode, data.longUrl);
  }

  async getUrl(shortCode: string) {
    return this.repository.findByShortCode(shortCode);
  }

  private generateShortCode(): string {
    return Math.random().toString(36).substring(2, 8);
  }
}