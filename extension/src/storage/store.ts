import type {
  ActiveSession,
  AuthInfo,
  StoreError,
} from "../types/activity.js";

/**
 * Single persisted state document for the TimeLens extension.
 * Stored in chrome.storage.local so it survives service-worker restarts.
 */

export interface StoreShape {
  auth: AuthInfo | null;
  trackingEnabled: boolean;
  session: ActiveSession | null;
  error: StoreError | null;
  syncing: boolean;
}

const KEY = "timelens:store";

export const DEFAULT_STORE: StoreShape = {
  auth: null,
  trackingEnabled: false,
  session: null,
  error: null,
  syncing: false,
};

function isStore(v: unknown): v is StoreShape {
  if (!v || typeof v !== "object") return false;
  const s = v as Record<string, unknown>;
  return (
    typeof s.trackingEnabled === "boolean" &&
    typeof s.syncing === "boolean" &&
    ("session" in s) &&
    ("auth" in s) &&
    ("error" in s)
  );
}

export async function readStore(): Promise<StoreShape> {
  const data = await chrome.storage.local.get(KEY);
  if (isStore(data[KEY])) {
    return data[KEY] as StoreShape;
  }
  return { ...DEFAULT_STORE };
}

export async function writeStore(store: StoreShape): Promise<void> {
  await chrome.storage.local.set({ [KEY]: store });
}

export async function clearStore(): Promise<void> {
  await chrome.storage.local.remove(KEY);
}