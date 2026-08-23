"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useActivitySummary } from "@/hooks/use-activity-summary";
import { dateRange, type DateRange } from "@/lib/activities";
import { RangeControl } from "./components/sections/range-control";
import { DateSelector } from "./components/sections/date-selector";
import { MetricCards } from "./components/sections/metric-cards";
import { AnalyticsSection } from "./components/sections/analytics-section";
import { OverviewSection } from "./components/sections/overview-section";
import { InfoBanner } from "./components/sections/info-banner";
import { cn } from "@/lib/utils";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function subtitle(range: DateRange["key"]): string {
  const label =
    range === "today" ? "today" : range === "7d" ? "the last 7 days" : "the last 30 days";
  return `Here's your browsing productivity overview for ${label}.`;
}

function MetricCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 auto-rows-[164px] gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-[164px] animate-pulse rounded-lg bg-muted/70"
          style={{ opacity: 1 - i * 0.15 }}
        />
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [range, setRange] = useState<DateRange["key"]>("today");

  const { from, to } = useMemo(() => dateRange(range), [range]);
  const prev = useMemo(() => {
    const spanMs = new Date(to).getTime() - new Date(from).getTime();
    return {
      from: new Date(new Date(from).getTime() - spanMs).toISOString(),
      to: from,
    };
  }, [from, to]);

  const { data: summary, isPending, isError, refetch } = useActivitySummary(from, to);
  const { data: prevSummary } = useActivitySummary(prev.from, prev.to);

  const loading = isPending || (isError && !summary);
  const failed = Boolean(isError && !summary);

  return (
    <div className="space-y-8">
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            {authLoading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-7 w-64 rounded bg-muted" />
                <div className="h-4 w-72 rounded bg-muted/70" />
              </div>
            ) : (
              <>
                <h1 className="text-[28px] leading-tight font-semibold tracking-tight text-foreground">
                  {greeting()}, {user?.firstName ?? "there"}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {subtitle(range)}
                </p>
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <DateSelector value={range} onChange={setRange} />
            <RangeControl value={range} onChange={setRange} />
          </div>
        </div>

        {loading ? (
          <MetricCardsSkeleton />
        ) : failed ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Unable to load your metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-start gap-3">
                <p className="text-sm text-muted-foreground">
                  Your activity data could not be reached. Check that the API
                  server is running, then try again.
                </p>
                <button
                  type="button"
                  onClick={() => void refetch()}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
                    "outline-none transition-opacity duration-150 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/40"
                  )}
                >
                  Retry
                </button>
              </div>
            </CardContent>
          </Card>
        ) : (
          summary && (
            <MetricCards
              summary={summary}
              prevSummary={prevSummary}
              comparisonLabel={range === "today" ? "vs yesterday" : "vs previous period"}
            />
          )
        )}
      </div>

        <>
          <AnalyticsSection />

          <OverviewSection
            summary={summary}
            loading={loading}
            failed={failed}
            onRetry={() => void refetch()}
          />

          <InfoBanner />
        </>
    </div>
  );
}