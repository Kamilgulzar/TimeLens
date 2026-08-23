import api from "@/lib/api";

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

export async function fetchExtensionStatus(): Promise<ExtensionStatusView> {
  const response = await api.get<ExtensionStatusView>("/activities/extension-status");
  return response.data;
}

export async function setExtensionTracking(enabled: boolean): Promise<ExtensionStatusView> {
  const response = await api.put<ExtensionStatusView>("/activities/extension-control", {
    trackingEnabled: enabled,
  });
  return response.data;
}

export async function requestExtensionDisconnect(): Promise<ExtensionStatusView> {
  const response = await api.put<ExtensionStatusView>("/activities/extension-control", {
    disconnect: true,
  });
  return response.data;
}

export function formatRelativeTime(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "Just now";
  const minutes = Math.round(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString([], { day: "numeric", month: "short" });
}