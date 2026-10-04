"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { sdk } from "@/lib/sdk";
import type { DineoutRestaurantFieldsFragment } from "@/generated/graphql";
import { resolveCityCoords } from "@/lib/dineout";
import { DineoutRestaurantCard } from "./DineoutRestaurantCard";
import { PoweredBySwiggy } from "./PoweredBySwiggy";

/**
 * Swiggy Dineout view for the /venues page (dark theme, #c5ff3d accents to
 * match the venue bento). Nightlife-first quick filters — Hoizr's crowd wants
 * pubs/bars/rooftops, not buffets. Search results carry NO images (Swiggy's
 * search tool is text-only; photos exist on details), so these are typographic
 * cards; the detail page shows the masthead photos.
 */

// entityType per Swiggy agent guidance: RESTAURANT_CATEGORY for venue kinds,
// omit for free-text/descriptive searches like "rooftop".
const NIGHT_FILTERS: { label: string; query: string; entityType?: string }[] = [
  { label: "🍺 Pubs", query: "pub", entityType: "RESTAURANT_CATEGORY" },
  { label: "🍸 Bars", query: "bar", entityType: "RESTAURANT_CATEGORY" },
  { label: "🍻 Breweries", query: "brewery", entityType: "RESTAURANT_CATEGORY" },
  { label: "🛋 Lounges", query: "lounge", entityType: "RESTAURANT_CATEGORY" },
  { label: "🪩 Clubs", query: "club", entityType: "RESTAURANT_CATEGORY" },
  { label: "🌃 Rooftop", query: "rooftop" },
  { label: "☕ Cafes", query: "cafe", entityType: "RESTAURANT_CATEGORY" },
];

type CityCoords = { lat: number; lng: number };

export function SwiggyVenuesGrid({ city }: { city?: string }) {
  const [coords, setCoords] = useState<CityCoords | null>(null);
  const [filter, setFilter] = useState(NIGHT_FILTERS[0]);
  const [customQuery, setCustomQuery] = useState("");
  const [results, setResults] = useState<DineoutRestaurantFieldsFragment[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);

  // Resolve the selected Hoizr city to coordinates: masters (active cities
  // carry lat/lng) → dineout presets → Bangalore.
  useEffect(() => {
    resolveCityCoords(city).then(setCoords);
  }, [city]);

  // Run the active filter (or custom search) whenever coords/filter change.
  useEffect(() => {
    if (!coords) return;
    const q = customQuery.trim() || filter.query;
    const entityType = customQuery.trim() ? undefined : filter.entityType;
    setLoading(true);
    setError(null);
    sdk
      .SearchDineoutRestaurants({
        input: { query: q, entityType, latitude: coords.lat, longitude: coords.lng },
      })
      .then((r) => {
        const res = r.searchDineoutRestaurants;
        if (res.needsSwiggyAuth) return setNeedsAuth(true);
        if (res.error) {
          setError(res.error);
          setResults([]);
          return;
        }
        setResults(res.restaurants);
      })
      .catch(() => setError("Search failed. Please try again."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords, filter]);

  const runCustom = () => {
    // Re-trigger the search effect by resetting the filter object identity.
    setFilter((f) => ({ ...f }));
  };

  if (needsAuth) {
    return (
      <div className="h-glass-card p-8 text-center">
        <p className="text-[var(--h-ink-2)]">
          Your Swiggy connection expired — reconnect on the Dineout page.
        </p>
        <Link href="/dineout" className="h-btn h-btn-accent mt-4">
          Reconnect Swiggy
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--h-ink-2)]">
          Reservable tables{city ? ` in ${city}` : ""} — book free, tonight.
        </p>
        <PoweredBySwiggy />
      </div>

      {/* Nightlife quick filters */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {NIGHT_FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            onClick={() => {
              setCustomQuery("");
              setFilter(f);
            }}
            className={`h-chip flex-none ${
              filter.label === f.label && !customQuery.trim() ? "active" : ""
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Free-text search (vibe / cuisine / name) */}
      <div className="flex gap-2">
        <label className="h-evt-search">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runCustom()}
            placeholder="Vibe, cuisine or name — 'italian', 'Social'…"
          />
        </label>
        <button type="button" onClick={runCustom} className="h-btn h-btn-accent">
          Search
        </button>
      </div>

      {error && <p className="text-sm text-rose-300">{error}</p>}

      {loading && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-white/5 bg-white/5" />
          ))}
        </div>
      )}

      {!loading && results && results.length === 0 && !error && (
        <div className="h-empty">
          Nothing bookable for that filter here — try another vibe.
        </div>
      )}

      {!loading && results && results.length > 0 && coords && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {results.map((r) => (
            <DineoutRestaurantCard
              key={r.restaurantId}
              restaurant={r}
              lat={coords.lat}
              lng={coords.lng}
            />
          ))}
        </div>
      )}
    </div>
  );
}
