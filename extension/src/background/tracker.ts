import { loginWithCredentials, loginWithOAuth } from "../auth/auth-client.js";
import { classifyDomain } from "../categorization/categories.js";
import { clearQueue, enqueueEvent } from "../storage/activity-queue.js";
import {
  createSession,
  freezeSession,
  pulseSession,
  effectiveDurationMs,
  effectiveEndMs,
} from "../tracking/session-manager.js";
import { runExclusive, getState, updateState } from "../tracking/tracking-state.js";
import { domainFromUrl } from "../lib/domain.js";
import { MIN_SESSION_MS } from "../lib/config.js";
import { log, warn } from "../lib/logger.js";
import type {
  ActivityCategory,
  ActiveSession,
  AuthInfo,
  TrackerSnapshot,
} from "../types/activity.js";
import { flushQueue, type SyncResult } from "./sync-manager.js";
import { getActiveTabTarget, getTabTarget } from "./tab-events.js";
import {
  applyServerControl,
  reportDisconnected,
  reportHeartbeat,
} from "./remote-control.js";

interface TrackTarget {
  domain: string;
  category: ActivityCategory;
}

function targetFromUrl(url: string | undefined): TrackTarget | null {
  const domain = domainFromUrl(url);
  if (!domain) return null;
  return { domain, category: classifyDomain(domain) };
}

const tracker = {
  /**
   * Called on browser start / extension install. A persisted session may be
   * leftover from before the browser shut down; re-arm it from now so the
   * shutdown-to-boot gap is never counted and no duplicate session is created.
   */
  boot(): Promise<void> {
    return runExclusive(async () => {
      const s = await getState();
      if (s.auth && s.trackingEnabled && s.session) {
        s.session.lastPulseAt = Date.now();
        await updateState(() => {});
        log("resumed session for", s.session.domain);
      }
      if (s.auth?.token) {
        await applyServerControl({
          setTrackingEnabled: setTrackingEnabledCore,
          disconnect: disconnectCore,
        });
        await reportHeartbeat();
      }
    });
  },

  onTabActivated(tabId: number): Promise<void> {
    return runExclusive(async () => {
      if (!(await this.isTracking())) return;
      const target = await getTabTarget(tabId);
      await ensureActiveTarget(target);
    });
  },

  onTabUpdated(tab: chrome.tabs.Tab): Promise<void> {
    return runExclusive(async () => {
      if (!tab.active || typeof tab.url !== "string") return;
      if (tab.status === "loading") return; // wait for the URL to settle
      if (!(await this.isTracking())) return;
      await ensureActiveTarget(targetFromUrl(tab.url));
    });
  },

  /** Active tab was closed; pick up whatever is active now. */
  onTabRemoved(): Promise<void> {
    return runExclusive(async () => {
      if (!(await this.isTracking())) return;
      await ensureActiveTarget(await getActiveTabTarget());
    });
  },

  onWindowFocusChanged(windowId: number): Promise<void> {
    return runExclusive(async () => {
      if (!(await this.isTracking())) return;
      if (windowId === chrome.windows.WINDOW_ID_NONE) {
        // Browser lost focus: bank the current segment.
        const s = await getState();
        if (s.session) {
          freezeSession(s.session, Date.now());
          await updateState(() => {});
        }
        return;
      }
      await ensureActiveTarget(await getActiveTabTarget());
    });
  },

  onIdle(): Promise<void> {
    return runExclusive(async () => {
      const s = await getState();
      if (s.session) {
        freezeSession(s.session, Date.now());
        await updateState(() => {});
      }
    });
  },

  onActive(): Promise<void> {
    return runExclusive(async () => {
      const s = await getState();
      if (s.session) {
        pulseSession(s.session, Date.now());
        await updateState(() => {});
      }
    });
  },

  onIdleStateChanged(state: chrome.idle.IdleState): Promise<void> {
    if (state === "active") return this.onActive();
    return this.onIdle();
  },

  async setTrackingEnabled(enabled: boolean): Promise<void> {
    return runExclusive(() => setTrackingEnabledCore(enabled));
  },

  async connect(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
    return runExclusive(async () => {
      let auth: AuthInfo;
      try {
        auth = await loginWithCredentials(email, password);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to sign in.";
        await updateState((s) => {
          s.error = { code: "auth", message };
        });
        return { ok: false, error: message };
      }

      const s = await getState();
      s.auth = auth;
      s.trackingEnabled = true;
      s.session = null;
      s.error = null;
      await updateState(() => {});
      log("connected:", auth.email);

      await ensureActiveTarget(await getActiveTabTarget());
      void reportHeartbeat();
      return { ok: true };
    });
  },

  async connectWithOAuth(
    token: string,
    user: { id: string; email: string; firstName?: string; lastName?: string }
  ): Promise<{ ok: boolean; error?: string }> {
    return runExclusive(async () => {
      let auth: AuthInfo;
      try {
        auth = await loginWithOAuth(token, user);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to sign in.";
        await updateState((s) => {
          s.error = { code: "auth", message };
        });
        return { ok: false, error: message };
      }

      const s = await getState();
      s.auth = auth;
      s.trackingEnabled = true;
      s.session = null;
      s.error = null;
      await updateState(() => {});
      log("connected (oauth):", auth.email);

      await ensureActiveTarget(await getActiveTabTarget());
      void reportHeartbeat();
      return { ok: true };
    });
  },

  async disconnect(): Promise<void> {
    return runExclusive(() => disconnectCore());
  },

  async flushNow(): Promise<SyncResult> {
    return runExclusive(async () => {
      const hadToken = Boolean((await getState()).auth?.token);
      const result = await flushQueue();
      if (hadToken) {
        await applyServerControl({
          setTrackingEnabled: setTrackingEnabledCore,
          disconnect: disconnectCore,
        });
        await reportHeartbeat({
          lastSyncedAt: result.synced > 0 ? new Date().toISOString() : undefined,
        });
      }
      return result;
    });
  },

  async snapshot(): Promise<TrackerSnapshot> {
    const s = await getState();
    const now = Date.now();
    return {
      connected: Boolean(s.auth),
      trackingEnabled: s.trackingEnabled,
      syncState: s.syncing ? "syncing" : s.error ? "error" : "synced",
      session: s.session
        ? {
            id: s.session.id,
            domain: s.session.domain,
            category: s.session.category,
            durationMs: effectiveDurationMs(s.session, now),
            startTimeMs: s.session.startedAt,
            accruing: s.session.lastPulseAt !== null,
          }
        : null,
      error: s.error,
    };
  },

  async isTracking(): Promise<boolean> {
    const s = await getState();
    return Boolean(s.auth?.token) && s.trackingEnabled;
  },
};

