import { timelensApi } from "../api/timelens-api.js";
import { getState } from "../tracking/tracking-state.js";
import { log } from "../lib/logger.js";

const EXTENSION_VERSION = "0.1.0";

export interface ControlActions {
  setTrackingEnabled: (enabled: boolean) => Promise<void>;
  disconnect: () => Promise<void>;
}

/**
 * Fetch any pending instructions from the server (pause/resume/disconnect set
 * from the web dashboard), apply them, and acknowledge so they aren't applied
 * twice. Never bails on transient failures - the next heartbeat retries.
 */
export async function applyServerControl(actions: ControlActions): Promise<void> {
  const store = await getState();
  const token = store.auth?.token;
  if (!token) return;

  let pending: { trackingEnabled: boolean | null; disconnect: boolean };
  try {
    pending = await timelensApi.extensionPending(token);
  } catch {
    return; // offline / server down - retry on the next sync cycle
  }

  let applied = false;
  if (pending.disconnect) {
    await actions.disconnect();
    applied = true;
    log("disconnected by remote control");
  } else if (pending.trackingEnabled !== null) {
    const current = (await getState()).trackingEnabled;
    if (pending.trackingEnabled !== current) {
      await actions.setTrackingEnabled(pending.trackingEnabled);
      applied = true;
      log(pending.trackingEnabled ? "remote: tracking resumed" : "remote: tracking paused");
    }
  }

  if (!applied) return;

  try {
    await timelensApi.extensionAck(token);
  } catch {
    // The instruction will be re-applied idempotently on the next cycle.
  }
}

/** Report current connection/tracking state so the dashboard reflects reality. */
export async function reportHeartbeat(opts: { lastSyncedAt?: string } = {}): Promise<void> {
  const store = await getState();
  const token = store.auth?.token;
  if (!token) return;
  try {
    await timelensApi.extensionHeartbeat(token, {
      connected: true,
      trackingEnabled: store.trackingEnabled,
      browser: browserName(),
      version: EXTENSION_VERSION,
      lastSyncedAt: opts.lastSyncedAt,
    });
  } catch {
    // Offline - the dashboard will show the extension as disconnected.
  }
}

/** Report that the extension went away (user disconnected locally). */
export async function reportDisconnected(token: string): Promise<void> {
  try {
    await timelensApi.extensionHeartbeat(token, {
      connected: false,
      trackingEnabled: false,
      browser: browserName(),
      version: EXTENSION_VERSION,
    });
  } catch {
    // Offline; the stale heartbeat will age out server-side.
  }
}

export function browserName(): string {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("OPR/")) return "Opera";
  if (ua.includes("Brave")) return "Brave";
  if (ua.includes("Chrome")) return "Chrome";
  return "Chromium";
}