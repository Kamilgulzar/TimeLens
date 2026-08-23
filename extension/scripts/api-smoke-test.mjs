import { timelensApi } from "../dist/api/timelens-api.js";
import { API_BASE_URL } from "../dist/lib/config.js";

const EMAIL = `ext-smoke-${Date.now()}@timelens.test`;
const PASSWORD = "Smoke#12345";
const DOMAIN = "stackoverflow.com";
const category = "Development";

async function api(path, method = "GET", body = undefined, token = undefined) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new Error(`${method} ${path} -> ${res.status}: ${await res.text()}`);
  }
  return res.status === 204 ? null : res.json();
}

async function cleanup(token) {
  try {
    await api(`/users/me`, "DELETE", undefined, token);
  } catch {
    // User may not exist; ignore.
  }
  console.log("cleaned up smoke user");
}

let token;
try {
  await api("/auth/register", "POST", {
    email: EMAIL,
    password: PASSWORD,
    firstName: "Extension",
    lastName: "Smoke",
  });
  await api("/auth/verify-email", "POST", { email: EMAIL });

  const login = await timelensApi.extensionLogin(EMAIL, PASSWORD);
  token = login.token;
  console.log("extension-login ok:", login.user.email);

  const from = new Date(Date.now() - 9 * 60_000).toISOString();
  const to = new Date().toISOString();
  const spanSeconds = Math.round((new Date(to) - new Date(from)) / 1000);

  const created = await timelensApi.submitActivities(token, [
    {
      clientEventId: `smoke-${Date.now()}`,
      website: DOMAIN,
      category,
      startTime: from,
      endTime: to,
    },
  ]);
  console.log("submit ok:", JSON.stringify(created));

  const summary = await timelensApi.activitySummary(token, from, to);
  const hit = summary.topWebsites.find((w) => w.website === DOMAIN);
  if (!hit || hit.duration !== spanSeconds) {
    throw new Error(`summary missing expected aggregate, got ${JSON.stringify(summary.topWebsites)}`);
  }
  console.log("summary ok: top website", DOMAIN, "duration", hit.duration);

  const duplicates = await timelensApi.submitActivities(token, [
    {
      clientEventId: `smoke-${Date.now()}`,
      website: DOMAIN,
      category,
      startTime: from,
      endTime: to,
    },
  ]);
  console.log("idempotency ok (overlap -> duplicate):", JSON.stringify(duplicates));

  console.log("ALL API SMOKE CHECKS PASSED");
} catch (err) {
  console.error("SMOKE FAILED:", err.message);
  process.exitCode = 1;
} finally {
  if (token) {
    await cleanup(token);
  }
}
