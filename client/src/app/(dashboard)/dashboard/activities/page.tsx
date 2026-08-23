"use client";

import { useMemo, useState } from "react";
import { useActivitySummary } from "@/hooks/use-activity-summary";
import { dateRange, type DateRange } from "@/lib/activities";
import {
  RecentSessions,
  TopWebsites,
} from "../components/sections/activity-lists";
import { RangeControl } from "../components/sections/range-control";
import { SectionCard } from "../components/sections/section-card";

export default function ActivitiesPage() {
  const [range, setRange] = useState<DateRange["key"]>("today");
  const { from, to } = useMemo(() => dateRange(range), [range]);
  const { data: summary, isPending, isError, refetch } = useActivitySummary(from, to);

  const loading = isPending || (isError && !summary);
  const failed = Boolean(isError && !summary);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Activities
            </h1>
            <p className="mt-1 text-muted-foreground">
              Review every recorded session in the selected period.
            </p>
          </div>
          <RangeControl value={range} onChange={setRange} />
        </div>
      </div>

      <SectionCard
        title="Sessions"
        loading={loading}
        error={failed}
        errorMessage="Unable to load sessions."
        onRetry={() => void refetch()}
        empty={Boolean(summary && summary.sessions.length === 0)}
        emptyMessage="No sessions recorded in this period."
      >
        {summary && <RecentSessions summary={summary} limit={50} />}
      </SectionCard>

      <SectionCard
        title="Top Websites"
        loading={loading}
        error={failed}
        errorMessage="Unable to load top websites."
        onRetry={() => void refetch()}
        empty={Boolean(summary && summary.topWebsites.length === 0)}
        emptyMessage="No tracked websites in this period."
      >
        {summary && <TopWebsites summary={summary} />}
      </SectionCard>
    </div>
  );
}