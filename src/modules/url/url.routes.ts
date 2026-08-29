import { Router } from "express";

import { UrlCache } from "./url.cache";
import { UrlController } from "./url.controller";
import { UrlRepository } from "./url.repository";
import { UrlService } from "./url.service";

const router = Router();

const repository = new UrlRepository();
const cache = new UrlCache();

const service = new UrlService(
  repository,
  cache
);

export const urlController = new UrlController(service);

router.post("/", urlController.createUrl);

export default router;