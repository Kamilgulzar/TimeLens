import Link from "next/link";
import { ArrowUpRight, Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Product-information banner: TimeLens currently only tracks browsing activity
 * through the browser extension. Desktop/app tracking is not implemented yet,
 * so the copy stays accurate to the MVP.
 */
export function InfoBanner() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card px-5 py-3.5 sm:flex-row sm:items-center sm:gap-6 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_2px_8px_rgba(0,0,0,0.35)]">
      <div className="flex flex-1 items-start gap-3.5 min-w-0 sm:items-center sm:gap-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-primary outline-none">
          <Info className="h-7 w-7" strokeWidth={1.75} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] leading-snug font-semibold tracking-tight text-foreground">
            You&apos;re seeing browsing activity only.
          </p>
          <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">
            Install the TimeLens desktop app to track applications and get deeper productivity
            insights.
          </p>
        </div>
      </div>

      <Link
        href="/dashboard/extension"
        className="group flex shrink-0 items-center gap-1 whitespace-nowrap text-[13.5px] font-medium text-primary outline-none transition-opacity duration-150 hover:opacity-85 focus-visible:ring-2 focus-visible:ring-ring/40 rounded"
      >
        Learn more about TimeLens
        <ArrowUpRight
          className={cn("h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-px group-hover:-translate-y-px")}
          strokeWidth={2}
          aria-hidden
        />
      </Link>
    </div>
  );
}