import { Router } from "express";

import { prisma } from "../config/database";
import { redis } from "../config/redis";

const router = Router();

router.get("/", async (_req, res) => {
  let database = "ok";
  let cache = "ok";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = "error";
  }

  try {
    await redis.ping();
  } catch {
    cache = "error";
  }

  const healthy = database === "ok" && cache === "ok";

  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "error",
    service: "url-shortener",
    dependencies: {
      database,
      cache,
    },
  });
});

export default router;