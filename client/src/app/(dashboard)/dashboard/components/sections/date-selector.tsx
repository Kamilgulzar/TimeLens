"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { dateRange, type DateRange } from "@/lib/activities";
import { cn } from "@/lib/utils";
import { RANGES } from "./range-control";

/**
 * Compact date display that mirrors the reference dashboard. Shows the end
 * date of the current range and doubles as a small range picker, keeping the
 * chevron honest without adding a full date-picker dependency.
 */
export function DateSelector({
  value,
  onChange,
}: {
  value: DateRange["key"];
  onChange: (key: DateRange["key"]) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const range = dateRange(value);

  const dateText = (() => {
    const end = new Date(range.to);
    if (value === "today") {
      return end.toLocaleDateString([], {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
    const start = new Date(range.from);
    const sameMonth =
      start.getMonth() === end.getMonth() &&
      start.getFullYear() === end.getFullYear();
    const endText = end.toLocaleDateString([], {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    if (sameMonth) {
      const monthYear = end.toLocaleDateString([], {
        month: "short",
        year: "numeric",
      });
      return `${start.getDate()} – ${end.getDate()} ${monthYear}`;
    }
    const startText = start.toLocaleDateString([], {
      day: "numeric",
      month: "short",
    });
    return `${startText} – ${endText}`;
  })();

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-10 w-auto min-w-[152px] items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 text-[13px] font-medium text-foreground outline-none transition-colors duration-150 hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <span className="flex min-w-0 items-center gap-2">
          <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="whitespace-nowrap tabular-nums">{dateText}</span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-20 w-[168px] rounded-lg border border-border bg-popover p-1 shadow-sm">
          {RANGES.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                onChange(key);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center rounded-md px-2.5 py-1.5 text-left text-[13px] outline-none transition-colors duration-150 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40",
                key === value
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {dateRange(key).label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
