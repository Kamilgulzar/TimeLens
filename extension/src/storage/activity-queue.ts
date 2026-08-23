import type { ActivityEvent, PendingEvent } from "../types/activity.js";

/**
 * Local queue for activity events that could not be sent to the API yet
 * (offline, API down, auth issues). Events leave the queue only after the
 * backend confirms they were stored.
 */

const KEY = "timelens:queue";

export async function readQueue(): Promise<PendingEvent[]> {
  const data = await chrome.storage.local.get(KEY);
  const q = data[KEY];
  if (Array.isArray(q)) return q as PendingEvent[];
  return [];
}

async function writeQueue(queue: PendingEvent[]): Promise<void> {
  await chrome.storage.local.set({ [KEY]: queue });
}

/** Add a finalized event to the queue. Duplicate clientEventIds are ignored. */
export async function enqueueEvent(event: ActivityEvent): Promise<boolean> {
  const queue = await readQueue();
  if (queue.some((e) => e.clientEventId === event.clientEventId)) {
    return false;
  }
  const pending: PendingEvent = {
    ...event,
    attempts: 0,
    queuedAt: Date.now(),
  };
  queue.push(pending);
  await writeQueue(queue);
  return true;
}

/** Remove events that the backend reported as stored. */
export async function removeQueued(ids: string[]): Promise<PendingEvent[]> {
  const queue = await readQueue();
  const removed = new Set(ids);
  const next = queue.filter((e) => !removed.has(e.clientEventId));
  await writeQueue(next);
  return next;
}

/** Mark a batch as attempted (attempts++). Returns the updated queue. */
export async function markAttempted(ids: string[]): Promise<PendingEvent[]> {
  const queue = await readQueue();
  const attempted = new Set(ids);
  const next = queue.map((e) =>
    attempted.has(e.clientEventId) ? { ...e, attempts: e.attempts + 1 } : e
  );
  await writeQueue(next);
  return next;
}

export async function clearQueue(): Promise<void> {
  await chrome.storage.local.remove(KEY);
}