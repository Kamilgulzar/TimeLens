import prisma from "../prisma/client";

/**
 * Extension presence + remote control.
 *
 * The browser extension reports a heartbeat on boot / connect / toggle / sync.
 * The web dashboard reads that status and can set desired tracking state (or
 * request a disconnect) which the extension picks up on its next heartbeat
 * cycle. `connected` is derived - a stale heartbeat means "not connected".
 */

/** How old a heartbeat may be before we treat the extension as missing. */
export const STALE_EXTENSION_MS = 5 * 60 * 1000;

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

export const extensionService = {
  async heartbeat(
    userId: string,
    body: {
      connected: boolean;
      trackingEnabled: boolean;
      browser: string;
      lastSyncedAt?: string;
      version?: string;
    }
  ): Promise<ExtensionStatusView> {
    const now = new Date();
    const [existing, control] = await Promise.all([
      prisma.extensionStatus.upsert({
        where: { userId },
        update: {
          connected: body.connected,
          trackingEnabled: body.trackingEnabled,
          browser: body.browser,
          version: body.version ?? undefined,
          lastSeenAt: now,
          lastSyncedAt: body.lastSyncedAt ? new Date(body.lastSyncedAt) : undefined,
        },
        create: {
          userId,
          connected: body.connected,
          trackingEnabled: body.trackingEnabled,
          browser: body.browser,
          version: body.version ?? null,
          lastSeenAt: now,
          lastSyncedAt: body.lastSyncedAt ? new Date(body.lastSyncedAt) : null,
        },
      }),
      prisma.extensionControl.findUnique({ where: { userId } }),
    ]);

    // The heartbeat also reports the pending server-side control back so the
    // extension can apply it and the dashboard can show what's actually active.
    return this.toView(existing, control);
  },

  async status(userId: string): Promise<ExtensionStatusView> {
    const [status, control] = await Promise.all([
      prisma.extensionStatus.findUnique({ where: { userId } }),
      prisma.extensionControl.findUnique({ where: { userId } }),
    ]);
    return this.toView(status, control);
  },

  async control(
    userId: string,
    body: { trackingEnabled?: boolean; disconnect?: boolean }
  ): Promise<ExtensionStatusView> {
    await prisma.extensionControl.upsert({
      where: { userId },
      update: {
        trackingEnabled: body.trackingEnabled ?? undefined,
        disconnect: body.disconnect ?? false,
      },
      create: {
        userId,
        trackingEnabled: body.trackingEnabled ?? null,
        disconnect: body.disconnect ?? false,
      },
    });
    const [status, control] = await Promise.all([
      prisma.extensionStatus.findUnique({ where: { userId } }),
      prisma.extensionControl.findUnique({ where: { userId } }),
    ]);
    return this.toView(status, control);
  },

  /** Control row for the extension to poll and apply. */
  async pendingControl(userId: string): Promise<{
    trackingEnabled: boolean | null;
    disconnect: boolean;
  }> {
    const control = await prisma.extensionControl.findUnique({ where: { userId } });
    if (!control) return { trackingEnabled: null, disconnect: false };
    return { trackingEnabled: control.trackingEnabled, disconnect: control.disconnect };
  },

  /** Called by the extension after it applies server instructions. */
  async clearControl(userId: string): Promise<void> {
    await prisma.extensionControl.update({
      where: { userId },
      data: { trackingEnabled: null, disconnect: false },
    });
  },

  toView(
    status: Awaited<ReturnType<typeof prisma.extensionStatus.findUnique>>,
    control: Awaited<ReturnType<typeof prisma.extensionControl.findUnique>>
  ): ExtensionStatusView {
    const connected = Boolean(
      status?.connected &&
        status.lastSeenAt &&
        Date.now() - status.lastSeenAt.getTime() <= STALE_EXTENSION_MS
    );
    return {
      connected,
      tracked: connected && Boolean(status?.trackingEnabled),
      trackingEnabled: connected && Boolean(status?.trackingEnabled),
      browser: status?.browser ?? "Chrome",
      version: status?.version ?? null,
      lastSeenAt: status?.lastSeenAt ? status.lastSeenAt.toISOString() : null,
      lastSyncedAt: status?.lastSyncedAt ? status.lastSyncedAt.toISOString() : null,
      desiredTrackingEnabled: control?.trackingEnabled ?? null,
      pendingAction: control?.disconnect ? "disconnect" : null,
    };
  },
};