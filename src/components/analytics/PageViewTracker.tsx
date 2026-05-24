"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { trackPageView } from "@/lib/tracker";

/**
 * Drop into the root layout to auto-fire a `pageView` analytics event
 * on every App Router navigation. Reads the path + query through the
 * Next hooks so SPA-style transitions are captured (not just hard
 * navigations).
 *
 * Sits inside <body> as a client component; doesn't render anything.
 */
export const PageViewTracker = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Track the last URL we fired for so a noop `searchParams` update
  // doesn't generate duplicate page-view rows in Mongo.
  const lastUrlRef = useRef<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const qs = searchParams?.toString() ?? "";
    const url = qs ? `${pathname}?${qs}` : pathname;
    if (url === lastUrlRef.current) return;
    lastUrlRef.current = url;
    trackPageView();
  }, [pathname, searchParams]);

  return null;
};
