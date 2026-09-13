export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string | null;
  createdAt: string;
}

export interface ActivityEvent {
  clientEventId: string;
  website: string;
  category: string;
  startTime: string;
  endTime: string;
  source: "desktop";
}

export interface SubmitResult {
  created: number;
  duplicates: number;
  skipped: number;
}

export type ActivityCategory =
  | "Development"
  | "Work"
  | "Communication"
  | "Research"
  | "Learning"
  | "Productivity"
  | "AI / Research"
  | "Design"
  | "Entertainment"
  | "Social Media"
  | "News"
  | "Shopping"
  | "Other";

export interface TrackingSnapshot {
  isTracking: boolean;
  currentSession: {
    id: string;
    appName: string;
    title: string;
    windowId: number;
    startTime: number;
    accumulatedMs: number;
    lastPulseAt: number | null;
    category: string;
  } | null;
  todayTotalMs: number;
  todayByApp: Record<string, number>;
  pendingSync: number;
}

export interface WindowAPI {
  electronAPI?: {
    login: (email: string, password: string) => Promise<{
      token: string;
      user: User;
    }>;
    me: (token: string) => Promise<{ user: User }>;
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
  };
}

declare global {
  interface Window extends WindowAPI {}
}
