import { classifyDomain, CATEGORY_KIND, type ActivityCategory, type CategoryKind } from "../constants/categories";

/**
 * Centralized activity analytics.
 *
 * Every dashboard metric - focus / neutral / distract totals, productivity
 * score, top websites, category breakdown, sessions, and the time series - is
 * computed here from the same normalized Activity rows. Nothing on the client
 * re-derives these values with different formulas.
 */

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** Spend at least this much in a bucket before single-hour resolution kicks in. */
const HOUR_BUCKET_MAX_SPAN_MS = 36 * HOUR_MS;

export interface ActivityRow {
  id: string;
  application: string;
  category: string;
  startTime: Date;
  endTime: Date;
  duration: number;
}

export interface SessionView {
  id: string;
  website: string;
  category: ActivityCategory;
  kind: CategoryKind;
  startTime: string;
  endTime: string;
  duration: number;
}

export interface WebsiteAggregate {
  website: string;
  category: ActivityCategory;
  kind: CategoryKind;
  duration: number;
}

export interface CategoryAggregate {
  category: ActivityCategory;
  kind: CategoryKind;
  duration: number;
  share: number; // percentage of total tracked duration, 0..100
}

export interface SeriesPoint {
  bucket: string; // local-time label, e.g. "2026-08-18" or "2026-08-18T14"
  total: number;
  focus: number;
  neutral: number;
  distract: number;
}

/** Per-bucket durations split by category (for category-stacked charts). */
export interface SeriesCategoryPoint {
  bucket: string; // same local-time label as SeriesPoint
  categories: Partial<Record<ActivityCategory, number>>;
}

export interface ActivitySummaryResult {
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
  sessions: SessionView[];
  series: SeriesPoint[];
  seriesByCategory: SeriesCategoryPoint[];
}

interface CategoryAggregateDraft {
  category: ActivityCategory;
  kind: CategoryKind;
  duration: number;
}

/**
 * Deterministic, explainable productivity score.
 *
 * Formula: 100 * (focus + 0.5 * neutral) / total.
 * Focus time counts in full, neutral time counts for half, and distracted
 * time counts for zero - a weighted look at how much of your tracked time was
 * spent in productive-ish activity. Never relies on AI/ML and is easy to
 * adjust: change this one function and every surface that shows the score
 * updates, because it is only computed here.
 *
 * Returns null when there is nothing to score.
 */
export function productivityScore(total: number, focus: number, neutral: number): number | null {
  if (total <= 0) return null;
  const score = Math.round((100 * (focus + 0.5 * neutral)) / total);
  return Math.max(0, Math.min(100, score));
}

function kindFor(category: string): CategoryKind {
  return CATEGORY_KIND[category as ActivityCategory] ?? "neutral";
}

function localTimeMs(ms: number, tzOffsetMinutes: number): number {
  return ms + tzOffsetMinutes * MINUTE_MS;
}

function bucketKey(startTime: Date, tzOffsetMinutes: number, granularity: "hour" | "day"): number {
  const t = localTimeMs(startTime.getTime(), tzOffsetMinutes);
  return Math.floor(t / (granularity === "hour" ? HOUR_MS : DAY_MS));
}

