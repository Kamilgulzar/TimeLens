import { IDLE_DETECTION_INTERVAL_SECONDS } from "../lib/config.js";

export interface IdleCallbacks {
  onIdle: () => void;
  onActive: () => void;
}

/**
 * Wires chrome.idle so time away from the computer is never counted as
 * activity. Idle/locked banks the current segment; active re-arms it.
 */
export function monitorIdle(callbacks: IdleCallbacks): void {
  chrome.idle.setDetectionInterval(IDLE_DETECTION_INTERVAL_SECONDS);

  chrome.idle.onStateChanged.addListener((state) => {
    if (state === "idle" || state === "locked") {
      callbacks.onIdle();
    } else if (state === "active") {
      callbacks.onActive();
    }
  });
}