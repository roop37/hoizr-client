"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { sdk } from "@/lib/sdk";
import type { DineoutRestaurantFieldsFragment } from "@/generated/graphql";
import {
  DINEOUT_CITY_PRESETS,
  DINEOUT_ENTITY_TYPES,
} from "@/lib/dineout";

type Coords = { lat: number; lng: number; label: string };

export function DineoutSearch({
  initialLat,
  initialLng,
  deepLinkParams = "",
  onNeedsAuth,
}: {
  initialLat?: number;
  initialLng?: number;
  /** Extra querystring (e.g. `&date=...&doorsAt=...`) forwarded to restaurant links. */
  deepLinkParams?: string;
  onNeedsAuth: () => void;
}) {
  const seeded =
    initialLat !== undefined && initialLng !== undefined
      ? { lat: initialLat, lng: initialLng, label: "Near the venue" }
      : DINEOUT_CITY_PRESETS[0];
  const [coords, setCoords] = useState<Coords>(seeded);
  const [query, setQuery] = useState("");
  const [entityType, setEntityType] = useState("");
  const [results, setResults] = useState<DineoutRestaurantFieldsFragment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const runSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const r = await sdk.SearchDineoutRestaurants({
        input: {
          query: query.trim(),
          entityType: entityType || undefined,
          latitude: coords.lat,
          longitude: coords.lng,
        },
      });
      const res = r.searchDineoutRestaurants;
      if (res.needsSwiggyAuth) return onNeedsAuth();
      if (res.error) {
        setError(res.error);
        setResults([]);
        return;
      }
      setResults(res.restaurants);
    } catch {
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="h-evt-sort">
          <select
            aria-label="Search area"
            value={coords.label}
            onChange={(e) => {
              const p = DINEOUT_CITY_PRESETS.find((c) => c.label === e.target.value);
              if (p) setCoords(p);
            }}
          >
            {seeded.label === "Near the venue" && (
              <option value="Near the venue">Near the venue</option>
            )}
            {DINEOUT_CITY_PRESETS.map((c) => (
              <option key={c.label} value={c.label}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="h-evt-sort">
          <select
            aria-label="Place type"
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
          >
            {DINEOUT_ENTITY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

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
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
            placeholder="rooftop, italian, Social…"
          />
        </label>
        <button
          onClick={runSearch}
          disabled={loading || !query.trim()}
          className="h-btn h-btn-accent disabled:opacity-50"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </div>

      {error && <p className="text-sm text-rose-300">{error}</p>}

      {results && results.length === 0 && !error && (
        <div className="h-empty">No restaurants found.</div>
      )}

      <ul className="space-y-2">
        {results?.map((r) => (
          <li key={r.restaurantId}>
            <Link
              href={`/dineout/restaurant/${encodeURIComponent(r.restaurantId)}?lat=${coords.lat}&lng=${coords.lng}&name=${encodeURIComponent(r.name ?? "")}${deepLinkParams}`}
              className="h-glass-card block p-3 transition hover:border-white/20"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-[var(--h-ink)]">{r.name ?? "Restaurant"}</span>
                {r.rating != null && (
                  <span className="flex-none text-sm text-[var(--h-accent)]">
                    ★ {r.rating}
                    {r.ratingCount ? ` (${r.ratingCount})` : ""}
                  </span>
                )}
              </div>
              <div className="text-xs text-[var(--h-ink-3)]">
                {[r.cuisines?.join(", "), r.costForTwo, r.distance]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
              {r.offers && r.offers.length > 0 && (
                <div className="mt-1 text-xs text-[var(--h-ink-2)]">
                  {r.offers.slice(0, 2).join(" · ")}
                </div>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
