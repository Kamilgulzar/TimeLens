import { describe, test, expect, beforeAll, afterAll } from "vitest";
import axios, { AxiosInstance } from "axios";

const API_BASE = process.env.API_URL || "http://localhost:5000/api";

const TEST_USER = {
  firstName: "Test",
  lastName: "Desktop",
  email: `test-desktop-${Date.now()}@example.com`,
  password: "TestPassword123!",
};

let api: AxiosInstance;
let authToken: string;
let timeOffset = 0;

function eventId(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

function iso(offsetMs: number): string {
  return new Date(Date.now() + offsetMs).toISOString();
}

function uniqueTimeRange(): { startTime: string; endTime: string } {
  timeOffset -= 600000;
  return {
    startTime: iso(timeOffset - 600000),
    endTime: iso(timeOffset),
  };
}

beforeAll(async () => {
  api = axios.create({ baseURL: API_BASE, validateStatus: () => true });

  await api.post("/auth/register", TEST_USER);
  await api.post("/auth/verify-email", { email: TEST_USER.email });

  const res = await api.post("/auth/extension-login", {
    email: TEST_USER.email,
    password: TEST_USER.password,
  });
  authToken = res.data.token;
  api.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;
});

// ─── Authentication ───────────────────────────────────────────────

describe("Authentication", () => {
  test("login returns token", () => {
    expect(authToken).toBeDefined();
    expect(typeof authToken).toBe("string");
  });

  test("rejects request without token", async () => {
    const res = await api.get("/activities", {
      headers: { Authorization: "" },
    });
    expect(res.status).toBe(401);
  });

  test("rejects request with bad token", async () => {
    const res = await api.get("/activities", {
      headers: { Authorization: "Bearer garbage" },
    });
    expect(res.status).toBe(401);
  });
});

// ─── Browser Activity Submission ──────────────────────────────────

describe("Browser activity submission", () => {
  test("single browser event", async () => {
    const t = uniqueTimeRange();
    const res = await api.post("/activities", {
      events: [
        {
          clientEventId: eventId(),
          website: "github.com",
          category: "Development",
          startTime: t.startTime,
          endTime: t.endTime,
        },
      ],
    });
    expect(res.status).toBe(201);
    expect(res.data.created).toBe(1);
  });

  test("batch of 5 browser events", async () => {
    const events = Array.from({ length: 5 }, (_, i) => {
      const t = uniqueTimeRange();
      return {
        clientEventId: eventId(),
        website: "stackoverflow.com",
        category: "Development",
        startTime: t.startTime,
        endTime: t.endTime,
      };
    });
    const res = await api.post("/activities", { events });
    expect(res.status).toBe(201);
    expect(res.data.created).toBe(5);
  });

  test("rejects empty events", async () => {
    const res = await api.post("/activities", { events: [] });
    expect(res.status).toBe(400);
  });
});

// ─── Desktop Activity Submission ──────────────────────────────────

describe("Desktop activity submission", () => {
  const desktopApps = [
    { app: "Visual Studio Code", expectedCategory: "Development" },
    { app: "Cursor", expectedCategory: "Development" },
    { app: "IntelliJ IDEA", expectedCategory: "Development" },
    { app: "PyCharm", expectedCategory: "Development" },
    { app: "Android Studio", expectedCategory: "Development" },
    { app: "Word", expectedCategory: "Work" },
    { app: "Excel", expectedCategory: "Work" },
    { app: "PowerPoint", expectedCategory: "Work" },
    { app: "Outlook", expectedCategory: "Work" },
    { app: "Notion", expectedCategory: "Work" },
    { app: "Obsidian", expectedCategory: "Work" },
    { app: "Teams", expectedCategory: "Communication" },
    { app: "Slack", expectedCategory: "Communication" },
    { app: "Discord", expectedCategory: "Communication" },
    { app: "WhatsApp", expectedCategory: "Communication" },
    { app: "Telegram", expectedCategory: "Communication" },
    { app: "Zoom", expectedCategory: "Communication" },
    { app: "TradingView", expectedCategory: "Research" },
    { app: "Zotero", expectedCategory: "Research" },
    { app: "Figma", expectedCategory: "Design" },
    { app: "Photoshop", expectedCategory: "Design" },
    { app: "Illustrator", expectedCategory: "Design" },
    { app: "Premiere Pro", expectedCategory: "Design" },
    { app: "Spotify", expectedCategory: "Entertainment" },
    { app: "VLC", expectedCategory: "Entertainment" },
    { app: "Steam", expectedCategory: "Entertainment" },
    { app: "Chrome", expectedCategory: "Other" },
    { app: "Firefox", expectedCategory: "Other" },
    { app: "Edge", expectedCategory: "Other" },
    { app: "Brave", expectedCategory: "Other" },
  ];

  test("each app is classified correctly", async () => {
    const events = desktopApps.map(({ app }) => {
      const t = uniqueTimeRange();
      return {
        clientEventId: eventId(),
        website: app,
        category: "Other" as const,
        startTime: t.startTime,
        endTime: t.endTime,
        source: "desktop" as const,
      };
    });
    const res = await api.post("/activities", { events });
    expect(res.status).toBe(201);
    expect(res.data.created).toBe(desktopApps.length);
  });

  test("unknown app falls back to Other", async () => {
    const t = uniqueTimeRange();
    const res = await api.post("/activities", {
      events: [
        {
          clientEventId: eventId(),
          website: "Some Random App 12345",
          category: "Other",
          startTime: t.startTime,
          endTime: t.endTime,
          source: "desktop",
        },
      ],
    });
    expect(res.status).toBe(201);
    expect(res.data.created).toBe(1);
  });

  test("defaults source to browser when omitted", async () => {
    const t = uniqueTimeRange();
    const res = await api.post("/activities", {
      events: [
        {
          clientEventId: eventId(),
          website: "github.com",
          category: "Development",
          startTime: t.startTime,
          endTime: t.endTime,
        },
      ],
    });
    expect(res.status).toBe(201);
    expect(res.data.created).toBe(1);
  });
});

// ─── Duplicate Detection ─────────────────────────────────────────

describe("Duplicate detection", () => {
  test("rejects duplicate clientEventId", async () => {
    const id = eventId();
    const t1 = uniqueTimeRange();
    const t2 = uniqueTimeRange();
    const res = await api.post("/activities", {
      events: [
        {
          clientEventId: id,
          website: "github.com",
          category: "Development",
          startTime: t1.startTime,
          endTime: t1.endTime,
        },
        {
          clientEventId: id,
          website: "github.com",
          category: "Development",
          startTime: t2.startTime,
          endTime: t2.endTime,
        },
      ],
    });
    expect(res.status).toBe(201);
    expect(res.data.created).toBe(1);
    expect(res.data.duplicates).toBe(1);
  });

  test("allows same app with non-overlapping times", async () => {
    const t1 = uniqueTimeRange();
    const t2 = uniqueTimeRange();
    const res = await api.post("/activities", {
      events: [
        {
          clientEventId: eventId(),
          website: "github.com",
          category: "Development",
          startTime: t1.startTime,
          endTime: t1.endTime,
        },
        {
          clientEventId: eventId(),
          website: "github.com",
          category: "Development",
          startTime: t2.startTime,
          endTime: t2.endTime,
        },
      ],
    });
    expect(res.status).toBe(201);
    expect(res.data.created).toBe(2);
  });
});

// ─── Session & Idle Handling ──────────────────────────────────────

describe("Session and idle handling", () => {
  test("tracks application changes as separate sessions", async () => {
    const t1 = uniqueTimeRange();
    const t2 = uniqueTimeRange();
    const res = await api.post("/activities", {
      events: [
        {
          clientEventId: eventId(),
          website: "Visual Studio Code",
          category: "Development",
          startTime: t1.startTime,
          endTime: t1.endTime,
          source: "desktop",
        },
        {
          clientEventId: eventId(),
          website: "Slack",
          category: "Communication",
          startTime: t2.startTime,
          endTime: t2.endTime,
          source: "desktop",
        },
      ],
    });
    expect(res.status).toBe(201);
    expect(res.data.created).toBe(2);
  });

  test("discards sessions shorter than 3 seconds", async () => {
    const t = uniqueTimeRange();
    const shortEnd = new Date(new Date(t.startTime).getTime() + 500).toISOString();
    const res = await api.post("/activities", {
      events: [
        {
          clientEventId: eventId(),
          website: "Visual Studio Code",
          category: "Development",
          startTime: t.startTime,
          endTime: shortEnd,
          source: "desktop",
        },
      ],
    });
    expect(res.status).toBe(201);
    expect(res.data.created).toBe(0);
    expect(res.data.skipped).toBe(1);
  });

  test("rejects sessions longer than 24 hours", async () => {
    const start = new Date(Date.now() - 86400000 * 2).toISOString();
    const end = new Date().toISOString();
    const res = await api.post("/activities", {
      events: [
        {
          clientEventId: eventId(),
          website: "Visual Studio Code",
          category: "Development",
          startTime: start,
          endTime: end,
          source: "desktop",
        },
      ],
    });
    expect(res.status).toBe(201);
    expect(res.data.created).toBe(0);
    expect(res.data.skipped).toBe(1);
  });

  test("idle gap reduces total tracked time", async () => {
    const t1 = uniqueTimeRange();
    const t2 = uniqueTimeRange();
    const res = await api.post("/activities", {
      events: [
        {
          clientEventId: eventId(),
          website: "Visual Studio Code",
          category: "Development",
          startTime: t1.startTime,
          endTime: t1.endTime,
          source: "desktop",
        },
        {
          clientEventId: eventId(),
          website: "Visual Studio Code",
          category: "Development",
          startTime: t2.startTime,
          endTime: t2.endTime,
          source: "desktop",
        },
      ],
    });
    expect(res.status).toBe(201);
    expect(res.data.created).toBe(2);
  });
});

// ─── Edge Cases ───────────────────────────────────────────────────

describe("Edge cases", () => {
  test("rejects future events beyond 15 min skew", async () => {
    const res = await api.post("/activities", {
      events: [
        {
          clientEventId: eventId(),
          website: "github.com",
          category: "Development",
          startTime: iso(1800000),
          endTime: iso(3600000),
        },
      ],
    });
    expect(res.status).toBe(201);
    expect(res.data.created).toBe(0);
    expect(res.data.skipped).toBe(1);
  });

  test("rejects negative duration", async () => {
    const t = uniqueTimeRange();
    const res = await api.post("/activities", {
      events: [
        {
          clientEventId: eventId(),
          website: "github.com",
          category: "Development",
          startTime: t.endTime,
          endTime: t.startTime,
        },
      ],
    });
    expect(res.status).toBe(201);
    expect(res.data.created).toBe(0);
    expect(res.data.skipped).toBe(1);
  });

  test("rejects zero duration", async () => {
    const now = iso(0);
    const res = await api.post("/activities", {
      events: [
        {
          clientEventId: eventId(),
          website: "github.com",
          category: "Development",
          startTime: now,
          endTime: now,
        },
      ],
    });
    expect(res.status).toBe(201);
    expect(res.data.created).toBe(0);
    expect(res.data.skipped).toBe(1);
  });

  test("rejects invalid date strings", async () => {
    const res = await api.post("/activities", {
      events: [
        {
          clientEventId: eventId(),
          website: "github.com",
          category: "Development",
          startTime: "not-a-date",
          endTime: "also-not-a-date",
        },
      ],
    });
    expect(res.status).toBe(201);
    expect(res.data.created).toBe(0);
    expect(res.data.skipped).toBe(1);
  });

  test("rejects empty website", async () => {
    const t = uniqueTimeRange();
    const res = await api.post("/activities", {
      events: [
        {
          clientEventId: eventId(),
          website: "",
          category: "Development",
          startTime: t.startTime,
          endTime: t.endTime,
        },
      ],
    });
    expect(res.status).toBe(400);
  });

  test("rejects invalid category", async () => {
    const t = uniqueTimeRange();
    const res = await api.post("/activities", {
      events: [
        {
          clientEventId: eventId(),
          website: "github.com",
          category: "InvalidCategory",
          startTime: t.startTime,
          endTime: t.endTime,
        },
      ],
    });
    expect(res.status).toBe(400);
  });

  test("rejects batch over 500 events", async () => {
    const events = Array.from({ length: 501 }, () => {
      const t = uniqueTimeRange();
      return {
        clientEventId: eventId(),
        website: "github.com",
        category: "Development",
        startTime: t.startTime,
        endTime: t.endTime,
      };
    });
    const res = await api.post("/activities", { events });
    expect(res.status).toBe(400);
  });
});

// ─── Analytics ────────────────────────────────────────────────────

describe("Analytics", () => {
  test("summary includes desktop activities", async () => {
    const res = await api.get("/activities/summary", {
      params: {
        from: iso(-86400000),
        to: iso(0),
        tzOffsetMinutes: 0,
      },
    });
    expect(res.status).toBe(200);
    expect(res.data.totalDuration).toBeGreaterThan(0);
    expect(res.data.topWebsites).toBeDefined();
    expect(res.data.byCategory).toBeDefined();
  });

  test("productivity score is between 0 and 100", async () => {
    const res = await api.get("/activities/summary", {
      params: {
        from: iso(-86400000),
        to: iso(0),
        tzOffsetMinutes: 0,
      },
    });
    expect(res.status).toBe(200);
    expect(res.data.productivityScore).toBeGreaterThanOrEqual(0);
    expect(res.data.productivityScore).toBeLessThanOrEqual(100);
  });

  test("category breakdown includes expected categories", async () => {
    const res = await api.get("/activities/summary", {
      params: {
        from: iso(-86400000),
        to: iso(0),
        tzOffsetMinutes: 0,
      },
    });
    expect(res.status).toBe(200);
    const cats = res.data.byCategory.map((c: any) => c.category);
    expect(cats.length).toBeGreaterThan(0);
  });
});

// ─── Desktop Heartbeat ────────────────────────────────────────────

describe("Desktop heartbeat", () => {
  test("accepts source=desktop with platform", async () => {
    const res = await api.post("/activities/heartbeat", {
      connected: true,
      trackingEnabled: true,
      source: "desktop",
      browser: "Electron",
      platform: "windows",
      version: "0.1.0",
    });
    expect(res.status).toBe(200);
    expect(res.data).toBeDefined();
  });

  test("extension-status returns status", async () => {
    const res = await api.get("/activities/extension-status");
    expect(res.status).toBe(200);
    expect(res.data).toBeDefined();
  });

  test("accepts source=browser", async () => {
    const res = await api.post("/activities/heartbeat", {
      connected: true,
      trackingEnabled: true,
      source: "browser",
      browser: "Chrome",
    });
    expect(res.status).toBe(200);
    expect(res.data).toBeDefined();
  });
});

// ─── Cleanup ──────────────────────────────────────────────────────

afterAll(async () => {
  if (authToken) {
    await api.post("/auth/logout");
  }
});
