"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { gqlRequest } from "@/lib/graphql";
import { sdk } from "@/lib/sdk";
import { useAuthStore } from "@/store/auth";
import { useUIStore } from "@/store/uiStore";
import { SwiggyVenuesGrid } from "@/components/dineout/SwiggyVenuesGrid";
import {
  GET_PUBLIC_VENUES_QUERY,
  type PublicVenue,
  type PublicVenuePage,
} from "@/lib/venue-queries";

const SWIGGY_ON = process.env.NEXT_PUBLIC_SWIGGY_DINEOUT_ENABLED === "true";

const cityOf = (v: PublicVenue): string =>
  v.address?.city || v.address?.formattedAddress || "";

export function VenuesListClient() {
  const [venues, setVenues] = useState<PublicVenue[]>([]);
  const [loading, setLoading] = useState(true);

  // Swiggy branch: when the signed-in customer has Swiggy connected, the page
  // defaults to reservable Dineout venues (city-aware); a tab flips back to
  // Hoizr's own rooms. Signed-out / unconnected users see the Hoizr grid.
  const profile = useAuthStore((s) => s.profile);
  const hydrated = useAuthStore((s) => s.hydrated);
  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const city = useUIStore((s) => s.city);
  const [swiggyConnected, setSwiggyConnected] = useState<boolean | null>(null);
  const [tab, setTab] = useState<"dineout" | "hoizr">("dineout");

  useEffect(() => {
    if (!hydrated) hydrateAuth();
  }, [hydrated, hydrateAuth]);

  useEffect(() => {
    if (!SWIGGY_ON || !hydrated || !profile) {
      if (hydrated && !profile) setSwiggyConnected(false);
      return;
    }
    sdk
      .SwiggyDineoutStatus()
      .then((r) => setSwiggyConnected(Boolean(r.swiggyDineoutStatus?.connected)))
      .catch(() => setSwiggyConnected(false));
  }, [hydrated, profile]);

  useEffect(() => {
    (async () => {
      try {
        const data = await gqlRequest<{ getPublicVenues: PublicVenuePage }>(
          GET_PUBLIC_VENUES_QUERY,
          { input: { page: 1, pageSize: 48 } }
        );
        setVenues(data.getPublicVenues?.venues ?? []);
      } catch (err) {
        console.error("Failed to load venues", err);
        setVenues([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const showSwiggy = SWIGGY_ON && swiggyConnected === true;

  // City-aware Hoizr list: filter to the selected city when it matches at
  // least one venue; otherwise show everything (a tiny catalog shouldn't
  // vanish behind a city with no venues yet).
  const cityVenues = city
    ? venues.filter((v) => cityOf(v).toLowerCase().includes(city.toLowerCase()))
    : venues;
  const visibleVenues = cityVenues.length > 0 ? cityVenues : venues;

  const tabs = showSwiggy ? (
    <div className="mb-4 flex gap-2">
      {(
        [
          ["dineout", "Reserve a table"],
          ["hoizr", "Hoizr venues"],
        ] as const
      ).map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => setTab(key)}
          className={`h-chip ${tab === key ? "active" : ""}`}
        >
          {label}
        </button>
      ))}
    </div>
  ) : null;

  if (showSwiggy && tab === "dineout") {
    return (
      <>
        {tabs}
        <SwiggyVenuesGrid city={city || undefined} />
      </>
    );
  }

  if (loading) {
    return (
      <div className="h-evt-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-tile animate-pulse">
            <div className="h-tile-flyer" />
            <div className="h-tile-info" />
          </div>
        ))}
      </div>
    );
  }

  if (venues.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
        <p className="text-white/70">
          No venues are live yet — we&rsquo;re onboarding the rooms behind the
          nights. Check back soon.
        </p>
        <Link
          href="/events"
          className="mt-4 inline-flex h-10 items-center rounded-xl bg-[#c5ff3d] px-4 text-sm font-semibold text-[#0a0a0e]"
        >
          Browse live events
        </Link>
      </div>
    );
  }

  return (
    <>
      {tabs}
      {/* Same grid + tile as the events listing (`.h-evt-grid` / `.h-tile`):
          every venue gets an identical 3:4 cover frame and info footer, so
          rows are uniform and the page scans in one rhythm. */}
      <div className="h-evt-grid">
        {visibleVenues.map((v) => {
          const cover = (v.gallery ?? []).filter(Boolean)[0] || v.logo || null;
          const meta =
            [v.venueType, cityOf(v)].filter(Boolean).join(" · ") || "Venue";
          return (
            <Link key={v._id} href={`/venues/${v._id}`} className="h-tile">
              <div className="h-tile-flyer">
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cover}
                    alt={v.name ?? "Venue"}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="h-tile-flyer-fallback flex items-center justify-center bg-gradient-to-br from-white/10 to-white/[0.02] text-4xl font-bold text-white/25">
                    {(v.name ?? "V").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="h-tile-info">
                <h3 className="h-tile-title">{v.name ?? "Venue"}</h3>
                <p className="h-tile-venue">{meta}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}

export default VenuesListClient;