/** True when the target is trackable and differs from the current session. */
async function ensureActiveTarget(target: TrackTarget | null): Promise<void> {
  const s = await getState();
  if (!s.auth || !s.trackingEnabled) return;

  const now = Date.now();

  if (!target) {
    // Non-http page, chrome://, extension page, or nothing focused.
    if (s.session) await finalizeActiveSession(s, now);
    return;
  }

  if (s.session && s.session.domain === target.domain) {
    pulseSession(s.session, now);
    await updateState(() => {});
    return;
  }

  if (s.session) {
    await finalizeActiveSession(s, now);
  }
  s.session = createSession(target.domain, target.category, now);
  await updateState(() => {});
  log("tracking", target.domain, "->", target.category);
}

async function finalizeActiveSession(
  s: { session: ActiveSession | null; auth: AuthInfo | null },
  now: number
): Promise<void> {
  const session = s.session;
  if (!session) return;

  const durationMs = effectiveDurationMs(session, now);
  const endMs = effectiveEndMs(session, now);
  s.session = null;

  if (!s.auth) return;

  if (durationMs < MIN_SESSION_MS) {
    // Tab flicker / noise - drop rather than store junk.
    return;
  }

  await enqueueEvent({
    clientEventId: session.id,
    website: session.domain,
    category: session.category,
    startTime: new Date(session.startedAt).toISOString(),
    endTime: new Date(endMs).toISOString(),
  });
  log("finalized", session.domain, `${Math.round(durationMs / 1000)}s`);
}

/**
 * Mutex-free core used by the public API AND by remote-control calls that run
 * inside an existing runExclusive. Never calls back into runExclusive, so the
 * tracker can safely apply server instructions from within flushNow/boot.
 */
async function setTrackingEnabledCore(enabled: boolean): Promise<void> {
  const s = await getState();
  if (enabled) {
    s.trackingEnabled = true;
    await updateState(() => {});
    await ensureActiveTarget(await getActiveTabTarget());
  } else {
    await finalizeActiveSession(s, Date.now());
    s.trackingEnabled = false;
    s.error = null;
    await updateState(() => {});
    log("tracking paused");
  }
  void reportHeartbeat();
}

async function disconnectCore(): Promise<void> {
  const s = await getState();
  // Tell the server we're gone before clearing the token, then discard any
  // in-flight session and queue so nothing is ever sent for this account.
  if (s.auth?.token) void reportDisconnected(s.auth.token);
  s.auth = null;
  s.trackingEnabled = false;
  s.session = null;
  s.error = null;
  await updateState(() => {});
  await clearQueue();
  log("disconnected");
}

export { tracker };