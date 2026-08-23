import { timelensApi, type ApiError } from "../api/timelens-api.js";
import { getState, updateState } from "../tracking/tracking-state.js";
import {
  readQueue,
  removeQueued,
  markAttempted,
} from "../storage/activity-queue.js";
import { log } from "../lib/logger.js";
import type { StoreError } from "../types/activity.js";

const MAX_ATTEMPTS = 5;
const BATCH_SIZE = 200;

export interface SyncResult {
  synced: number;
  remaining: number;
  error: StoreError | null;
}

/**
 * Flushes the local activity queue to the TimeLens API. Events leave the queue
 * only after the backend confirms they were stored, so retries can never
 * create duplicate records (the server dedupes by clientEventId).
 *
 * While tracking is paused nothing is sent: no new activity should be
 * recorded, no tracking data should leave the device, and anything already
 * queued is kept until the user resumes.
 */
export async function flushQueue(): Promise<SyncResult> {
  const store = await getState();
  const token = store.auth?.token;

  if (!token) {
    const remaining = (await readQueue()).length;
    return { synced: 0, remaining, error: null };
  }

  if (!store.trackingEnabled) {
    // Paused: keep the queue intact, surface it as untouched.
    const remaining = (await readQueue()).length;
    return { synced: 0, remaining, error: null };
  }

  const queue = await readQueue();
  if (queue.length === 0) {
    await updateState((s) => {
      s.syncing = false;
      s.error = null;
    });
    return { synced: 0, remaining: 0, error: null };
  }

  await updateState((s) => {
    s.syncing = true;
  });

  let synced = 0;
  let failed = false;
  let error: StoreError | null = null;

  for (let i = 0; i < queue.length; i += BATCH_SIZE) {
    const batch = queue.slice(i, i + BATCH_SIZE);
    const ids = batch.map((e) => e.clientEventId);

    try {
      const result = await timelensApi.submitActivities(token, batch);
      await removeQueued(ids);
      synced += result.created;
      log(`synced ${result.created} events (duplicates: ${result.duplicates})`);
    } catch (err) {
      const apiErr = err as ApiError;
      failed = true;

      if (apiErr.status === 401) {
        // Session expired or revoked. Stop tracking, keep the queue so a fresh
        // connection can resend it, and surface a reconnect message.
        const authError: StoreError = {
          code: "auth",
          message:
            "Your session expired. Reconnect to continue tracking.",
        };
        await updateState((s) => {
          s.auth = null;
          s.trackingEnabled = false;
          s.session = null;
          s.syncing = false;
          s.error = authError;
        });
        return { synced, remaining: (await readQueue()).length, error: authError };
      }

      // Permanently-rejected events (non-auth 4xx) are dropped after repeated
      // attempts; transient failures (5xx, network) are retried on the next
      // alarm.
      if (typeof apiErr.status === "number" && apiErr.status >= 400 && apiErr.status < 500) {
        await markAttempted(ids);
        const updated = await readQueue();
        const doomed = updated
          .filter((e) => e.attempts >= MAX_ATTEMPTS)
          .map((e) => e.clientEventId);
        if (doomed.length > 0) await removeQueued(doomed);
      }

      error = {
        code: apiErr.network ? "offline" : "server",
        message: apiErr.message || "Unable to sync activity.",
      };
      break;
    }
  }

  await updateState((s) => {
    s.syncing = false;
    s.error = failed ? error : null;
  });

  const remaining = (await readQueue()).length;
  return { synced, remaining, error: failed ? error : null };
}