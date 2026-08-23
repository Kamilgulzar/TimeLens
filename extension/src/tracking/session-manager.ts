import type { ActiveSession, ActivityCategory } from "../types/activity.js";

/**
 * Segment-based session accrual.
 *
 * A session accrues only while the user is provably active on the tracked
 * domain (browser focused, not idle). `pulse` arms a segment, `freeze` banks
 * the segment's time, and the effective end time is always
 * `startedAt + accumulated`, so `duration === endTime - startTime` holds and
 * the server can treat timestamps as the source of truth.
 */

export function createSession(
  domain: string,
  category: ActivityCategory,
  now: number
): ActiveSession {
  return {
    id: crypto.randomUUID(),
    domain,
    category,
    startedAt: now,
    accumulatedMs: 0,
    lastPulseAt: now,
  };
}

/** Arm (or keep armed) an accruing segment. Never resets an active segment. */
export function pulseSession(session: ActiveSession, now: number): void {
  if (session.lastPulseAt === null) {
    session.lastPulseAt = now;
  }
}

/** Bank the active segment's time and disarm it (idle, focus loss, pause). */
export function freezeSession(session: ActiveSession, now: number): void {
  if (session.lastPulseAt !== null) {
    session.accumulatedMs += now - session.lastPulseAt;
    session.lastPulseAt = null;
  }
}

export function effectiveEndMs(session: ActiveSession, now: number): number {
  const accruing = session.lastPulseAt !== null ? now - session.lastPulseAt : 0;
  return session.startedAt + session.accumulatedMs + accruing;
}

export function effectiveDurationMs(session: ActiveSession, now: number): number {
  return effectiveEndMs(session, now) - session.startedAt;
}