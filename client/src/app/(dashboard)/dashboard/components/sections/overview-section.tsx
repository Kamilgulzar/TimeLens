"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { ExternalLink, Info, Pause, Play, RefreshCw } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Sector } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useExtensionStatus } from "@/hooks/use-extension-status";
import {
  formatDuration,
  kindLabel,
  type ActivitySummary,
  type SessionRecord,
} from "@/lib/activities";
import { formatRelativeTime, setExtensionTracking } from "@/lib/extension";
import { cn } from "@/lib/utils";
import { GROUPS, groupFor, emptyGroupCounts } from "./category-groups";
import { KindDot, kindBadgeClass } from "./section-card";
import { WebsiteIcon } from "./website-icon";

function InfoHint({ title }: { title: string }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      className="shrink-0 text-muted-foreground/70 outline-none transition-colors duration-150 hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <Info className="h-3.5 w-3.5" />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* By Category                                                         */
/* ------------------------------------------------------------------ */

interface GroupAggregate {
  key: string;
  label: string;
  color: string;
  duration: number;
  pct: number;
}

function aggregateGroups(summary: ActivitySummary): GroupAggregate[] {
  const totals = emptyGroupCounts();
  for (const cat of summary.byCategory ?? []) {
    totals[groupFor(cat.category)] += cat.duration;
  }
  const total = summary.totalDuration;
  return GROUPS.map((g) => ({
    key: g.key,
    label: g.label,
    color: g.color,
    duration: totals[g.key],
    pct: total > 0 ? Math.round((100 * totals[g.key]) / total) : 0,
  }))
    .filter((g) => g.duration > 0)
    .sort((a, b) => b.duration - a.duration);
}

function pctLabel(duration: number, total: number): string {
  if (duration <= 0) return "0%";
  const pct = Math.round((100 * duration) / total);
  return pct < 1 ? "<1%" : `${pct}%`;
}

function RenderActiveShape({
  cx,
  cy,
  innerRadius,
  outerRadius,
  startAngle,
  endAngle,
  fill,
  index,
  activeIndex,
}: {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill?: string;
  index?: string | number;
  activeIndex: number | null;
}) {
  const active = activeIndex != null && String(index) === String(activeIndex);
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={active ? outerRadius + 4 : outerRadius}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill ?? "#888"}
      fillOpacity={activeIndex == null || active ? 1 : 0.35}
      cornerRadius={2}
      className="cursor-pointer outline-none"
      style={{ transition: "fill-opacity 150ms ease" }}
    />
  );
}

