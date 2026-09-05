import express from "express";
import cors from "cors";
import helmet from "helmet";
import healthRouter from "./routes/heaalth.routes";
import { createUrlRouter } from "./modules/url/url.routes";
import { randomUUID } from "node:crypto";
import {
  incrementCounter,
  observeHistogram,
  renderMetrics,
} from "./observability/metrics";
import { errorHandler } from "./middleware/error.middleware";

export function createApp(workerId: bigint) {
  const app = express();

  app.use((req, res, next) => {
    const requestId = req.header("x-request-id") ?? randomUUID();
    const startedAt = performance.now();

    res.setHeader("X-Request-ID", requestId);
    res.setHeader("X-Worker-ID", workerId.toString());

    incrementCounter("http_requests_total");
    res.on("finish", () => {
      const durationMs = performance.now() - startedAt;
      observeHistogram("http_request_duration_ms", durationMs);

      if (res.statusCode === 404) {
        incrementCounter("http_404_total");
      }

      if (res.statusCode === 201) {
        incrementCounter("url_creations_total");
      }

      if (res.statusCode === 302) {
        incrementCounter("successful_redirects_total");
      }

      console.log(JSON.stringify({
        requestId,
        workerId: workerId.toString(),
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: Number(durationMs.toFixed(3)),
      }));
    });

    next();
  });

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.use("/health", healthRouter);

  const {
    router: urlRouter,
    controller: urlController,
  } = createUrlRouter(workerId);

  app.use("/api/v1/urls", urlRouter);

  app.get("/metrics", (_req, res) => {
    res.type("text/plain").send(renderMetrics());
  });

  app.get("/:shortCode", urlController.redirect);

  app.use(errorHandler);

  return app;
}