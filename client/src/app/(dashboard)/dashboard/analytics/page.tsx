"use client";

import { useMemo, useState } from "react";
import { useActivitySummary } from "@/hooks/use-activity-summary";
import { dateRange, type DateRange } from "@/lib/activities";
import { FocusChart } from "../components/sections/activity-chart";
import { Categories } from "../components/sections/activity-lists";
import { RangeControl } from "../components/sections/range-control";
import { SectionCard } from "../components/sections/section-card";

export default function AnalyticsPage() {
  const [range, setRange] = useState<DateRange["key"]>("7d");
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
              Analytics
            </h1>
            <p className="mt-1 text-muted-foreground">
              Patterns and productivity trends over time.
            </p>
          </div>
          <RangeControl value={range} onChange={setRange} />
        </div>
      </div>

      <SectionCard
        title="Focus Time Overview"
        loading={loading}
        error={failed}
        errorMessage="Unable to load activity data."
        onRetry={() => void refetch()}
        empty={Boolean(summary && summary.series.every((p) => p.total === 0))}
        emptyMessage="No tracked time to chart in this period."
      >
        {summary && <FocusChart summary={summary} />}
      </SectionCard>

      <SectionCard
        title="By Category"
        loading={loading}
        error={failed}
        errorMessage="Unable to load category breakdown."
        onRetry={() => void refetch()}
        empty={Boolean(summary && summary.byCategory.length === 0)}
        emptyMessage="Nothing recorded in this period."
      >
        {summary && <Categories summary={summary} />}
      </SectionCard>
    </div>
  );
}