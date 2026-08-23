import express, { type ErrorRequestHandler, type RequestHandler } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";
import activityRoutes from "./routes/activity.routes";
import { env } from "./config/env";
import { AppError } from "./utils/errors";

export const app = express();

app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/activities", activityRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: "Not found." });
};

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (res.headersSent) return;
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message, ...(err.data ?? {}) });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error." });
};

app.use(notFoundHandler);
app.use(errorHandler);