function labelForBucket(bucket: number, tzOffsetMinutes: number, granularity: "hour" | "day"): string {
  const startUtc = bucket * (granularity === "hour" ? HOUR_MS : DAY_MS) - tzOffsetMinutes * MINUTE_MS;
  const dt = new Date(startUtc);
  if (granularity === "day") {
    const m = dt.getMonth() + 1;
    const day = dt.getDate();
    return `${dt.getFullYear()}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  return `${labelForBucket(Math.floor(bucket / 24), tzOffsetMinutes, "day")}T${String(bucket % 24).padStart(2, "0")}`;
}

/** Group raw Activity rows into the dashboard summary. */
export function summarizeActivities(
  activities: ActivityRow[],
  opts: { from?: Date; to?: Date; tzOffsetMinutes?: number; overrides?: Record<string, ActivityCategory> }
): ActivitySummaryResult {
  const { from, to, tzOffsetMinutes = 0, overrides = {} } = opts;
  const spanStart = from ? from.getTime() : Math.min(...activities.map((a) => a.startTime.getTime()), 0);
  const spanEnd = to ? to.getTime() : Math.max(...activities.map((a) => a.endTime.getTime()), 0);
  const granularity: "hour" | "day" =
    spanEnd - spanStart <= HOUR_BUCKET_MAX_SPAN_MS ? "hour" : "day";

  let totalDuration = 0;
  let focusDuration = 0;
  let neutralDuration = 0;
  let distractDuration = 0;

  const byWebsite = new Map<string, { website: string; category: ActivityCategory; kind: CategoryKind; duration: number }>();
  const byCategory = new Map<string, CategoryAggregateDraft>();
  const seriesMap = new Map<number, SeriesPoint>();
  const seriesCategoryMap = new Map<number, Map<ActivityCategory, number>>();

  const sessions: SessionView[] = activities.map((a) => {
    const category = classifyDomain(a.application, overrides);
    const kind = kindFor(category);

    totalDuration += a.duration;
    if (kind === "focus") focusDuration += a.duration;
    else if (kind === "distract") distractDuration += a.duration;
    else neutralDuration += a.duration;

    const site = byWebsite.get(a.application);
    if (site) site.duration += a.duration;
    else byWebsite.set(a.application, { website: a.application, category, kind, duration: a.duration });

    const cat = byCategory.get(category);
    if (cat) cat.duration += a.duration;
    else byCategory.set(category, { category, kind, duration: a.duration });

    const key = bucketKey(a.startTime, tzOffsetMinutes, granularity);
    const point = seriesMap.get(key);
    if (point) {
      point.total += a.duration;
      point.focus += kind === "focus" ? a.duration : 0;
      point.neutral += kind === "neutral" ? a.duration : 0;
      point.distract += kind === "distract" ? a.duration : 0;
    } else {
      seriesMap.set(key, {
        bucket: labelForBucket(key, tzOffsetMinutes, granularity),
        total: a.duration,
        focus: kind === "focus" ? a.duration : 0,
        neutral: kind === "neutral" ? a.duration : 0,
        distract: kind === "distract" ? a.duration : 0,
      });
    }

    // Per-category duration per bucket, e.g. for stacked category charts.
    const catMap = seriesCategoryMap.get(key);
    if (catMap) {
      catMap.set(category, (catMap.get(category) ?? 0) + a.duration);
    } else {
      seriesCategoryMap.set(key, new Map([[category, a.duration]]));
    }

    return {
      id: a.id,
      website: a.application,
      category,
      kind,
      startTime: a.startTime.toISOString(),
      endTime: a.endTime.toISOString(),
      duration: a.duration,
    };
  });

  const byCategoryList: CategoryAggregate[] = [...byCategory.values()]
    .sort((a, b) => b.duration - a.duration)
    .map((c) => ({
      ...c,
      share: totalDuration > 0 ? Math.round((100 * c.duration) / totalDuration) : 0,
    }));

  return {
    from: from ? from.toISOString() : null,
    to: to ? to.toISOString() : null,
    granularity,
    totalDuration,
    focusDuration,
    neutralDuration,
    distractDuration,
    productivityScore: productivityScore(totalDuration, focusDuration, neutralDuration),
    shares: {
      focus: totalDuration > 0 ? Math.round((100 * focusDuration) / totalDuration) : 0,
      neutral: totalDuration > 0 ? Math.round((100 * neutralDuration) / totalDuration) : 0,
      distract: totalDuration > 0 ? Math.round((100 * distractDuration) / totalDuration) : 0,
    },
    trackedWebsitesCount: byWebsite.size,
    topWebsites: [...byWebsite.values()].sort((a, b) => b.duration - a.duration).slice(0, 8),
    byCategory: byCategoryList,
    sessions,
    series: [...seriesMap.values()].sort((a, b) => a.bucket.localeCompare(b.bucket)),
    seriesByCategory: [...seriesCategoryMap.entries()]
      .map(([key, cats]) => ({
        bucket: labelForBucket(key, tzOffsetMinutes, granularity),
        categories: Object.fromEntries(cats) as Partial<Record<ActivityCategory, number>>,
      }))
      .sort((a, b) => a.bucket.localeCompare(b.bucket)),
  };
}

export { classifyDomain };