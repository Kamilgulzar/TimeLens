"use client";

import { useState } from "react";

import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Info, Minus } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { formatDuration, type ActivitySummary } from "@/lib/activities";

function clamp100(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/** Round percentage change between two real values, or null when unmeasurable. */
function pctChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function scoreLabel(score: number | null): string {
  if (score === null) return "No activity yet";
  if (score >= 80) return "Great focus today";
  if (score >= 60) return "Good focus today";
  if (score >= 40) return "Average focus";
  return "Needs focus";
}

function Comparison({
  label,
  change,
  invert = false,
}: {
  label: string;
  change: number | null;
  invert?: boolean;
}) {
  if (change === null) {
    return <p className="text-[11px] text-muted-foreground">{label}</p>;
  }
  const improved = invert ? change <= 0 : change >= 0;
  return (
    <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
      <span>{label}</span>
      <span
        className={cn(
          "flex items-center gap-0.5 font-medium tabular-nums",
          improved ? "text-success" : "text-error"
        )}
      >
        <span aria-hidden>{change > 0 ? "↑" : "↓"}</span>
        {Math.abs(change)}%
      </span>
    </p>
  );
}

function Progress({ value, barClass }: { value: number; barClass: string }) {
  const percent = clamp100(value);
  return (
    <div
      className="h-[4px] w-full overflow-hidden rounded-full bg-muted"
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full", barClass)}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function InfoHint({ label }: { label: string }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className="shrink-0 text-muted-foreground/70 outline-none transition-colors duration-150 hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <Info className="h-3.5 w-3.5" />
    </button>
  );
}

function ScoreSparkline({ series }: { series: ActivitySummary["series"] }) {
  const data = series.map((point) => ({
    score:
      point.total > 0
        ? Math.max(0, Math.min(100, Math.round(((point.focus + 0.5 * point.neutral) / point.total) * 100)))
        : null,
  }));

  const hasScore = data.some((d) => d.score !== null);

  return (
    <div className="h-full w-full">
      {hasScore ? (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="scoreWaveFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="score"
              stroke="var(--primary)"
              strokeWidth={1.5}
              strokeLinecap="round"
              fill="url(#scoreWaveFill)"
              connectNulls
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span className="text-[11px] text-muted-foreground">—</span>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  hint,
  trend,
  children,
}: {
  label: string;
  hint: string;
  trend: { direction: "up" | "down" | "flat"; change: number | null; label: string };
  children: ReactNode;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative flex h-full flex-col rounded-lg bg-card p-3 shadow-[0_1px_2px_rgba(17,24,39,0.05)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_2px_8px_rgba(0,0,0,0.35)] outline-none transition-shadow duration-150 focus-visible:ring-2 focus-visible:ring-ring/40"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-medium tracking-[0.09em] text-muted-foreground uppercase">
          {label}
        </h3>
        <InfoHint label={hint} />
      </div>
      {children}

      {hovered && trend.change !== null && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex justify-center"
          aria-live="polite"
        >
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
              "bg-popover shadow-[0_2px_8px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.04)]",
              trend.direction === "up"
                ? "text-success"
                : trend.direction === "down"
                  ? "text-error"
                  : "text-muted-foreground"
            )}
          >
            {trend.direction === "up" ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : trend.direction === "down" ? (
              <ArrowDownRight className="h-3.5 w-3.5" />
            ) : (
              <Minus className="h-3.5 w-3.5" />
            )}
            <span>
              {trend.direction === "up"
                ? "Increasing"
                : trend.direction === "down"
                  ? "Decreasing"
                  : "Stable"}{" "}
              · {Math.abs(trend.change)}% {trend.label}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

interface MetricCardsProps {
  summary: ActivitySummary;
  prevSummary?: ActivitySummary;
  comparisonLabel: string;
}

/**
 * The four headline metrics, rendered as borderless elevated slots. Every
 * number, share, and comparison is derived from real tracked data; when there
 * is nothing to compare against the delta line simply stays muted instead of
 * inventing a value.
 */
export function MetricCards({
  summary,
  prevSummary,
  comparisonLabel,
}: MetricCardsProps) {
  const prev = prevSummary;
  const totalChange = pctChange(summary.totalDuration, prev?.totalDuration ?? 0);
  const focusChange = pctChange(summary.focusDuration, prev?.focusDuration ?? 0);
  const distractChange = pctChange(
    summary.distractDuration,
    prev?.distractDuration ?? 0
  );
  const scoreChange =
    summary.productivityScore !== null && prev?.productivityScore != null
      ? pctChange(summary.productivityScore, prev.productivityScore)
      : null;
  const score = summary.productivityScore;

  const trendFor = (
    change: number | null,
    invert = false
  ): { direction: "up" | "down" | "flat"; change: number | null; label: string } => {
    if (change === null) return { direction: "flat", change: null, label: comparisonLabel };
    const improved = invert ? change <= 0 : change >= 0;
    return {
      direction: change === 0 ? "flat" : improved ? "up" : "down",
      change,
      label: comparisonLabel,
    };
  };

  return (
    <div className="grid grid-cols-1 auto-rows-[164px] gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="Total Time"
        hint="Total tracked browsing time in this period"
        trend={trendFor(totalChange)}
      >
        <div className="mt-3">
          <div className="text-[26px] leading-none font-semibold tracking-tight tabular-nums text-foreground">
            {formatDuration(summary.totalDuration)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Across {summary.trackedWebsitesCount}{" "}
            {summary.trackedWebsitesCount === 1 ? "website" : "websites"}
          </p>
        </div>
        <div className="mt-auto pt-2.5">
          <div className="flex h-[24px] items-end">
            <Progress
              value={
                prev?.totalDuration
                  ? (100 * summary.totalDuration) / prev.totalDuration
                  : 0
              }
              barClass="bg-primary"
            />
          </div>
          <div className="mt-1.5 flex items-center">
            <Comparison label={comparisonLabel} change={totalChange} />
          </div>
        </div>
      </MetricCard>

      <MetricCard
        label="Focus Time"
        hint="Time on websites classified as focus"
        trend={trendFor(focusChange)}
      >
        <div className="mt-3">
          <div className="text-[26px] leading-none font-semibold tracking-tight tabular-nums text-foreground">
            {formatDuration(summary.focusDuration)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {summary.shares.focus}% of total time
          </p>
        </div>
        <div className="mt-auto pt-2.5">
          <div className="flex h-[24px] items-end">
            <Progress value={summary.shares.focus} barClass="bg-success" />
          </div>
          <div className="mt-1.5 flex items-center">
            <Comparison label={comparisonLabel} change={focusChange} />
          </div>
        </div>
      </MetricCard>

      <MetricCard
        label="Distracted Time"
        hint="Time on websites classified as distracting"
        trend={trendFor(distractChange, true)}
      >
        <div className="mt-3">
          <div className="text-[26px] leading-none font-semibold tracking-tight tabular-nums text-foreground">
            {formatDuration(summary.distractDuration)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {summary.shares.distract}% of total time
          </p>
        </div>
        <div className="mt-auto pt-2.5">
          <div className="flex h-[24px] items-end">
            <Progress value={summary.shares.distract} barClass="bg-error" />
          </div>
          <div className="mt-1.5 flex items-center">
            <Comparison
              label={comparisonLabel}
              change={distractChange}
              invert
            />
          </div>
        </div>
      </MetricCard>

      <MetricCard
        label="Productivity Score"
        hint="100 × (Focus + half of Neutral) ÷ total time"
        trend={trendFor(scoreChange)}
      >
        <div className="mt-3">
          <div className="text-[26px] leading-none font-semibold tracking-tight tabular-nums text-foreground">
            {score === null ? "--" : `${score}%`}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{scoreLabel(score)}</p>
        </div>
        <div className="mt-auto pt-2.5">
          <div className="h-[24px]">
            <ScoreSparkline series={summary.series} />
          </div>
          <div className="mt-1.5 flex items-center">
            <Comparison label={comparisonLabel} change={scoreChange} />
          </div>
        </div>
      </MetricCard>
    </div>
  );
}