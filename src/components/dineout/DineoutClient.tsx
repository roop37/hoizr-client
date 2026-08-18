"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { sdk } from "@/lib/sdk";
import { useAuthStore } from "@/store/auth";
import { useUIStore } from "@/store/uiStore";
import { resetSwiggyConnectedCache } from "@/lib/use-swiggy-connected";
import { PoweredBySwiggy } from "./PoweredBySwiggy";
import { ConnectSwiggyButton } from "./ConnectSwiggyButton";
import { DineoutSearch } from "./DineoutSearch";
import { YourNight } from "./YourNight";

export function DineoutClient() {
  // Hoizr sign-in gate (guestlist idiom): a logged-out customer gets the
  // SignInModal instead of a raw 401 from /auth/swiggy/start.
  const profile = useAuthStore((s) => s.profile);
  const hydrated = useAuthStore((s) => s.hydrated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const openSignIn = useUIStore((s) => s.openSignIn);

  const [connected, setConnected] = useState<boolean | null>(null);
  // The OAuth callback bounces back to /dineout?swiggy=connected|denied|error.
  // "connected" is confirmed by the status query below; surface the failure
  // outcomes so a cancelled/failed handshake doesn't look like a no-op.
  const params = useSearchParams();
  const outcome = params.get("swiggy");
  // Optional seeded coords from a venue/event "Dineout near here" deep-link.
  const seedLat = params.get("lat");
  const seedLng = params.get("lng");
  // Optional doors-aware deep-link (Dinner before doors / DineNearbyLink).
  const seedDate = params.get("date");
  const seedDoorsAt = params.get("doorsAt");

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  // Fetch Swiggy status only once we know a customer is signed in (also
  // re-runs right after the SignInModal completes and profile lands).
  useEffect(() => {
    if (!hydrated || !profile) return;
    sdk
      .SwiggyDineoutStatus()
      .then((r) => setConnected(Boolean(r.swiggyDineoutStatus?.connected)))
      .catch(() => setConnected(false));
  }, [hydrated, profile]);

  const disconnect = async () => {
    await sdk.DisconnectSwiggy();
    setConnected(false);
    // Invalidate the shared connected-status cache so other surfaces
    // (Your night, Dinner-before-doors, the Tonight rail) don't keep showing
    // for a just-disconnected customer until a hard reload.
    resetSwiggyConnectedCache();
  };

  return (
    <div className="h-page">
      <div className="h-page-head">
        <div>
          <div className="label">Reserve a table</div>
          <h1>Dineout</h1>
          <p
            style={{
              color: "var(--h-ink-2)",
              maxWidth: "52ch",
              margin: "10px 0 0",
              fontSize: 14,
            }}
          >
            Discover restaurants and lock in a free table — before doors, after
            the set, or any night out.
          </p>
        </div>
        <div className="right">
          <PoweredBySwiggy />
        </div>
      </div>

      <div className="max-w-2xl space-y-6">
      {(outcome === "denied" || outcome === "error") && connected !== true && (
        <p className="text-sm text-rose-300">
          {outcome === "denied"
            ? "Swiggy connection was cancelled. You can try again."
            : "Couldn't connect to Swiggy. Please try again."}
        </p>
      )}

      {!hydrated && <p className="text-sm text-white/55">Loading…</p>}

      {hydrated && !profile && (
        <div className="h-glass-card space-y-3 p-5">
          <p className="text-sm text-[var(--h-ink-2)]">
            Sign in to Hoizr to discover restaurants and reserve a free table.
          </p>
          <button
            type="button"
            onClick={() => openSignIn()}
            className="h-btn h-btn-accent"
          >
            Sign in to continue
          </button>
        </div>
      )}

      {hydrated && profile && connected === null && (
        <p className="text-sm text-white/55">Loading…</p>
      )}

      {hydrated && profile && connected === false && (
        <div className="h-glass-card space-y-3 p-5">
          <p className="text-sm text-[var(--h-ink-2)]">
            Connect your Swiggy account to discover restaurants and reserve a
            free table.
          </p>
          <ConnectSwiggyButton />
        </div>
      )}

      {hydrated && profile && connected === true && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Link href="/dineout/bookings" className="text-sm text-white/80 underline decoration-white/30 underline-offset-2 hover:text-[#c5ff3d]">
              My reservations
            </Link>
            <button onClick={disconnect} className="text-sm text-white/55 underline decoration-white/30 underline-offset-2 hover:text-white">
              Disconnect Swiggy
            </button>
          </div>
          <YourNight />
          <DineoutSearch
            initialLat={seedLat ? Number(seedLat) : undefined}
            initialLng={seedLng ? Number(seedLng) : undefined}
            deepLinkParams={
              seedDate
                ? `&date=${seedDate}${seedDoorsAt ? `&doorsAt=${seedDoorsAt}` : ""}`
                : ""
            }
            onNeedsAuth={() => setConnected(false)}
          />
        </div>
      )}
      </div>
    </div>
  );
}
