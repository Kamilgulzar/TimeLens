import { POPUP_REFRESH_MS } from "../lib/config.js";
import type { StoreError, TrackerSnapshot } from "../types/activity.js";
import { formatDuration } from "./format.js";

const CLIENT_APP_URL = "https://timelens-client.vercel.app";

interface PopupMessage {
  kind: string;
  enabled?: boolean;
  email?: string;
  password?: string;
  token?: string;
  user?: { id: string; email: string; firstName?: string; lastName?: string };
}

interface PopupResponse {
  ok: boolean;
  error?: string;
  snapshot?: TrackerSnapshot;
  result?: { synced: number; remaining: number; error: StoreError | null };
}

function sendMessage(message: PopupMessage): Promise<PopupResponse> {
  return chrome.runtime.sendMessage(message) as Promise<PopupResponse>;
}

const el = {
  statusPill: document.getElementById("status-pill") as HTMLSpanElement,
  viewConnect: document.getElementById("view-connect") as HTMLElement,
  viewTrack: document.getElementById("view-track") as HTMLElement,
  connectForm: document.getElementById("connect-form") as HTMLFormElement,
  email: document.getElementById("email") as HTMLInputElement,
  password: document.getElementById("password") as HTMLInputElement,
  connectBtn: document.getElementById("connect-btn") as HTMLButtonElement,
  connectError: document.getElementById("connect-error") as HTMLParagraphElement,
  googleBtn: document.getElementById("google-btn") as HTMLButtonElement,
  githubBtn: document.getElementById("github-btn") as HTMLButtonElement,
  trackCard: document.getElementById("track-card") as HTMLDivElement,
  trackStatus: document.getElementById("track-status") as HTMLParagraphElement,
  trackDomain: document.getElementById("track-domain") as HTMLHeadingElement,
  trackCategory: document.getElementById("track-category") as HTMLSpanElement,
  trackTimer: document.getElementById("track-timer") as HTMLParagraphElement,
  trackHint: document.getElementById("track-hint") as HTMLParagraphElement,
  toggleBtn: document.getElementById("toggle-btn") as HTMLButtonElement,
  toggleSub: document.getElementById("toggle-sub") as HTMLParagraphElement,
  syncDot: document.getElementById("sync-dot") as HTMLSpanElement,
  syncText: document.getElementById("sync-text") as HTMLSpanElement,
  syncBtn: document.getElementById("sync-btn") as HTMLButtonElement,
  signoutBtn: document.getElementById("signout-btn") as HTMLButtonElement,
};

let current: TrackerSnapshot | null = null;

function setStatusPill(snapshot: TrackerSnapshot): void {
  const { connected, trackingEnabled } = snapshot;
  if (!connected) {
    el.statusPill.dataset.state = "off";
    el.statusPill.textContent = "Not signed in";
  } else if (trackingEnabled) {
    el.statusPill.dataset.state = "tracking";
    el.statusPill.textContent = "Tracking";
  } else {
    el.statusPill.dataset.state = "paused";
    el.statusPill.textContent = "Paused";
  }
}

function renderSync(snapshot: TrackerSnapshot): void {
  if (snapshot.syncState === "syncing") {
    el.syncDot.dataset.state = "syncing";
    el.syncText.textContent = "Syncing…";
    return;
  }
  if (snapshot.error) {
    el.syncDot.dataset.state = "error";
    el.syncText.textContent = snapshot.error.message;
    return;
  }
  el.syncDot.dataset.state = "synced";
  el.syncText.textContent = "Synced";
}

function renderTracker(snapshot: TrackerSnapshot): void {
  const tracking = snapshot.connected && snapshot.trackingEnabled;

  el.toggleBtn.setAttribute("aria-checked", tracking ? "true" : "false");
  el.toggleSub.textContent = tracking
    ? "Watch the current tab and count the time"
    : "Paused — your batch is synced and safe";
  renderSync(snapshot);

  const session = tracking ? snapshot.session : null;
  if (!session) {
    el.trackStatus.textContent = tracking ? "Waiting for a tab" : "Paused";
    el.trackDomain.textContent = "—";
    el.trackDomain.classList.add("placeholder");
    el.trackCategory.textContent = "—";
    el.trackTimer.textContent = "00:00";
    el.trackHint.textContent = tracking
      ? "Open a page — time starts accruing immediately."
      : "Resume tracking to record your current tab.";
    return;
  }

  el.trackStatus.textContent = "Tracking";
  el.trackDomain.textContent = session.domain;
  el.trackDomain.classList.remove("placeholder");
  el.trackCategory.textContent = session.category;
  el.trackTimer.textContent = formatDuration(session.durationMs);
  el.trackHint.textContent = session.accruing
    ? "Only active time counts — idle never adds up."
    : "Idle detected — this segment is banked and waiting.";
}

