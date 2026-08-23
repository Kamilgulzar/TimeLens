import { useQuery } from "@tanstack/react-query";
import { fetchExtensionStatus } from "@/lib/extension";

/**
 * Polls the extension's live status so the dashboard reflects the real
 * connection state (heartbeat, last sync) without a page reload.
 */
export function useExtensionStatus() {
  return useQuery({
    queryKey: ["extension-status"],
    queryFn: fetchExtensionStatus,
    staleTime: 5 * 1000,
    refetchInterval: 10 * 1000,
    refetchOnWindowFocus: true,
    retry: 1,
    placeholderData: (prev) => prev,
  });
}