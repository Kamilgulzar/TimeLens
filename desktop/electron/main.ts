import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, shell } from "electron";
import path from "path";
import { ActiveWindowTracker } from "./active-window";

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;
let tracker: ActiveWindowTracker | null = null;
let pendingDeepLink: string | null = null;

const isDev = !app.isPackaged;
const API_URL = isDev
  ? "http://localhost:5000/api"
  : "https://server-liart-xi-18.vercel.app/api";
const WEB_URL = isDev
  ? "https://timelens-client.vercel.app"
  : "https://timelens-client.vercel.app";

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 620,
    minWidth: 360,
    minHeight: 500,
    show: false,
    frame: false,
    titleBarStyle: "hiddenInset",
    backgroundColor: "#111318",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    icon: path.join(__dirname, "../public/icon.png"),
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
    tracker = new ActiveWindowTracker(mainWindow!);
    tracker.start();
  });

  mainWindow.webContents.once("did-finish-load", () => {
    if (pendingDeepLink) {
      const url = pendingDeepLink;
      pendingDeepLink = null;
      handleDeepLink(url);
    }
  });

  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function createTray() {
  const iconPath = path.join(__dirname, "../public/icon.png");
  let trayIcon: Electron.NativeImage;
  try {
    trayIcon = nativeImage.createFromPath(iconPath);
    if (trayIcon.isEmpty()) {
      trayIcon = nativeImage.createEmpty();
    }
  } catch {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  tray.setToolTip("TimeLens");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open TimeLens",
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    { type: "separator" },
    {
      label: "Pause Tracking",
      click: () => {
        if (tracker) {
          tracker.stop();
        }
        mainWindow?.webContents.send("tracking:toggle", false);
      },
    },
    {
      label: "Resume Tracking",
      click: () => {
        if (tracker) {
          tracker.start();
        }
        mainWindow?.webContents.send("tracking:toggle", true);
      },
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        isQuitting = true;
        if (tracker) {
          tracker.destroy();
        }
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on("double-click", () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
}

// IPC Handlers
ipcMain.handle("auth:login", async (_event, email: string, password: string) => {
  const axios = (await import("axios")).default;

  const response = await axios.post(`${API_URL}/auth/extension-login`, {
    email,
    password,
    source: "desktop",
  });

  return response.data;
});

ipcMain.handle("auth:me", async (_event, token: string) => {
  const axios = (await import("axios")).default;

  const response = await axios.get(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data;
});

ipcMain.handle("auth:oauth", async (_event, provider: "google" | "github") => {
  const authUrl = `${WEB_URL}/desktop-auth?provider=${provider}`;
  console.log("[OAuth] Opening:", authUrl);
  try {
    await shell.openExternal(authUrl);
  } catch (err) {
    console.error("[OAuth] shell.openExternal failed:", err);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("oauth:error", "Failed to open browser.");
    }
  }
});

ipcMain.handle("auth:logout", async () => {
  return { ok: true };
});

ipcMain.handle("auth:get-token", async () => {
  return null;
});

ipcMain.handle("app:quit", () => {
  isQuitting = true;
  app.quit();
});

ipcMain.handle("window:minimize", () => {
  mainWindow?.minimize();
});

ipcMain.handle("window:close", () => {
  mainWindow?.hide();
});

ipcMain.handle("window:is-maximized", () => {
  return mainWindow?.isMaximized() ?? false;
});

ipcMain.handle("window:toggle-maximize", () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

// Tracking IPC Handlers
ipcMain.handle("tracking:toggle", () => {
  if (tracker) {
    return tracker.toggle();
  }
  return false;
});

ipcMain.handle("tracking:snapshot", () => {
  if (tracker) {
    return tracker.getSnapshot();
  }
  return null;
});

ipcMain.handle("tracking:start", () => {
  if (tracker) {
    tracker.start();
  }
});

ipcMain.handle("tracking:stop", () => {
  if (tracker) {
    tracker.stop();
  }
});

// Deep link handling
function handleDeepLink(url: string) {
  console.log("[DeepLink] Received deep link");

  if (!mainWindow || mainWindow.isDestroyed()) {
    pendingDeepLink = url;
    return;
  }

  try {
    const parsed = new URL(url);
    const token = parsed.searchParams.get("token");
    const error = parsed.searchParams.get("error");

    if (token) {
      mainWindow.webContents.send("oauth:token", token);
    } else if (error) {
      mainWindow.webContents.send("oauth:error", error);
    }
  } catch (err) {
    console.error("[DeepLink] Invalid URL");
  }
}

// macOS: fires when the OS opens a timelens:// link
app.on("open-url", (event, url) => {
  event.preventDefault();
  if (url.startsWith("timelens://")) {
    if (mainWindow && !mainWindow.isDestroyed()) {
      handleDeepLink(url);
    } else {
      pendingDeepLink = url;
    }
  }
});

// App lifecycle
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, commandLine) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
    const deepLink = commandLine.find((arg) => arg.startsWith("timelens://"));
    if (deepLink) {
      handleDeepLink(deepLink);
    }
  });

  app.whenReady().then(() => {
    createWindow();
    createTray();

    // Windows: the deep link URL may already be in process.argv from the
    // protocol handler that launched this instance.
    const deepLinkArg = process.argv.find((arg) => arg.startsWith("timelens://"));
    if (deepLinkArg) {
      pendingDeepLink = deepLinkArg;
    }

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      } else {
        mainWindow?.show();
      }
    });
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