function render(snapshot: TrackerSnapshot): void {
  current = snapshot;
  setStatusPill(snapshot);
  if (snapshot.connected) {
    el.viewConnect.hidden = true;
    el.viewTrack.hidden = false;
    renderTracker(snapshot);
    el.connectError.hidden = true;
  } else {
    el.viewTrack.hidden = true;
    el.viewConnect.hidden = false;
  }
}

let refreshing = false;
async function refresh(): Promise<void> {
  if (refreshing) return;
  refreshing = true;
  try {
    const response = await sendMessage({ kind: "timelens.state" });
    if (response.ok && response.snapshot) render(response.snapshot);
  } catch {
    // The service worker may be waking up; the next tick will recover.
  } finally {
    refreshing = false;
  }
}

function startOAuth(provider: "google" | "github"): void {
  const redirectUri = `${chrome.identity.getRedirectURL()}`;
  const authUrl = `${CLIENT_APP_URL}/auth/extension-oauth?provider=${provider}&redirect=${encodeURIComponent(redirectUri)}`;

  chrome.identity.launchWebAuthFlow(
    { url: authUrl, interactive: true },
    (redirectUrl) => {
      if (chrome.runtime.lastError || !redirectUrl) {
        el.connectError.textContent = chrome.runtime.lastError?.message ?? "OAuth flow was cancelled.";
        el.connectError.hidden = false;
        return;
      }

      const url = new URL(redirectUrl);
      const token = url.searchParams.get("token");
      const userJson = url.searchParams.get("user");

      if (!token || !userJson) {
        el.connectError.textContent = "OAuth flow did not return a token.";
        el.connectError.hidden = false;
        return;
      }

      let user: { id: string; email: string; firstName?: string; lastName?: string };
      try {
        user = JSON.parse(userJson);
      } catch {
        el.connectError.textContent = "Invalid user data from OAuth flow.";
        el.connectError.hidden = false;
        return;
      }

      sendMessage({
        kind: "timelens.oauth",
        token,
        user,
      }).then((response) => {
        if (response.ok && response.snapshot) {
          render(response.snapshot);
        } else {
          el.connectError.textContent = response.error ?? "OAuth login failed.";
          el.connectError.hidden = false;
        }
      });
    }
  );
}

el.connectForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  el.connectError.hidden = true;
  el.connectBtn.disabled = true;
  el.connectBtn.textContent = "Signing in…";
  try {
    const response = await sendMessage({
      kind: "timelens.connect",
      email: el.email.value.trim(),
      password: el.password.value,
    });
    if (response.ok && response.snapshot) {
      render(response.snapshot);
      el.password.value = "";
    } else if (response.error) {
      el.connectError.textContent = response.error;
      el.connectError.hidden = false;
    }
  } finally {
    el.connectBtn.disabled = false;
    el.connectBtn.textContent = "Sign in";
  }
});

el.toggleBtn.addEventListener("click", async () => {
  const target = current?.connected && current.trackingEnabled ? false : true;
  el.toggleBtn.disabled = true;
  try {
    const response = await sendMessage({ kind: "timelens.toggle", enabled: target });
    if (response.snapshot) render(response.snapshot);
  } finally {
    el.toggleBtn.disabled = false;
  }
});

el.syncBtn.addEventListener("click", async () => {
  el.syncBtn.disabled = true;
  try {
    const response = await sendMessage({ kind: "timelens.sync" });
    if (response.snapshot) render(response.snapshot);
  } finally {
    el.syncBtn.disabled = false;
    void refresh();
  }
});

el.signoutBtn.addEventListener("click", async () => {
  el.signoutBtn.disabled = true;
  try {
    const response = await sendMessage({ kind: "timelens.disconnect" });
    if (response.snapshot) render(response.snapshot);
  } finally {
    el.signoutBtn.disabled = false;
  }
});

void refresh();
setInterval(() => void refresh(), POPUP_REFRESH_MS);

el.googleBtn.addEventListener("click", () => startOAuth("google"));
el.githubBtn.addEventListener("click", () => startOAuth("github"));