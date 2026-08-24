import express, { type ErrorRequestHandler, type RequestHandler } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";
import activityRoutes from "./routes/activity.routes";
import { env } from "./config/env";
import { AppError } from "./utils/errors";
import prisma from "./prisma/client"

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin, such as server-to-server requests.
      if (!origin) {
        callback(null, true);
        return;
      }

      // Allow the TimeLens web client.
      if (origin === env.clientUrl) {
        callback(null, true);
        return;
      }

      // Allow the TimeLens Chrome/Edge extension.
      if (origin.startsWith("chrome-extension://")) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/activities", activityRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/db-test", async (_req, res) => {
  try {
    const result = await prisma.$queryRaw`SELECT NOW()`;

    res.json({
      status: "ok",
      database: result,
    });
  } catch (error) {
    console.error("DATABASE TEST ERROR:", error);

    res.status(500).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Database connection failed",
    });
  }
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

export default app;