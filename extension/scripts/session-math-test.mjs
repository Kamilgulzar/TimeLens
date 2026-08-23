import {
  createSession,
  pulseSession,
  freezeSession,
  effectiveDurationMs,
  effectiveEndMs,
} from "../dist/tracking/session-manager.js";
import { formatDuration } from "../dist/popup/format.js";

const MIN = 60_000;
const assert = (cond, msg) => {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exitCode = 1;
  } else {
    console.log("ok  -", msg);
  }
};

// Case 1: continuous active, 10 minutes.
let s = createSession("github.com", "Development", 0);
freezeSession(s, 10 * MIN);
assert(effectiveDurationMs(s, 10 * MIN) === 10 * MIN, "C1: 10 continuous minutes");
assert(effectiveEndMs(s, 10 * MIN) - s.startedAt === 10 * MIN, "C1: end-start === duration");

// Case 3: 25m active, 20m idle, 5m active => 30m (idle excluded).
s = createSession("github.com", "Development", 0);
freezeSession(s, 25 * MIN); // left computer
pulseSession(s, 45 * MIN); // returned
freezeSession(s, 50 * MIN);
assert(effectiveDurationMs(s, 50 * MIN) === 30 * MIN, "C3: idle 20m excluded, 30m counted");

// Case 2-ish: two distinct domains produce two independent sessions.
s = createSession("github.com", "Development", 0);
freezeSession(s, 45 * MIN);
const endGithub = effectiveEndMs(s, 45 * MIN);
const g2 = createSession("youtube.com", "Entertainment", 45 * MIN);
freezeSession(g2, 62 * MIN);
assert(endGithub - 0 === 45 * MIN, "C2: github 45m");
assert(effectiveDurationMs(g2, 62 * MIN) === 17 * MIN, "C2: youtube 17m");

// Redundant pulse while accruing must NOT reset the segment.
s = createSession("github.com", "Development", 0);
pulseSession(s, 5 * MIN);
pulseSession(s, 20 * MIN);
freezeSession(s, 30 * MIN);
assert(effectiveDurationMs(s, 30 * MIN) === 30 * MIN, "pulse does not truncate active segment");

// Popup timer formatting.
assert(formatDuration(0) === "00:00", "format 0");
assert(formatDuration(59_000) === "00:59", "format 59s");
assert(formatDuration(60_000) === "01:00", "format 60s");
assert(formatDuration(3_659_000) === "1:00:59", "format 1h+");
assert(formatDuration(-500) === "00:00", "format clamps negatives");

console.log(process.exitCode ? "FAILURES" : "all session-math checks passed");
