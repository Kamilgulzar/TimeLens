/*
 * Deterministic integration test for the Phase-2 background engine. Loads the
 * compiled background modules with a chrome.* mock, drives the exact events the
 * browser would fire (install, tab activation, idle transitions, alarm), and
 * verifies sessions/queue/sync against the real API server on localhost:5000
 * (records are submitted only after connect() to the test user).
 *
 * Usage: node scripts/wiring-test.mjs
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const API = "http://localhost:5000/api";
const email = `wiring-${Date.now()}@timelens.test`;
const password = "Wiring#12345";
const MIN = 60_000;

// ---- controllable clock ---------------------------------------------------
const originalNow = Date.now;
let nowMs = originalNow() - 2 * 3600_000; // start 2h in the past so no fake timestamp lands in the future
Date.now = () => nowMs;
const advance = (ms) => { nowMs += ms; };

// ---- chrome.* mock --------------------------------------------------------
const listeners = {
  runtimeOnMessage: null,
  runtimeOnInstalled: null,
  runtimeOnStartup: null,
  tabsOnActivated: null,
  tabsOnUpdated: null,
  tabsOnRemoved: null,
  windowsOnFocus: null,
  idleOnState: null,
  alarmOnAlarm: null,
};
let alarmCreate;
const storage = new Map();
const tabs = new Map();

const chromeMock = {
  storage: {
    local: {
      async get(key) { return { [key]: storage.get(key) }; },
      async set(items) { for (const [k, v] of Object.entries(items)) storage.set(k, v); },
      async remove(key) { storage.delete(key); },
    },
  },
  tabs: {
    onActivated: { addListener: (f) => { listeners.tabsOnActivated = f; } },
    onUpdated: { addListener: (f) => { listeners.tabsOnUpdated = f; } },
    onRemoved: { addListener: (f) => { listeners.tabsOnRemoved = f; } },
    async get(id) { const t = tabs.get(id); if (!t) throw new Error("no tab " + id); return t; },
    async query({ active }) { if (active) { for (const t of tabs.values()) if (t.active) return [t]; } return []; },
  },
  windows: {
    WINDOW_ID_NONE: -1,
    onFocusChanged: { addListener: (f) => { listeners.windowsOnFocus = f; } },
  },
  idle: {
    onStateChanged: { addListener: (f) => { listeners.idleOnState = f; } },
    setDetectionInterval() {},
    queryState() { return Promise.resolve("active"); },
  },
  alarms: {
    create: (name, opts) => { alarmCreate = { name, opts }; },
    onAlarm: { addListener: (f) => { listeners.alarmOnAlarm = f; } },
  },
  runtime: {
    onInstalled: { addListener: (f) => { listeners.runtimeOnInstalled = f; } },
    onStartup: { addListener: (f) => { listeners.runtimeOnStartup = f; } },
    onMessage: { addListener: (f) => { listeners.runtimeOnMessage = f; } },
  },
};
globalThis.chrome = chromeMock;

// Load the real background entry point.
await import(pathToFileURL(distPath("background/index.js")).href);

async function postTo(path, body, token) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} -> ${res.status}: ${await res.text()}`);
  return res.json();
}
async function getSummary(token, from, to) {
  const res = await fetch(`${API}/activities/summary?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`summary -> ${res.status}`);
  return res.json();
}

function sendMessage(msg) {
  return new Promise((resolve, reject) => {
    if (!listeners.runtimeOnMessage) return reject(new Error("no onMessage listener"));
    const ret = listeners.runtimeOnMessage(msg, {}, resolve);
    if (ret === false) reject(new Error("listener did not keep channel open"));
  });
}

const ok = (cond, label) => {
  console.log(`${cond ? "ok  " : "FAIL"} - ${label}`);
  if (!cond) process.exitCode = 1;
};
const closeTo = (a, b, tol = 2) => Math.abs(a - b) <= tol;

function setActiveTab(id, url) {
  tabs.set(id, { id, url, active: true, status: "complete" });
  for (const t of tabs.values()) if (t.id !== id) t.active = false;
}

// ---- fixture: throwaway user on the real server ---------------------------
await postTo("/auth/register", {
  email, password, firstName: "Wiring", lastName: "Test",
});
await postTo("/auth/verify-email", { email });
console.log("test user ready:", email);

try {
  // install -> boot
  listeners.runtimeOnInstalled({ reason: "install" });
  ok(alarmCreate?.name === "timelens-sync", "sync alarm registered on install");

  const idle0 = await sendMessage({ kind: "timelens.state" });
  ok(idle0.snapshot.connected === false && idle0.snapshot.trackingEnabled === false, "initial state: disconnected, paused");

  // connect
  const conn = await sendMessage({ kind: "timelens.connect", email, password });
  ok(conn.ok && conn.snapshot.connected && conn.snapshot.trackingEnabled, "connect() succeeds");

  // act on github.com for 10 min
  const { tracker: trackerMod } = await import(pathToFileURL(distPath("background/tracker.js")).href);
  ok(
    listeners.tabsOnActivated && listeners.tabsOnUpdated &&
    listeners.tabsOnRemoved && listeners.windowsOnFocus &&
    listeners.idleOnState && listeners.alarmOnAlarm &&
    listeners.runtimeOnInstalled && listeners.runtimeOnStartup &&
    listeners.runtimeOnMessage,
    "index wires every browser listener"
  );
  setActiveTab(1, "https://github.com/acme/repo/pull/12");
  await trackerMod.onTabActivated(1); // tabs.onActivated handler
  advance(10 * MIN);
  const afterGithub = await sendMessage({ kind: "timelens.state" });
  ok(afterGithub.snapshot.session?.domain === "github.com", "session started on github.com");
  ok(closeTo(afterGithub.snapshot.session.durationMs, 10 * MIN), "10 min accumulated on github.com");

  // browser goes idle for 20 min -> frozen, no accrual
  await trackerMod.onIdleStateChanged("idle"); // chrome.idle.onStateChanged handler
  advance(20 * MIN);
  const idle = await sendMessage({ kind: "timelens.state" });
  ok(idle.snapshot.session?.accruing === false, "idle freezes the session");
  ok(closeTo(idle.snapshot.session.durationMs, 10 * MIN), "idle time not counted");

  // back to active for 5 min
  await trackerMod.onIdleStateChanged("active");
  advance(5 * MIN);
  const back = await sendMessage({ kind: "timelens.state" });
  ok(back.snapshot.session?.accruing === true, "active re-arms the session");
  ok(closeTo(back.snapshot.session.durationMs, 15 * MIN), "15 min total counted");

  // switch to youtube -> github finalized + enqueued, youtube session starts
  setActiveTab(2, "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  await trackerMod.onTabActivated(2);
  const switched = await sendMessage({ kind: "timelens.state" });
  ok(switched.snapshot.session?.domain === "youtube.com", "domain switch starts a new session");
  const githubEvent = [...storage.entries()].find(([k]) => k.startsWith("timelens:queue"))?.[1]?.find((e) => e.website === "github.com");
  ok(Boolean(githubEvent), "github.com event enqueued");
  ok(closeTo((new Date(githubEvent.endTime) - new Date(githubEvent.startTime)) / 1000, 900), "github event duration = 900s");

  advance(2 * MIN);
  // alarm sync -> github event reaches the server
  listeners.alarmOnAlarm({ name: "timelens-sync" }); // alarms.onAlarm handler
  await sendMessage({ kind: "timelens.sync" }); // drain the chain
  const synced = await sendMessage({ kind: "timelens.state" });
  ok(synced.snapshot.syncState === "synced", "sync completed without error");
  const from = new Date(nowMs - 3600_000).toISOString();
  const to = new Date(nowMs + 60_000).toISOString();
  const sum1 = await getSummary(loginToken(), from, to);
  const ghAgg = sum1.topWebsites.find((w) => w.website === "github.com");
  ok(ghAgg && closeTo(ghAgg.duration, 900), "server summary shows github.com 900s");
  ok(typeof sum1.productivityScore === "number" && sum1.productivityScore === 100,
    "productivity score is a number (100% focus so far)");
  ok(Array.isArray(sum1.series) && sum1.series.length >= 1, "summary includes time series");
  ok(!sum1.topWebsites.some((w) => !w.kind), "top websites expose a kind");
  ok(sum1.totalDuration === sum1.focusDuration + sum1.neutralDuration + sum1.distractDuration,
    "total = focus + neutral + distract (single aggregation)");

  // pause tracking -> youtube finalized + enqueued, NOT sent while paused
  const toggled = await sendMessage({ kind: "timelens.toggle", enabled: false });
  ok(toggled.snapshot.trackingEnabled === false, "tracking pauses on toggle(false)");

  // paused sync must keep the queue intact
  listeners.alarmOnAlarm({ name: "timelens-sync" });
  await sendMessage({ kind: "timelens.sync" }); // drain the chain
  const pausedSync = await sendMessage({ kind: "timelens.state" });
  const ytQueuedWhilePaused = [...storage.entries()]
    .find(([k]) => k.startsWith("timelens:queue"))?.[1]
    ?.some((e) => e.website === "youtube.com");
  ok(Boolean(ytQueuedWhilePaused), "paused: youtube event stays in the local queue");
  const sum3 = await getSummary(loginToken(), from, to);
  const ytWhilePaused = sum3.topWebsites.find((w) => w.website === "youtube.com");
  ok(!ytWhilePaused, "paused: no tracking data is sent to the server");
  ok(pausedSync.snapshot.syncState === "synced", "paused sync reports clean state");

  // resume -> next sync flushes the queued youtube event
  const resumed = await sendMessage({ kind: "timelens.toggle", enabled: true });
  ok(resumed.snapshot.trackingEnabled === true, "tracking resumes on toggle(true)");
  listeners.alarmOnAlarm({ name: "timelens-sync" });
  await sendMessage({ kind: "timelens.sync" }); // drain the chain
  const sum2 = await getSummary(loginToken(), from, to);
  const ytAgg = sum2.topWebsites.find((w) => w.website === "youtube.com");
  ok(ytAgg && closeTo(ytAgg.duration, 120), "server summary shows youtube.com 120s");

  // disconnect clears everything
  const disc = await sendMessage({ kind: "timelens.disconnect" });
  ok(disc.snapshot.connected === false && disc.snapshot.session === null, "disconnect clears auth + session");

  console.log(process.exitCode ? "WIRING TEST FAILED" : "WIRING TEST PASSED");
} catch (err) {
  console.error("WIRING TEST FAILED:", err.message);
  process.exitCode = 1;
} finally {
  spawnSync("node", ["cleanup-smoke.cjs", email], { cwd: path.join(root, "..", "server"), stdio: "ignore" });
  Date.now = originalNow;
}

function loginToken() {
  // connect() stored the token in the mock store under timelens:store
  return storage.get("timelens:store")?.auth?.token ?? "";
}
function distPath(file) {
  return path.join(root, "dist", file);
}
import { pathToFileURL } from "node:url";

process.exit(process.exitCode ?? 0);
