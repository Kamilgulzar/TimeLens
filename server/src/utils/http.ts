import type { Response } from "express";
import { AppError } from "./errors";

export function handleError(res: Response, error: unknown): void {
  if (error instanceof AppError) {
    res.status(error.status).json({ error: error.message, ...(error.data ?? {}) });
    return;
  }
  if (error && typeof error === "object" && "issues" in error) {
    const zodError = error as { issues: Array<{ message: string; path: (string | number)[] }> };
    const firstMessage = zodError.issues[0]?.message || "Invalid input.";
    res.status(400).json({ error: firstMessage });
    return;
  }
  console.error("[Auth Error]", error);
  res.status(500).json({ error: "Internal server error." });
}
