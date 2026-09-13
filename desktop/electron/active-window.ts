import activeWin from "active-win";
import { BrowserWindow } from "electron";
import path from "path";
import fs from "fs";

export interface TrackingSession {
  id: string;
  appName: string;
  title: string;
  windowId: number;
  startTime: number;
  accumulatedMs: number;
  lastPulseAt: number | null;
  category: string;
}

export interface TrackingSnapshot {
  isTracking: boolean;
  currentSession: TrackingSession | null;
  todayTotalMs: number;
  todayByApp: Record<string, number>;
  pendingSync: number;
}

const ACTIVITY_CATEGORIES = [
  "Development",
  "Work",
  "Communication",
  "Research",
  "Learning",
  "Productivity",
  "AI / Research",
  "Design",
  "Entertainment",
  "Social Media",
  "News",
  "Shopping",
  "Other",
] as const;

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Development: [
    "code",
    "visual studio",
    "vscode",
    "intellij",
    "webstorm",
    "pycharm",
    "terminal",
    "git",
    "github",
    "gitlab",
    "postman",
    "insomnia",
    "docker",
    "node",
    "python",
    "java",
    "c++",
    "rust",
    "go",
    "ruby",
    "php",
    "swift",
    "kotlin",
    "android studio",
    "xcode",
  ],
  Communication: [
    "slack",
    "discord",
    "teams",
    "zoom",
    "skype",
    "telegram",
    "whatsapp",
    "signal",
    "email",
    "mail",
    "outlook",
    "gmail",
    "thunderbird",
  ],
  Research: [
    "chrome",
    "firefox",
    "edge",
    "safari",
    "brave",
    "opera",
    "browser",
    "google",
    "search",
    "wikipedia",
    "stackoverflow",
    "docs",
    "documentation",
  ],
  Entertainment: [
    "youtube",
    "netflix",
    "spotify",
    "twitch",
    "hulu",
    "disney",
    "hbo",
    "prime video",
    "music",
    "video",
    "movie",
    "game",
    "steam",
    "epic games",
  ],
  "Social Media": [
    "twitter",
    "x.com",
    "facebook",
    "instagram",
    "linkedin",
    "reddit",
    "tiktok",
    "pinterest",
    "snapchat",
    "mastodon",
    "threads",
  ],
  Productivity: [
    "notion",
    "obsidian",
    "evernote",
    "trello",
    "asana",
    "jira",
    "linear",
    "clickup",
    "todoist",
    "calendar",
    "excel",
    "word",
    "powerpoint",
    "sheets",
    "docs",
    "drive",
    "onedrive",
  ],
  "AI / Research": [
    "chatgpt",
    "claude",
    "copilot",
    "midjourney",
    "stable diffusion",
    "hugging face",
    "colab",
    "jupyter",
    "notebook",
  ],
  Design: [
    "figma",
    "sketch",
    "photoshop",
    "illustrator",
    "canva",
    "blender",
    "after effects",
    "premiere",
    "lightroom",
    "xd",
    "invision",
  ],
  News: [
    "news",
    "bbc",
    "cnn",
    "reuters",
    "nytimes",
    "guardian",
    "techcrunch",
    "verge",
    "arstechnica",
    "hacker news",
    "product hunt",
  ],
  Shopping: [
    "amazon",
    "ebay",
    "etsy",
    "walmart",
    "target",
    "best buy",
    "shopify",
    "store",
    "shop",
  ],
};

function categorizeApp(appName: string, title: string): string {
  const text = `${appName} ${title}`.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) {
      return category;
    }
  }

  return "Other";
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const DATA_DIR = path.join(
  process.env.USERPROFILE || process.env.HOME || "",
  ".timelens"
);
const DATA_FILE = path.join(DATA_DIR, "tracking-data.json");

interface StoredData {
  date: string;
  todayTotalMs: number;
  todayByApp: Record<string, number>;
  pendingSync: number;
  sessions: TrackingSession[];
}

