"use client";

import type { ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  title: string;
  className?: string;
  action?: ReactNode;
  loading?: boolean;
  error?: boolean;
  errorMessage?: string;
  empty?: boolean;
  emptyMessage?: ReactNode;
  onRetry?: () => void;
  children: ReactNode;
}

/**
 * Shared section shell. Keeps loading / error / empty rendering localized to a
 * single section so one failing API call never blanks the whole dashboard.
 */
export function SectionCard({
  title,
  className,
  action,
  loading,
  error,
  errorMessage = "Unable to load data.",
  empty,
  emptyMessage = "Nothing recorded in this period.",
  onRetry,
  children,
}: SectionCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-[11px] font-medium tracking-[0.09em] text-muted-foreground uppercase">
          {title}
        </CardTitle>
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent>
        {loading ? (
          <SectionSkeleton />
        ) : error ? (
          <div className="flex flex-col items-start gap-3 py-2">
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </button>
            )}
          </div>
        ) : empty ? (
          <p className="py-2 text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

export function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 py-1">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-10 animate-pulse rounded-lg bg-muted/70"
          style={{ opacity: 1 - i * 0.18 }}
        />
      ))}
    </div>
  );
}

export function kindBadgeClass(kind: "focus" | "neutral" | "distract"): string {
  return cn(
    "inline-flex items-center gap-1.5 text-xs font-medium",
    kind === "focus"
      ? "text-success"
      : kind === "distract"
        ? "text-error"
        : "text-warning"
  );
}

export function KindDot({
  kind,
  className,
}: {
  kind: "focus" | "neutral" | "distract";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "h-1.5 w-1.5 rounded-full",
        kind === "focus"
          ? "bg-success"
          : kind === "distract"
            ? "bg-error"
            : "bg-warning",
        className
      )}
      aria-hidden
    />
  );
}