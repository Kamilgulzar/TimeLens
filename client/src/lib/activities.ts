import api from "@/lib/api";

export type CategoryKind = "focus" | "neutral" | "distract";

export interface WebsiteAggregate {
  website: string;
  category: string;
  kind: CategoryKind;
  duration: number;
}

export interface CategoryAggregate {
  category: string;
  kind: CategoryKind;
  duration: number;
  share: number;
}

export interface SessionRecord {
  id: string;
  website: string;
  category: string;
  kind: CategoryKind;
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

export interface SeriesCategoryPoint {
  bucket: string;
  categories: Partial<Record<string, number>>;
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
  seriesByCategory: SeriesCategoryPoint[];
}

export async function fetchActivitySummary(
  from?: string,
  to?: string
): Promise<ActivitySummary> {
  const response = await api.get<ActivitySummary>("/activities/summary", {
    params: from || to ? { from, to, tzOffsetMinutes: tzOffsetMinutes() } : { tzOffsetMinutes: tzOffsetMinutes() },
  });
  return response.data;
}

export interface DateRange {
  key: "today" | "7d" | "30d";
  label: string;
  from: string;
  to: string;
}

/** Minutes east of UTC for the user's local timezone. */
export function tzOffsetMinutes(): number {
  return -new Date().getTimezoneOffset();
}

/** Start of the user's local day for a given Date. */
function localStartOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * The dashboard date ranges. Boundaries are aligned to the user's local day:
 * - today  -> start of the current local day .. now
 * - 7d     -> start of the local day 6 days ago .. now (current day + previous 6)
 * - 30d    -> start of the local day 29 days ago .. now (current day + previous 29)
 * Timestamps are stored in UTC; the local day is derived from the user's timezone.
 */
export function dateRange(key: DateRange["key"]): DateRange {
  const now = new Date();
  const to = now.toISOString();
  let from: Date;
  if (key === "today") {
    from = localStartOfDay(now);
  } else {
    const daysBack = key === "7d" ? 6 : 29;
    from = localStartOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysBack));
  }
  const labels: Record<DateRange["key"], string> = {
    today: "Today",
    "7d": "Last 7 days",
    "30d": "Last 30 days",
  };
  return { key, label: labels[key], from: from.toISOString(), to };
}

/** Duration in seconds -> compact human-readable string. */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  if (seconds < 60) return `${seconds}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Long-form duration for tooltips, e.g. "1h 20m 5s". */
export function formatDurationLong(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  if (m > 0) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  return `${s}s`;
}

/** Readable label for an activity state. */
export function kindLabel(kind: CategoryKind): string {
  if (kind === "focus") return "Focus";
  if (kind === "distract") return "Distracted";
  return "Neutral";
}

/**
 * Stable color per category so the same category always renders the same
 * accent across Top Websites, By Category, sessions, and the timeline.
 * Tailwind needs static classes, so this is an explicit map with a fallback.
 */
const CATEGORY_COLORS: Record<string, string> = {
  Development: "bg-sky-500",
  Work: "bg-violet-500",
  Communication: "bg-teal-500",
  Research: "bg-blue-500",
  Learning: "bg-emerald-500",
  Productivity: "bg-indigo-500",
  "AI / Research": "bg-fuchsia-500",
  Design: "bg-pink-500",
  Entertainment: "bg-orange-500",
  "Social Media": "bg-rose-500",
  News: "bg-amber-500",
  Shopping: "bg-cyan-500",
};

export function categoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? "bg-slate-400";
}