"use client";

import { Globe } from "lucide-react";
import {
  categoryColor,
  formatDuration,
  kindLabel,
  type ActivitySummary,
  type CategoryAggregate,
  type SessionRecord,
  type WebsiteAggregate,
} from "@/lib/activities";
import { cn } from "@/lib/utils";
import { KindDot, kindBadgeClass } from "./section-card";

export function TopWebsites({ summary }: { summary: ActivitySummary }) {
  const sites = summary.topWebsites;
  const max = Math.max(1, ...sites.map((s) => s.duration));
  return <WebsiteList sites={sites} max={max} />;
}

function WebsiteList({ sites, max }: { sites: WebsiteAggregate[]; max: number }) {
  return (
    <div className="space-y-4">
      {sites.map((site) => (
        <div key={site.website}>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-medium text-foreground">
                  {site.website}
                </span>
                <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                  <span className={cn("h-1.5 w-1.5 rounded-full", categoryColor(site.category))} />
                  {site.category}
                </span>
              </div>
            </div>
            <span className="shrink-0 text-sm font-semibold tracking-tight tabular-nums text-foreground">
              {formatDuration(site.duration)}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary/75"
              style={{ width: `${(site.duration / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Categories({ summary }: { summary: ActivitySummary }) {
  const cats = summary.byCategory;
  const max = Math.max(1, ...cats.map((c) => c.duration));
  return (
    <div className="space-y-4">
      {cats.map((cat) => (
        <CategoryRow key={cat.category} cat={cat} max={max} />
      ))}
    </div>
  );
}

function CategoryRow({ cat, max }: { cat: CategoryAggregate; max: number }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={cn("h-2 w-2 shrink-0 rounded-full", categoryColor(cat.category))} />
          <span className="truncate text-sm font-medium text-foreground">
            {cat.category}
          </span>
        </div>
        <span className="shrink-0 text-sm font-semibold tracking-tight tabular-nums text-foreground">
          {formatDuration(cat.duration)}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", categoryColor(cat.category))}
          style={{ width: `${Math.max(2, (cat.duration / max) * 100)}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{cat.share}% of total time</p>
    </div>
  );
}

function sessionLabel(session: SessionRecord): string {
  const start = new Date(session.startTime);
  return start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function SessionRow({ session }: { session: SessionRecord }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium text-foreground">
          {session.website}
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          {sessionLabel(session)}
          <span className="text-border">·</span>
          <span className="flex items-center gap-1.5">
            <span className={cn("h-1.5 w-1.5 rounded-full", categoryColor(session.category))} />
            {session.category}
          </span>
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="text-sm font-semibold tracking-tight tabular-nums text-foreground">
          {formatDuration(session.duration)}
        </span>
        <span className={kindBadgeClass(session.kind)}>
          <KindDot kind={session.kind} />
          {kindLabel(session.kind)}
        </span>
      </div>
    </div>
  );
}

export function RecentSessions({
  summary,
  limit = 6,
}: {
  summary: ActivitySummary;
  limit?: number;
}) {
  const latest = summary.sessions.slice(0, limit);
  return (
    <div className="divide-y divide-border">
      {latest.map((session) => (
        <SessionRow key={session.id} session={session} />
      ))}
    </div>
  );
}