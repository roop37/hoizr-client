"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Server-side renders give us SEO-ready HTML on first byte (title, OG,
 * JSON-LD, full DOM). But once the page is mounted, a user returning to
 * a stale tab should see live data — a sold-out ticket shouldn't keep
 * showing as available, a deleted event shouldn't keep showing at all.
 *
 * This component triggers `router.refresh()` whenever the tab regains
 * visibility (visibility-change or focus), causing Next.js to re-run
 * the server component and stream a fresh RSC payload. Crawlers don't
 * execute JS so the SEO HTML is unaffected; humans get freshness.
 *
 * Throttled so rapid focus/blur cycles don't hammer the API.
 */
export const FreshnessRevalidate = ({
  minIntervalMs = 30_000,
}: {
  minIntervalMs?: number;
}) => {
  const router = useRouter();
  const lastRefreshAt = useRef<number>(Date.now());

  useEffect(() => {
    const maybeRefresh = () => {
      const now = Date.now();
      if (now - lastRefreshAt.current < minIntervalMs) return;
      lastRefreshAt.current = now;
      router.refresh();
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") maybeRefresh();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", maybeRefresh);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", maybeRefresh);
    };
  }, [router, minIntervalMs]);

  return null;
};
