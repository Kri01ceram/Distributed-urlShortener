import type { Request, Response } from "express";

import { AppError } from "../../config/error";
import { UrlService } from "./url.service";

export class UrlController {
  constructor(private readonly service: UrlService) {}

  createUrl = async (req: Request, res: Response) => {
    const { longUrl } = req.body;

    const url = await this.service.createUrl({
      longUrl,
    });

    return res.status(201).json({
      shortCode: url.shortCode,
      shortUrl: `http://localhost:3000/${url.shortCode}`,
      longUrl: url.longUrl,
    });
  };

  redirect = async (req: Request, res: Response) => {
    const shortCode = req.params.shortCode;

    if (typeof shortCode !== "string" || shortCode.length === 0) {
      throw new AppError(400, "Invalid short code");
    }

    const url = await this.service.getUrl(shortCode);

    if (!url) {
      throw new AppError(404, "Short URL not found");
    }

    return res.redirect(302, url.longUrl);
  };
}