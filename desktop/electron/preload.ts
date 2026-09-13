import { contextBridge, ipcRenderer } from "electron";

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

export interface ElectronAPI {
  login: (email: string, password: string) => Promise<{
    token: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      avatar?: string | null;
      createdAt: string;
    };
  }>;
  me: (token: string) => Promise<{
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      avatar?: string | null;
      createdAt: string;
    };
  }>;
  logout: () => Promise<{ ok: boolean }>;
  getToken: () => Promise<string | null>;
  oauth: (provider: "google" | "github") => Promise<void>;
  onOAuthToken: (callback: (token: string) => void) => void;
  removeOAuthTokenListener: () => void;
  onOAuthError: (callback: (error: string) => void) => void;
  removeOAuthErrorListener: () => void;
  quit: () => Promise<void>;
  minimize: () => Promise<void>;
  close: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
  toggleMaximize: () => Promise<void>;
  onTrackingToggle: (callback: (enabled: boolean) => void) => void;
  removeTrackingToggleListener: () => void;
  toggleTracking: () => Promise<boolean>;
  getTrackingSnapshot: () => Promise<TrackingSnapshot>;
  startTracking: () => Promise<void>;
  stopTracking: () => Promise<void>;
  onTrackingSnapshot: (callback: (snapshot: TrackingSnapshot) => void) => void;
  removeTrackingSnapshotListener: () => void;
}

const electronAPI: ElectronAPI = {
  login: (email: string, password: string) =>
    ipcRenderer.invoke("auth:login", email, password),

  me: (token: string) => ipcRenderer.invoke("auth:me", token),

  logout: () => ipcRenderer.invoke("auth:logout"),

  getToken: () => ipcRenderer.invoke("auth:get-token"),

  oauth: (provider: "google" | "github") =>
    ipcRenderer.invoke("auth:oauth", provider),

  onOAuthToken: (callback: (token: string) => void) => {
    ipcRenderer.on("oauth:token", (_event, token) => callback(token));
  },

  removeOAuthTokenListener: () => {
    ipcRenderer.removeAllListeners("oauth:token");
  },

  onOAuthError: (callback: (error: string) => void) => {
    ipcRenderer.on("oauth:error", (_event, error) => callback(error));
  },

  removeOAuthErrorListener: () => {
    ipcRenderer.removeAllListeners("oauth:error");
  },

  quit: () => ipcRenderer.invoke("app:quit"),

  minimize: () => ipcRenderer.invoke("window:minimize"),

  close: () => ipcRenderer.invoke("window:close"),

  isMaximized: () => ipcRenderer.invoke("window:is-maximized"),

  toggleMaximize: () => ipcRenderer.invoke("window:toggle-maximize"),

  onTrackingToggle: (callback: (enabled: boolean) => void) => {
    ipcRenderer.on("tracking:toggle", (_event, enabled) => callback(enabled));
  },

  removeTrackingToggleListener: () => {
    ipcRenderer.removeAllListeners("tracking:toggle");
  },

  toggleTracking: () => ipcRenderer.invoke("tracking:toggle"),

  getTrackingSnapshot: () => ipcRenderer.invoke("tracking:snapshot"),

  startTracking: () => ipcRenderer.invoke("tracking:start"),

  stopTracking: () => ipcRenderer.invoke("tracking:stop"),

  onTrackingSnapshot: (callback: (snapshot: TrackingSnapshot) => void) => {
    ipcRenderer.on("tracking:snapshot", (_event, snapshot) =>
      callback(snapshot)
    );
  },

  removeTrackingSnapshotListener: () => {
    ipcRenderer.removeAllListeners("tracking:snapshot");
  },
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);
