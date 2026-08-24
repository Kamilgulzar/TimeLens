/**
 * Environment configuration for the TimeLens extension.
 *
 * Dev uses the local API. For production, point these at the deployed API and
 * make sure the matching origins are present in manifest.json host_permissions.
 */

export const API_BASE_URL = "https://server-liart-xi-18.vercel.app/api";

export const SYNC_ALARM_NAME = "timelens-sync";
export const SYNC_INTERVAL_MINUTES = 1;

/** Sessions shorter than this (ms) are discarded as noise. */
export const MIN_SESSION_MS = 3_000;

/** chrome.idle detection granularity in seconds. */
export const IDLE_DETECTION_INTERVAL_SECONDS = 60;

/** Interval (ms) the popup uses to refresh the live "current website" timer. */
export const POPUP_REFRESH_MS = 1_000;