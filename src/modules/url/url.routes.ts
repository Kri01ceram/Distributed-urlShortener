import { Router } from "express";

import { UrlRepository } from "./url.repository";
import { UrlService } from "./url.service";
import { UrlController } from "./url.controller";

const router = Router();

const repository = new UrlRepository();
const service = new UrlService(repository);

export const urlController = new UrlController(service);

router.post("/", urlController.createUrl);

export default router;