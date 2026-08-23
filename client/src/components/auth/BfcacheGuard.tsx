"use client";

import { useEffect } from "react";

/**
 * Prevents stale-route bugs caused by Chrome's Back-Forward Cache (BFCache).
 *
 * When a user navigates Back to an auth page that was cached, the page is
 * restored with its JS still running, which breaks Clerk flows (OAuth
 * navigation is silently dropped, attempts go stale). Reloading on restore
 * gives the page a clean, fresh start.
 */
export default function BfcacheGuard() {
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        window.location.reload();
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  return null;
}