"use client";

import { useMemo, useState } from "react";
import { useActivitySummary } from "@/hooks/use-activity-summary";
import { dateRange, type DateRange } from "@/lib/activities";
import { ActivityTimeline } from "../components/sections/activity-timeline";
import { RangeControl } from "../components/sections/range-control";
import { SectionCard } from "../components/sections/section-card";

export default function TimelinePage() {
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
              Timeline
            </h1>
            <p className="mt-1 text-muted-foreground">
              Your time, mapped chronologically from the same tracked activity.
            </p>
          </div>
          <RangeControl value={range} onChange={setRange} />
        </div>
      </div>

      <SectionCard
        title="Activity Timeline"
        loading={loading}
        error={failed}
        errorMessage="Unable to load the timeline."
        onRetry={() => void refetch()}
        empty={Boolean(summary && summary.sessions.length === 0)}
        emptyMessage="No activity recorded in this period."
      >
        {summary && <ActivityTimeline sessions={summary.sessions} withDay />}
      </SectionCard>
    </div>
  );
}