"use client";

import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as RawPostHogProvider } from "posthog-js/react";
import { Suspense, useEffect, type ReactNode } from "react";

/**
 * PostHog wiring for hoizr-client.
 *
 * - Reads the key + host from `NEXT_PUBLIC_POSTHOG_KEY` /
 *   `NEXT_PUBLIC_POSTHOG_HOST` so we never check the token into source.
 * - Initialises once on the client; SSR is a no-op (typeof window check).
 * - `person_profiles: "identified_only"` keeps anonymous visitor profile
 *   creation off until we call `posthog.identify(...)` for a logged-in
 *   user — keeps the profile count tight while pre-launch traffic is
 *   mostly drive-by.
 * - Captures a `$pageview` whenever the App Router navigates, since
 *   App Router doesn't fire the legacy router-events PostHog used to
 *   hook into.
 */

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

if (typeof window !== "undefined" && POSTHOG_KEY && !posthog.__loaded) {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    defaults: "2026-01-30",
    person_profiles: "identified_only",
    capture_pageview: false, // we trigger it manually from the route hook
  });
}

const PostHogPageView = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || typeof window === "undefined" || !POSTHOG_KEY) return;
    const search = searchParams?.toString();
    const url = search ? `${pathname}?${search}` : pathname;
    posthog.capture("$pageview", { $current_url: window.location.origin + url });
  }, [pathname, searchParams]);

  return null;
};

export const PostHogAnalytics = ({ children }: { children: ReactNode }) => {
  if (!POSTHOG_KEY) {
    // Token not configured (local dev without analytics) — render
    // children without the provider so nothing breaks.
    return <>{children}</>;
  }
  return (
    <RawPostHogProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </RawPostHogProvider>
  );
};
