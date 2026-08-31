import express from "express";
import cors from "cors";
import helmet from "helmet";

import healthRouter from "./routes/heaalth.routes";
import { createUrlRouter } from "./modules/url/url.routes";

export function createApp(workerId: bigint) {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.use("/health", healthRouter);

  const {
    router: urlRouter,
    controller: urlController,
  } = createUrlRouter(workerId);

  app.use(
    "/api/v1/urls",
    urlRouter
  );

  app.get(
    "/:shortCode",
    urlController.redirect
  );

  return app;
}