function loadData(): StoredData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const data: StoredData = JSON.parse(raw);
      const today = new Date().toISOString().split("T")[0];
      if (data.date === today) {
        return data;
      }
    }
  } catch {}

  return {
    date: new Date().toISOString().split("T")[0],
    todayTotalMs: 0,
    todayByApp: {},
    pendingSync: 0,
    sessions: [],
  };
}

function saveData(data: StoredData): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch {}
}

export class ActiveWindowTracker {
  private interval: ReturnType<typeof setInterval> | null = null;
  private currentSession: TrackingSession | null = null;
  private isTracking = false;
  private mainWindow: BrowserWindow | null = null;
  private pollIntervalMs = 5000;
  private storedData: StoredData;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.storedData = loadData();
  }

  start(): void {
    if (this.isTracking) return;
    this.isTracking = true;

    this.interval = setInterval(() => {
      this.poll();
    }, this.pollIntervalMs);

    this.sendSnapshot();
  }

  stop(): void {
    if (!this.isTracking) return;
    this.isTracking = false;

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    if (this.currentSession) {
      this.finalizeSession();
    }

    this.sendSnapshot();
  }

  toggle(): boolean {
    if (this.isTracking) {
      this.stop();
    } else {
      this.start();
    }
    return this.isTracking;
  }

  getSnapshot(): TrackingSnapshot {
    return {
      isTracking: this.isTracking,
      currentSession: this.currentSession,
      todayTotalMs: this.storedData.todayTotalMs,
      todayByApp: this.storedData.todayByApp,
      pendingSync: this.storedData.pendingSync,
    };
  }

  private async poll(): Promise<void> {
    try {
      const result = await activeWin({
        accessibilityPermission: false,
        screenRecordingPermission: false,
      });

      if (!result || !result.owner) {
        return;
      }

      const { owner, title, id } = result;
      const appName = owner.name;
      const windowId = id;

      if (this.currentSession) {
        if (this.currentSession.windowId === windowId) {
          this.currentSession.accumulatedMs += this.pollIntervalMs;
          this.currentSession.lastPulseAt = Date.now();
          this.currentSession.title = title;
        } else {
          this.finalizeSession();
          this.startNewSession(appName, title, windowId);
        }
      } else {
        this.startNewSession(appName, title, windowId);
      }

      this.sendSnapshot();
    } catch {
      // Ignore errors from active-win (e.g., permission denied)
    }
  }

  private startNewSession(
    appName: string,
    title: string,
    windowId: number
  ): void {
    this.currentSession = {
      id: generateId(),
      appName,
      title,
      windowId,
      startTime: Date.now(),
      accumulatedMs: 0,
      lastPulseAt: Date.now(),
      category: categorizeApp(appName, title),
    };
  }

  private finalizeSession(): void {
    if (!this.currentSession) return;

    const session = this.currentSession;
    const durationMs = session.accumulatedMs;

    if (durationMs > 0) {
      this.storedData.todayTotalMs += durationMs;

      const appKey = session.appName;
      this.storedData.todayByApp[appKey] =
        (this.storedData.todayByApp[appKey] || 0) + durationMs;

      this.storedData.sessions.push({
        ...session,
        accumulatedMs: durationMs,
      });

      this.storedData.pendingSync++;
      saveData(this.storedData);
    }

    this.currentSession = null;
  }

  private sendSnapshot(): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(
        "tracking:snapshot",
        this.getSnapshot()
      );
    }
  }

  resetDaily(): void {
    this.storedData = {
      date: new Date().toISOString().split("T")[0],
      todayTotalMs: 0,
      todayByApp: {},
      pendingSync: 0,
      sessions: [],
    };
    saveData(this.storedData);
  }

  destroy(): void {
    this.stop();
    if (this.currentSession) {
      this.finalizeSession();
    }
  }
}
