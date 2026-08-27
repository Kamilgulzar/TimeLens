import { API_BASE_URL } from "../lib/config.js";
import type { ActivityEvent } from "../types/activity.js";

export interface WebsiteAggregate {
  website: string;
  category: string;
  kind: string;
  duration: number;
}

export interface CategoryAggregate {
  category: string;
  kind: string;
  duration: number;
  share: number;
}

export interface SessionRecord {
  id: string;
  website: string;
  category: string;
  kind: string;
  startTime: string;
  endTime: string;
  duration: number;
}

export interface SeriesPoint {
  bucket: string;
  total: number;
  focus: number;
  neutral: number;
  distract: number;
}

export interface ActivitySummary {
  from: string | null;
  to: string | null;
  granularity: "hour" | "day";
  totalDuration: number;
  focusDuration: number;
  neutralDuration: number;
  distractDuration: number;
  productivityScore: number | null;
  shares: { focus: number; neutral: number; distract: number };
  trackedWebsitesCount: number;
  topWebsites: WebsiteAggregate[];
  byCategory: CategoryAggregate[];
  sessions: SessionRecord[];
  series: SeriesPoint[];
}

export interface SubmitResult {
  created: number;
  duplicates: number;
  skipped: number;
}

export interface ExtensionStatusView {
  connected: boolean;
  tracked: boolean;
  trackingEnabled: boolean;
  browser: string;
  version: string | null;
  lastSeenAt: string | null;
  lastSyncedAt: string | null;
  desiredTrackingEnabled: boolean | null;
  pendingAction: "disconnect" | null;
}

export interface ExtensionPendingControl {
  trackingEnabled: boolean | null;
  disconnect: boolean;
}

export interface ApiError extends Error {
  status?: number;
  network?: boolean;
  payload?: unknown;
}

function toApiError(message: string, extra: Partial<ApiError> = {}): ApiError {
  const err = new Error(message) as ApiError;
  Object.assign(err, extra);
  return err;
}

async function request<T>(
  path: string,
  init: { method: string; token?: string; body?: unknown } = { method: "GET" }
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: init.method,
      headers: {
        ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw toApiError("Unable to reach the TimeLens server.", { network: true });
  }

  if (!response.ok) {
    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      // Non-JSON error body.
    }
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: unknown }).error)
        : `TimeLens server responded with ${response.status}.`;
    throw toApiError(message, { status: response.status, payload });
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

interface ExtensionLoginResponse {
  token: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export const timelensApi = {
  extensionLogin(email: string, password: string): Promise<ExtensionLoginResponse> {
    return request<ExtensionLoginResponse>("/auth/extension-login", {
      method: "POST",
      body: { email, password, source: "browser" },
    });
  },

  extensionOAuthLogin(
    provider: string,
    email: string,
    firstName?: string,
    lastName?: string,
    avatar?: string
  ): Promise<ExtensionLoginResponse> {
    return request<ExtensionLoginResponse>("/auth/extension-oauth", {
      method: "POST",
      body: { provider, email, firstName, lastName, avatar },
    });
  },

  submitActivities(
    token: string,
    events: ActivityEvent[]
  ): Promise<SubmitResult> {
    return request<SubmitResult>("/activities", {
      method: "POST",
      token,
      body: { events },
    });
  },

  activitySummary(token: string, from: string, to: string): Promise<ActivitySummary> {
    const params = new URLSearchParams({ from, to });
    return request<ActivitySummary>(`/activities/summary?${params.toString()}`, {
      method: "GET",
      token,
    });
  },

  extensionHeartbeat(
    token: string,
    body: {
      connected: boolean;
      trackingEnabled: boolean;
      browser: string;
      version?: string;
      lastSyncedAt?: string;
    }
  ): Promise<ExtensionStatusView> {
    return request<ExtensionStatusView>("/activities/heartbeat", {
      method: "POST",
      token,
      body,
    });
  },

  extensionPending(token: string): Promise<ExtensionPendingControl> {
    return request<ExtensionPendingControl>("/activities/extension-control/pending", {
      method: "GET",
      token,
    });
  },

  extensionAck(token: string): Promise<void> {
    return request<void>("/activities/extension-control/ack", {
      method: "POST",
      token,
    });
  },
};