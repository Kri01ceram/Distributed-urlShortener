import express from "express";
import cors from "cors";
import helmet from "helmet";

import healthRouter from "./routes/heaalth.routes";
import urlRouter, { urlController } from "./modules/url/url.routes";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/health", healthRouter);
app.use("/api/v1/urls", urlRouter);

app.get("/:shortCode", urlController.redirect);

export default app;