function ByCategoryDonut({ groups, total }: { groups: GroupAggregate[]; total: number }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const hasData = groups.length > 0;
  const activeGroup = activeIndex != null ? groups[activeIndex] : null;

  return (
    <div className="relative h-[136px] w-[136px] shrink-0">
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart onMouseLeave={() => setActiveIndex(null)}>
            <Pie
              data={groups}
              dataKey="duration"
              nameKey="key"
              innerRadius={46}
              outerRadius={61}
              paddingAngle={2}
              cornerRadius={2}
              stroke="none"
              isAnimationActive={false}
              shape={(sector) => RenderActiveShape({ ...sector, activeIndex })}
              onMouseEnter={(_, index) => setActiveIndex(index)}
            >
              {groups.map((g) => (
                <Cell key={g.key} fill={g.color} stroke="none" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full w-full rounded-full border-2 border-dashed border-border/70" aria-hidden />
      )}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="max-w-full px-1.5 text-center">
          {activeGroup ? (
            <>
              <div className="text-lg leading-tight font-semibold tracking-tight tabular-nums text-foreground">
                {activeGroup.pct}%
              </div>
              <div className="truncate text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                {activeGroup.label}
              </div>
            </>
          ) : (
            <>
              <div className="text-lg leading-tight font-semibold tracking-tight tabular-nums text-foreground">
                {hasData ? formatDuration(total) : "0m"}
              </div>
              <div className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                Total
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryBreakdown({ groups, total }: { groups: GroupAggregate[]; total: number }) {
  return (
    <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 gap-y-2.5">
      {groups.map((g) => (
        <Fragment key={g.key}>
          <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: g.color }}
              aria-hidden
            />
            <span className="truncate">{g.label}</span>
          </span>
          <span className="text-right text-sm font-medium tracking-tight whitespace-nowrap tabular-nums text-foreground">
            {formatDuration(g.duration)}
          </span>
          <span className="text-right text-xs whitespace-nowrap tabular-nums text-muted-foreground">
            {pctLabel(g.duration, total)}
          </span>
        </Fragment>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Recent Sessions                                                     */
/* ------------------------------------------------------------------ */

function sessionTime(session: SessionRecord): string {
  return new Date(session.startTime).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function SessionRowContent({ session }: { session: SessionRecord }) {
  return (
    <>
      <WebsiteIcon domain={session.website} size={20} />
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-foreground">{session.website}</div>
        <div className="truncate text-xs text-muted-foreground">{session.category}</div>
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">{sessionTime(session)}</span>
      <span className="text-sm font-semibold tracking-tight tabular-nums text-foreground">
        {formatDuration(session.duration)}
      </span>
      <span className="text-xs font-medium tabular-nums text-right">
        <span className={cn("inline-flex items-center gap-1.5", kindBadgeClass(session.kind))}>
          <KindDot kind={session.kind} />
          {kindLabel(session.kind)}
        </span>
      </span>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Extension Status                                                    */
/* ------------------------------------------------------------------ */

function ExtensionPanel() {
  const { data: status, refetch } = useExtensionStatus();
  const [pending, setPending] = useState(false);

  const controlMutation = useMutation({
    mutationFn: (enabled: boolean) => setExtensionTracking(enabled),
    onMutate: () => setPending(true),
    onSettled: () => {
      setPending(false);
      void refetch();
    },
  });

  const connected = Boolean(status?.connected);
  const tracking = Boolean(status?.trackingEnabled);
  const applying = pending || status?.desiredTrackingEnabled != null;

  const state = status
    ? connected
      ? tracking
        ? "connected"
        : "paused"
      : "disconnected"
    : "loading";

  const stateLabel =
    state === "connected"
      ? "Connected"
      : state === "paused"
        ? "Paused"
        : state === "disconnected"
          ? "Disconnected"
          : "Loading…";

  const stateText =
    state === "connected"
      ? "TimeLens extension is active and tracking."
      : state === "paused"
        ? "Tracking is paused. Resume to start recording again."
        : state === "disconnected"
          ? "TimeLens extension is not connected right now."
          : "Waiting for the extension to report its state.";

  return (
    <CardContent className="flex flex-1 flex-col">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            state === "connected"
              ? "bg-success"
              : state === "paused"
                ? "bg-warning"
                : "bg-muted-foreground/50"
          )}
          aria-hidden
        />
        <span className="text-sm font-semibold tracking-tight text-foreground">{stateLabel}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{stateText}</p>

      <div className="mt-4 divide-y divide-border">
        <div className="flex items-center justify-between gap-4 py-2 first:pt-0">
          <span className="text-xs text-muted-foreground">Tracking</span>
          <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                tracking ? "bg-success" : "bg-warning"
              )}
              aria-hidden
            />
            {applying ? "Applying…" : tracking ? "Active" : "Paused"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 py-2">
          <span className="text-xs text-muted-foreground">Browser</span>
          <span className="text-xs font-medium text-foreground">{status?.browser ?? "Chrome"}</span>
        </div>
        <div className="flex items-center justify-between gap-4 py-2 last:pb-0">
          <span className="text-xs text-muted-foreground">Last synced</span>
          <span className="text-xs font-medium tabular-nums text-foreground">
            {formatRelativeTime(status?.lastSyncedAt ?? null)}
          </span>
        </div>
      </div>

      <div className="mt-auto grid grid-cols-2 gap-2 pt-6">
        <button
          type="button"
          disabled={!status || applying}
          onClick={() => controlMutation.mutate(!tracking)}
          className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-foreground outline-none transition-colors duration-150 hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {tracking ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {tracking ? "Pause Tracking" : "Resume"}
        </button>
        <Link
          href="/dashboard/extension"
          className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground outline-none transition-opacity duration-150 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          Open Extension
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </CardContent>
  );
}

/* ------------------------------------------------------------------ */
/* Section shell + loading / error / empty                             */
/* ------------------------------------------------------------------ */

function PanelSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 py-1">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-9 animate-pulse rounded-md bg-muted/70"
          style={{ opacity: 1 - i * 0.16 }}
        />
      ))}
    </div>
  );
}

function PanelError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3 py-2">
      <p className="text-sm text-muted-foreground">Unable to load activity data.</p>
      <button
        type="button"
        onClick={onRetry}
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Retry
      </button>
    </div>
  );
}

interface OverviewSectionProps {
  summary?: ActivitySummary;
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
}

/**
 * The three-panel overview: category donut, recent sessions, and the live
 * extension status. Panels share one surface treatment and stretch to the same
 * height; only browser-extension activity is represented (no desktop tracking).
 */
export function OverviewSection({ summary, loading, failed, onRetry }: OverviewSectionProps) {
  const groups = useMemo(() => (summary ? aggregateGroups(summary) : []), [summary]);
  const total = summary?.totalDuration ?? 0;
  const sessions = summary?.sessions ?? [];
  const viewportSessions = sessions.slice(0, 4);
  const moreCount = Math.max(0, sessions.length - viewportSessions.length);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,35fr)_minmax(0,39fr)_minmax(0,26fr)]">
      <Card className="flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-1.5 text-[11px] font-medium tracking-[0.09em] text-muted-foreground uppercase">
            By Category
          </CardTitle>
          <InfoHint title="Browsing time across website categories in the selected period" />
        </CardHeader>
        <CardContent className="flex flex-1 flex-col">
          {loading ? (
            <PanelSkeleton rows={4} />
          ) : failed ? (
            <PanelError onRetry={onRetry} />
          ) : summary && total === 0 ? (
            <div className="flex flex-col items-center gap-3 pb-2">
              <ByCategoryDonut groups={[]} total={0} />
              <p className="text-sm text-muted-foreground">No browsing activity yet</p>
            </div>
          ) : (
            <div className="flex flex-1 items-start gap-5">
              <ByCategoryDonut groups={groups} total={total} />
              <CategoryBreakdown groups={groups} total={total} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-1.5 text-[11px] font-medium tracking-[0.09em] text-muted-foreground uppercase">
            Recent Sessions
          </CardTitle>
          <span className="flex items-center gap-2.5">
            <InfoHint title="Most recent browsing sessions in the selected period" />
            <Link
              href="/dashboard/activities"
              className="text-xs font-medium text-primary outline-none transition-opacity duration-150 hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring/40 rounded"
            >
              View all
            </Link>
          </span>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col">
          {loading ? (
            <PanelSkeleton rows={4} />
          ) : failed ? (
            <PanelError onRetry={onRetry} />
          ) : summary && sessions.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">No recent sessions</p>
          ) : (
            <div className="flex flex-1 flex-col">
              <div className="grid grid-cols-[20px_minmax(0,1fr)_auto_auto_auto] items-center gap-x-2.5">
                {viewportSessions.map((session, i) => (
                  <Fragment key={session.id}>
                    {i > 0 && (
                      <div className="col-span-5 my-1 h-px bg-border" aria-hidden />
                    )}
                    <SessionRowContent session={session} />
                  </Fragment>
                ))}
              </div>
              {moreCount > 0 && (
                <Link
                  href="/dashboard/activities"
                  className="mt-auto pt-1 text-xs font-medium text-primary outline-none transition-opacity duration-150 hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring/40 rounded"
                >
                  + {moreCount} more sessions
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-1.5 text-[11px] font-medium tracking-[0.09em] text-muted-foreground uppercase">
            Extension Status
          </CardTitle>
          <InfoHint title="Live state of the TimeLens browser extension" />
        </CardHeader>
        <ExtensionPanel />
      </Card>
    </div>
  );
}