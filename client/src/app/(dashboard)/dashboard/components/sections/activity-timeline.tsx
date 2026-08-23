"use client";

import {
  categoryColor,
  formatDuration,
  kindLabel,
  type SessionRecord,
} from "@/lib/activities";
import { cn } from "@/lib/utils";
import { KindDot, kindBadgeClass } from "./section-card";

function timeLabel(time: string, withDay = false): string {
  const d = new Date(time);
  const timePart = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (!withDay) return timePart;
  return `${timePart} · ${d.toLocaleDateString([], { day: "numeric", month: "short" })}`;
}

/**
 * Chronological timeline of the period's activity, newest first. Uses the exact
 * same activity records (and kind classification) as Recent Sessions.
 */
export function ActivityTimeline({
  sessions,
  withDay = false,
}: {
  sessions: SessionRecord[];
  withDay?: boolean;
}) {
  if (sessions.length === 0) {
    return (
      <p className="py-2 text-sm text-muted-foreground">
        No activity recorded in this period.
      </p>
    );
  }
  return (
    <div className="space-y-1">
      {sessions.map((session) => (
        <div
          key={session.id}
          className="group flex gap-4 rounded-lg px-2 py-2.5 transition-colors duration-150 hover:bg-muted/50"
        >
          <div className="w-24 shrink-0 pt-0.5 text-xs tabular-nums text-muted-foreground">
            {timeLabel(session.startTime, withDay)}
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", categoryColor(session.category))} />
            <span className="truncate text-sm font-medium text-foreground">
              {session.website}
            </span>
            <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
              {session.category}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <span className="text-sm font-semibold tracking-tight tabular-nums text-foreground">
              {formatDuration(session.duration)}
            </span>
            <span className={cn("w-20 text-right", kindBadgeClass(session.kind))}>
              <span className="inline-flex items-center gap-1.5">
                <KindDot kind={session.kind} />
                {kindLabel(session.kind)}
              </span>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}