import { useQuery } from "@tanstack/react-query";
import { fetchActivitySummary } from "@/lib/activities";

/**
 * Activity summary for a time range. New extension data is reflected without a
 * page reload via a short refetch interval and on-window-focus refetches.
 */
export function useActivitySummary(from?: string, to?: string) {
  return useQuery({
    queryKey: ["activity-summary", from ?? "all", to ?? "all"],
    queryFn: () => fetchActivitySummary(from, to),
    enabled: Boolean(from && to),
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
    refetchOnWindowFocus: true,
    placeholderData: (prev) => prev,
  });
}