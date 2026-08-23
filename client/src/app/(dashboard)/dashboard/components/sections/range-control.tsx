"use client";

import { dateRange, type DateRange } from "@/lib/activities";
import { cn } from "@/lib/utils";

export const RANGES: DateRange["key"][] = ["today", "7d", "30d"];

export function RangeControl({
  value,
  onChange,
}: {
  value: DateRange["key"];
  onChange: (key: DateRange["key"]) => void;
}) {
  return (
    <div className="flex h-10 items-center gap-0.5 rounded-lg bg-muted p-1">
      {RANGES.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={cn(
            "h-full flex-1 whitespace-nowrap rounded-md px-2.5 text-[13px] font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring/40",
            value === key
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {dateRange(key).label}
        </button>
      ))}
    </div>
  );
}