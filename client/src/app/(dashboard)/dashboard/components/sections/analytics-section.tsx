"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Info, RefreshCw } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import {
  dateRange,
  fetchActivitySummary,
  formatDuration,
  formatDurationLong,
  type ActivitySummary,
} from "@/lib/activities";
import { cn } from "@/lib/utils";
import { GROUPS, GROUP_BY_KEY, groupFor, emptyGroupCounts, type GroupKey } from "./category-groups";
import { WebsiteIcon } from "./website-icon";

type ViewKey = "day" | "week" | "month";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function localDayString(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function hourLabel(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

function emptyCounts(): Record<GroupKey, number> {
  return emptyGroupCounts();
}

interface SeriesDatum {
  key: string;
  label: string;
  values: Record<GroupKey, number>;
}

/**
 * Build the stacked-bar series in minutes, keyed by local time label so the
 * axis always spans the full requested window (24 hours / 7 days / 30 days),
 * even when most buckets have no activity.
 */
function buildSeries(summary: ActivitySummary, view: ViewKey): SeriesDatum[] {
  const byKey = new Map(
    (summary.seriesByCategory ?? []).map((p) => [p.bucket, p.categories])
  );

  const countsFor = (
    categories: Partial<Record<string, number>> | undefined
  ): Record<GroupKey, number> => {
    const counts = emptyCounts();
    if (!categories) return counts;
    for (const [category, duration] of Object.entries(categories)) {
      const key = groupFor(category);
      counts[key] += Math.round(((duration ?? 0) / 60) * 10) / 10;
    }
    return counts;
  };

  if (view === "day") {
    const now = new Date();
    const today = localDayString(now);

    return Array.from({ length: 24 }, (_, hour) => {
      const key = `${today}T${pad2(hour)}`;
      return {
        key,
        label: hourLabel(hour),
        values: countsFor(byKey.get(key)),
      };
    });
  }

  const start = summary.from ? new Date(summary.from) : new Date();
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = summary.to ? new Date(summary.to) : new Date();
  const endDayStart = new Date(endDay.getFullYear(), endDay.getMonth(), endDay.getDate());
  const totalDays = Math.max(
    1,
    Math.round((endDayStart.getTime() - startDay.getTime()) / 86_400_000) + 1
  );
  const dayCount = view === "week" ? 7 : totalDays;

  const data: SeriesDatum[] = [];
  for (let i = 0; i < dayCount; i++) {
    const d = new Date(startDay.getFullYear(), startDay.getMonth(), startDay.getDate() + i);
    const key = localDayString(d);
    data.push({
      key,
      label: `${pad2(d.getDate())}-${pad2(d.getMonth() + 1)}-${d.getFullYear()}`,
      values: countsFor(byKey.get(key)),
    });
  }
  return data;
}

function groupTotals(summary: ActivitySummary): Record<GroupKey, number> {
  const totals = emptyCounts();
  for (const cat of summary.byCategory ?? []) {
    totals[groupFor(cat.category)] += cat.duration;
  }
  return totals;
}

function ChartTooltip({
  active,
  payload,
  label,
  labels,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number }>;
  label?: string;
  labels: Map<string, string>;
}) {
  if (!active || !payload?.length) return null;
  const items = payload
    .filter((p) => Number(p.value) > 0)
    .map((p) => {
      const group = GROUP_BY_KEY.get(p.dataKey as GroupKey);
      return { ...p, group };
    })
    .filter((p) => p.group);
  if (items.length === 0) return null;
  const total = items.reduce((sum, p) => sum + Number(p.value) * 60, 0);
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-sm">
      <p className="mb-1 text-[11px] font-medium tracking-[0.09em] text-muted-foreground uppercase">
        {labels.get(label ?? "") ?? label}
      </p>
      <div className="space-y-0.5 text-xs text-muted-foreground">
        {items.map((p) => (
          <p key={p.dataKey} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: p.group!.color }}
              />
              {p.group!.label}
            </span>
            <span className="font-medium tracking-tight tabular-nums text-foreground">
              {formatDuration(Number(p.value) * 60)}
            </span>
          </p>
        ))}
        <p className="mt-1 flex items-center justify-between gap-4 border-t border-border pt-1 text-foreground">
          <span>Total</span>
          <span className="font-semibold tracking-tight tabular-nums">
            {formatDurationLong(total)}
          </span>
        </p>
      </div>
    </div>
  );
}

function ViewControl({
  value,
  onChange,
}: {
  value: ViewKey;
  onChange: (view: ViewKey) => void;
}) {
  const options: { key: ViewKey; label: string }[] = [
    { key: "day", label: "Day" },
    { key: "week", label: "Week" },
    { key: "month", label: "Month" },
  ];
  return (
    <div className="flex h-8 items-center gap-0.5 rounded-lg bg-muted p-0.5">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={cn(
            "h-full whitespace-nowrap rounded-md px-2.5 text-xs font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring/40",
            value === o.key
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-52 animate-pulse rounded-lg bg-muted/60" />
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 animate-pulse rounded-md bg-muted/50" />
        ))}
      </div>
    </div>
  );
}

function PanelError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3 py-2">
      <p className="text-sm text-muted-foreground">
        Unable to load browsing activity data.
      </p>
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

function Favicon({ domain }: { domain: string }) {
  return <WebsiteIcon domain={domain} size={20} />;
}

