"use client";

import { useEffect, useState } from "react";
import { sdk } from "@/lib/sdk";
import { useAuthStore } from "@/store/auth";

/**
 * One shared gate for every Swiggy-connected-only surface (Dinner before
 * doors, Your night, Tonight rail, venues tab). Renders-null contract:
 * callers return null unless `connected === true`.
 *
 * The status fetch is cached at module scope for the page lifetime so five
 * mounted surfaces share ONE request. `resetSwiggyConnectedCache()` exists
 * for the connect/disconnect flows to force a refetch.
 */
const FLAG_ON = process.env.NEXT_PUBLIC_SWIGGY_DINEOUT_ENABLED === "true";

let cached: Promise<boolean> | null = null;

const fetchConnected = (): Promise<boolean> => {
  if (!cached) {
    cached = sdk
      .SwiggyDineoutStatus()
      .then((r) => Boolean(r.swiggyDineoutStatus?.connected))
      .catch(() => {
        // Don't cache a transient failure — a flaky first request must not
        // hide every Swiggy surface until a hard reload. Clear so the next
        // mount retries; this call still resolves false (fail-closed).
        cached = null;
        return false;
      });
  }
  return cached;
};

export const resetSwiggyConnectedCache = (): void => {
  cached = null;
};

export function useSwiggyConnected(): { connected: boolean | null } {
  const profile = useAuthStore((s) => s.profile);
  const hydrated = useAuthStore((s) => s.hydrated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const [connected, setConnected] = useState<boolean | null>(
    FLAG_ON ? null : false
  );

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    if (!FLAG_ON) return;
    if (!hydrated) return;
    if (!profile) {
      setConnected(false);
      return;
    }
    let alive = true;
    fetchConnected().then((v) => {
      if (alive) setConnected(v);
    });
    return () => {
      alive = false;
    };
  }, [hydrated, profile]);

  return { connected };
}
