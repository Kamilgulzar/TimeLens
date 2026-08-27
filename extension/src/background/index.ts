import { tracker } from "./tracker.js";
import { monitorIdle } from "./idle-handler.js";
import {
  SYNC_ALARM_NAME,
  SYNC_INTERVAL_MINUTES,
} from "../lib/config.js";
import { warn } from "../lib/logger.js";
import type { TrackerSnapshot, StoreError } from "../types/activity.js";

/**
 * TimeLens background entry point. Wires browser events to the tracker and
 * exposes a small message API for the popup.
 */

function ensureSyncAlarm(): void {
  chrome.alarms.create(SYNC_ALARM_NAME, {
    periodInMinutes: SYNC_INTERVAL_MINUTES,
    delayInMinutes: 1,
  });
}

chrome.runtime.onInstalled.addListener(() => {
  ensureSyncAlarm();
  void tracker.boot();
});

chrome.runtime.onStartup.addListener(() => {
  ensureSyncAlarm();
  void tracker.boot();
});

chrome.tabs.onActivated.addListener((info) => {
  void tracker.onTabActivated(info.tabId);
});

chrome.tabs.onUpdated.addListener((_tabId, _changeInfo, tab) => {
  void tracker.onTabUpdated(tab);
});

chrome.tabs.onRemoved.addListener(() => {
  void tracker.onTabRemoved();
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  void tracker.onWindowFocusChanged(windowId);
});

monitorIdle({
  onIdle: () => void tracker.onIdleStateChanged("idle"),
  onActive: () => void tracker.onIdleStateChanged("active"),
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === SYNC_ALARM_NAME) {
    void tracker.flushNow();
  }
});

interface TimelensMessage {
  kind?: string;
  enabled?: boolean;
  email?: string;
  password?: string;
  token?: string;
  user?: { id: string; email: string; firstName?: string; lastName?: string };
}

interface TimelensResponse {
  ok: boolean;
  error?: string;
  snapshot?: TrackerSnapshot;
  result?: { synced: number; remaining: number; error: StoreError | null };
}

async function handleMessage(message: TimelensMessage): Promise<TimelensResponse> {
  switch (message.kind) {
    case "timelens.state":
      return { ok: true, snapshot: await tracker.snapshot() };

    case "timelens.toggle": {
      await tracker.setTrackingEnabled(Boolean(message.enabled));
      return { ok: true, snapshot: await tracker.snapshot() };
    }

    case "timelens.connect": {
      const result = await tracker.connect(
        message.email ?? "",
        message.password ?? ""
      );
      return result.ok
        ? { ok: true, snapshot: await tracker.snapshot() }
        : { ok: false, error: result.error, snapshot: await tracker.snapshot() };
    }

    case "timelens.oauth": {
      const result = await tracker.connectWithOAuth(
        message.token ?? "",
        message.user ?? { id: "", email: "" }
      );
      return result.ok
        ? { ok: true, snapshot: await tracker.snapshot() }
        : { ok: false, error: result.error, snapshot: await tracker.snapshot() };
    }

    case "timelens.disconnect": {
      await tracker.disconnect();
      return { ok: true, snapshot: await tracker.snapshot() };
    }

    case "timelens.sync": {
      const result = await tracker.flushNow();
      return { ok: true, result, snapshot: await tracker.snapshot() };
    }

    default:
      return { ok: false, error: "Unknown message." };
  }
}

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  handleMessage(message as TimelensMessage)
    .then(sendResponse)
    .catch((error: unknown) => {
      warn("message handler failed", error);
      sendResponse({ ok: false, error: "Internal error." });
    });
  // Keep the channel open for the async response.
  return true;
});