export function AnalyticsSection() {
  const [view, setView] = useState<ViewKey>("day");
  const { from, to } = useMemo(() => {
    const range = dateRange(view === "day" ? "today" : view === "week" ? "7d" : "30d");
    return { from: range.from, to: range.to };
  }, [view]);

  const { data: summary, isPending, isError, refetch } = useQuery({
    queryKey: ["activity-analytics", from, to],
    queryFn: () => fetchActivitySummary(from, to),
    enabled: Boolean(from && to),
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  const loading = isPending || (isError && !summary);
  const failed = Boolean(isError && !summary);
  const empty = Boolean(!failed && summary && summary.totalDuration === 0);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,13fr)_minmax(0,7fr)]">
      <BrowsingActivityCard
        view={view}
        onViewChange={setView}
        summary={summary}
        loading={loading}
        failed={failed}
        empty={empty}
        onRetry={() => void refetch()}
      />
      <TopWebsitesCard
        summary={summary}
        loading={loading}
        failed={failed}
        empty={empty}
        onRetry={() => void refetch()}
      />
    </div>
  );
}

function BrowsingActivityCard({
  view,
  onViewChange,
  summary,
  loading,
  failed,
  empty,
  onRetry,
}: {
  view: ViewKey;
  onViewChange: (view: ViewKey) => void;
  summary?: ActivitySummary;
  loading: boolean;
  failed: boolean;
  empty: boolean;
  onRetry: () => void;
}) {
  const data = useMemo(() => (summary ? buildSeries(summary, view) : []), [summary, view]);
  const labels = useMemo(() => new Map(data.map((d) => [d.key, d.label])), [data]);
  const totals = useMemo(() => (summary ? groupTotals(summary) : emptyCounts()), [summary]);

  const dayKeys = useMemo(() => data.map((d) => d.key), [data]);
  const ticks = useMemo(() => {
    if (view === "day") {
      return [0, 4, 8, 12, 16, 20].map((h) => dayKeys[h]).filter(Boolean);
    }
    if (view === "week") {
      return dayKeys;
    }
    return dayKeys.filter((_, i) => i % 5 === 0);
  }, [view, dayKeys]);

  const clamped = data.map((d) => ({
    key: d.key,
    ...Object.fromEntries(
      GROUPS.map((g) => [
        g.key,
        Math.max(0, Math.round(d.values[g.key] * 10) / 10),
      ])
    ),
  }));

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-1.5">
          <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
            Browsing Activity
          </CardTitle>
          <button
            type="button"
            title="Stacked by website category across the selected window"
            aria-label="About browsing activity"
            className="shrink-0 text-muted-foreground/70 outline-none transition-colors duration-150 hover:text-muted-foreground"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </div>
        <ViewControl value={view} onChange={onViewChange} />
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {loading ? (
          <PanelSkeleton />
        ) : failed ? (
          <PanelError onRetry={onRetry} />
        ) : empty ? (
          <p className="py-6 text-sm text-muted-foreground">
            No browsing activity yet
          </p>
        ) : (
          <>
            <div className="h-52 w-full" data-chart-wrapper>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={clamped}
                  margin={{ top: 4, right: 4, bottom: 0, left: -18 }}
                  barCategoryGap="18%"
                >
                  <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="key"
                    ticks={ticks}
                    tickFormatter={(value: string) => labels.get(value) ?? value}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tickFormatter={(value: number) => `${Math.round(value)}m`}
                    width={48}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    content={<ChartTooltip labels={labels} />}
                    cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                  />
                  {GROUPS.map((g, i) => (
                    <Bar
                      key={g.key}
                      dataKey={g.key}
                      stackId="a"
                      fill={g.color}
                      maxBarSize={28}
                      radius={i === GROUPS.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2.5">
              {GROUPS.map((g) => (
                <div key={g.key} className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: g.color }}
                  />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-xs text-foreground">{g.label}</span>
                    <span className="text-[11px] tabular-nums text-muted-foreground">
                      {formatDuration(totals[g.key])}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function TopWebsitesCard({
  summary,
  loading,
  failed,
  empty,
  onRetry,
}: {
  summary?: ActivitySummary;
  loading: boolean;
  failed: boolean;
  empty: boolean;
  onRetry: () => void;
}) {
  const sites = summary?.topWebsites ?? [];
  const total = summary?.totalDuration ?? 0;

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-1">
        <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
          Top Websites
        </CardTitle>
        <Link
          href="/dashboard/activities"
          className="text-xs font-medium text-primary outline-none transition-opacity duration-150 hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring/40 rounded"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 animate-pulse rounded-[5px] bg-muted/70" />
                    <div className="h-3.5 w-28 animate-pulse rounded bg-muted/60" />
                  </div>
                  <div className="h-3.5 w-12 animate-pulse rounded bg-muted/60" />
                </div>
                <div className="h-1.5 w-full animate-pulse rounded-full bg-muted/50" />
              </div>
            ))}
          </div>
        ) : failed ? (
          <PanelError onRetry={onRetry} />
        ) : empty ? (
          <p className="py-6 text-sm text-muted-foreground">
            No browsing activity yet
          </p>
        ) : (
          <div className="flex flex-1 flex-col gap-3.5">
            {sites.slice(0, 6).map((site) => {
              const raw = total > 0 ? (site.duration / total) * 100 : 0;
              const pct = Math.round(raw);
              const pctLabel = site.duration > 0 && pct < 1 ? "<1%" : `${pct}%`;
              return (
                <div key={site.website} className="flex items-center gap-2.5">
                  <Favicon domain={site.website} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[13px] font-medium text-foreground">
                        {site.website}
                      </span>
                      <span className="shrink-0 text-[13px] font-semibold tracking-tight tabular-nums text-foreground">
                        {formatDuration(site.duration)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="min-w-0 truncate text-[11px] text-muted-foreground">
                        {site.category}
                      </span>
                      <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.max(0, Math.min(100, pct))}%`,
                            backgroundColor: GROUP_BY_KEY.get(groupFor(site.category))?.color,
                          }}
                        />
                      </div>
                      <span className="w-8 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                        {pctLabel}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}