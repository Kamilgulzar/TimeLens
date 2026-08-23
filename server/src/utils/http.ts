import type { Response } from "express";
import { AppError } from "./errors";

/**
 * Maps any thrown value to a JSON error response.
 *
 * `AppError` carries an explicit HTTP status and optional `data` (e.g. the
 * email needed to drive a client-side redirect). Everything else is treated as
 * an unexpected server failure: we never echo internal error text (database
 * constraints, stack details, etc.) back to the client.
 */
export function handleError(res: Response, error: unknown): void {
  if (error instanceof AppError) {
    res.status(error.status).json({ error: error.message, ...(error.data ?? {}) });
    return;
  }
  res.status(500).json({ error: "Internal server error." });
}
