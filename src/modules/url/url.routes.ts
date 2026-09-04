import { Router } from "express";

import { UrlCache } from "./url.cache";
import { UrlCodeGenerator } from "./url-code.generator";
import { UrlController } from "./url.controller";
import { UrlRepository } from "./url.repository";
import { UrlService } from "./url.service";
import { kafkaEventPublisher } from "../../kafka/kafka.producer";

export function createUrlRouter(
  workerId: bigint
) {
  const router = Router();

  const repository = new UrlRepository();
  const cache = new UrlCache();

  const codeGenerator =
    new UrlCodeGenerator(workerId);

  const service = new UrlService(
  repository,
  cache,
  codeGenerator,
  kafkaEventPublisher,
);

  const controller =
    new UrlController(service);

  router.post(
    "/",
    controller.createUrl
  );

  return {
    router,
    controller,
  };
}