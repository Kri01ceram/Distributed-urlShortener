import type { Request, Response } from "express";

import { AppError } from "../../config/error";
import { UrlService } from "./url.service";
import { handleError } from "../../config/error";

export class UrlController {
  constructor(private readonly service: UrlService) {}

  createUrl = async (req: Request, res: Response) => {
  const { longUrl, expiresAt } = req.body;

  const url = await this.service.createUrl({
    longUrl,
    expiresAt,
  });

  return res.status(201).json({
    shortCode: url.shortCode,
    shortUrl: `http://localhost:3000/${url.shortCode}`,
    longUrl: url.longUrl,
    expiresAt: url.expiresAt,
  });
};

  redirect = async (req: Request, res: Response) => {
  try {
    const shortCode = req.params.shortCode;

if (typeof shortCode !== "string") {
  res.status(400).json({
    message: "Invalid short code",
  });
  return;
}

    const url = await this.service.redirectUrl(shortCode, {
      userAgent: req.headers["user-agent"],
      referer: req.headers.referer,
    });

    if (!url) {
      res.status(404).json({
        message: "Short URL not found or expired",
      });
      return;
    }

    res.redirect(302, url.longUrl);
  } catch (error: unknown) {
    handleError(error, res);
  }
};
}