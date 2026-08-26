import express from "express";
import cors from "cors";
import helmet from "helmet";

import healthRouter from "./routes/heaalth.routes";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/health", healthRouter);

export default app;