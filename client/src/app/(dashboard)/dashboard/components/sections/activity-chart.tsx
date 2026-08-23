"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDuration, formatDurationLong, type ActivitySummary, type SeriesPoint } from "@/lib/activities";
import { KindDot } from "./section-card";

const SERIES_COLORS = {
  focus: "var(--primary)",
  neutral: "var(--warning)",
  distract: "var(--error)",
} as const;

function bucketLabel(bucket: string): string {
  // "2026-08-18" -> "18 Aug" | "2026-08-18T14" -> "14:00"
  const [dayPart, hourPart] = bucket.split("T");
  if (hourPart) {
    return `${hourPart}:00`;
  }
  const [, month, day] = dayPart.split("-").map(Number);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${day} ${months[(month ?? 1) - 1]}`;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload.reduce<{ focus: number; neutral: number; distract: number }>(
    (acc, entry) => {
      const key = entry.dataKey as keyof typeof acc;
      if (key in acc) acc[key] = Number(entry.value) || 0;
      return acc;
    },
    { focus: 0, neutral: 0, distract: 0 }
  );
  const total = point.focus + point.neutral + point.distract;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-sm">
      <p className="mb-1 text-[11px] font-medium tracking-[0.09em] text-muted-foreground uppercase">{label}</p>
      <div className="space-y-0.5 text-xs text-muted-foreground">
        <p className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5"><KindDot kind="focus" /> Focus</span>
          <span className="font-medium tracking-tight tabular-nums text-foreground">{formatDuration(point.focus)}</span>
        </p>
        <p className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5"><KindDot kind="neutral" /> Neutral</span>
          <span className="font-medium tracking-tight tabular-nums text-foreground">{formatDuration(point.neutral)}</span>
        </p>
        <p className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5"><KindDot kind="distract" /> Distracted</span>
          <span className="font-medium tracking-tight tabular-nums text-foreground">{formatDuration(point.distract)}</span>
        </p>
        <p className="mt-1 flex items-center justify-between gap-4 border-t border-border pt-1 text-foreground">
          <span>Total</span>
          <span className="font-semibold tracking-tight tabular-nums">{formatDurationLong(total)}</span>
        </p>
      </div>
    </div>
  );
}

function AxisTick({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  return (
    <text x={x} y={y} dy={10} textAnchor="middle" fill="currentColor" fontSize={11} className="text-muted-foreground" opacity={0.8}>
      {bucketLabel(payload?.value ?? "")}
    </text>
  );
}

export function FocusChart({ summary }: { summary: ActivitySummary }) {
  const data: SeriesPoint[] = summary.series.length
    ? summary.series
    : [{ bucket: summary.from ?? "", total: 0, focus: 0, neutral: 0, distract: 0 }];

  const maxTicks = data.length > 8 ? 4 : undefined;

  return (
    <div>
      <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><KindDot kind="focus" /> Focus</span>
        <span className="flex items-center gap-1.5"><KindDot kind="neutral" /> Neutral</span>
        <span className="flex items-center gap-1.5"><KindDot kind="distract" /> Distracted</span>
      </div>
      <div className="h-52 w-full" data-chart-wrapper>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -22 }} barCategoryGap="22%">
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="bucket"
              tick={<AxisTick />}
              interval={maxTicks ?? "preserveStartEnd"}
              tickLine={false}
              axisLine={false}
            />
            <YAxis tickLine={false} axisLine={false} width={44} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
            <Bar dataKey="focus" stackId="a" fill={SERIES_COLORS.focus} radius={[0, 0, 0, 0]} maxBarSize={28} />
            <Bar dataKey="neutral" stackId="a" fill={SERIES_COLORS.neutral} maxBarSize={28} />
            <Bar dataKey="distract" stackId="a" fill={SERIES_COLORS.distract} radius={[3, 3, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}