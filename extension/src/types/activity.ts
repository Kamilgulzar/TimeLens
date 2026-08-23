export const ACTIVITY_CATEGORIES = [
  "Development",
  "Work",
  "Communication",
  "Research",
  "Learning",
  "Productivity",
  "AI / Research",
  "Design",
  "Entertainment",
  "Social Media",
  "News",
  "Shopping",
  "Other",
] as const;

export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];

export type CategoryKind = "focus" | "neutral" | "distract";

/** A finalized activity session ready to be submitted to the TimeLens API. */
export interface ActivityEvent {
  clientEventId: string;
  website: string;
  category: ActivityCategory;
  startTime: string; // ISO-8601 UTC
  endTime: string; // ISO-8601 UTC
}

/** An event queued locally until it can be synced. */
export interface PendingEvent extends ActivityEvent {
  attempts: number;
  queuedAt: number;
}

/** In-progress tracking session in the browser. */
export interface ActiveSession {
  /** Reused as the clientEventId so retries are idempotent. */
  id: string;
  domain: string;
  category: ActivityCategory;
  /** When the session started (ms epoch, UTC). */
  startedAt: number;
  /** Accrued active time in ms (idle/focus-loss excluded). */
  accumulatedMs: number;
  /** Start of the currently-accruing segment, or null when frozen. */
  lastPulseAt: number | null;
}

export interface AuthInfo {
  token: string;
  userId: string;
  email: string;
  displayName: string;
}

export type StoreErrorCode =
  | "auth"
  | "offline"
  | "server"
  | "tracking-paused";

export interface StoreError {
  code: StoreErrorCode;
  message: string;
}

export interface TrackerSnapshot {
  connected: boolean;
  trackingEnabled: boolean;
  syncState: "synced" | "syncing" | "error";
  session: {
    id: string;
    domain: string;
    category: ActivityCategory;
    durationMs: number;
    startTimeMs: number;
    accruing: boolean;
  } | null;
  error: StoreError | null;
}