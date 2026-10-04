"use client";

import { useEffect, useState } from "react";
import { sdk } from "@/lib/sdk";
import { useUIStore } from "@/store/uiStore";
import { useSwiggyConnected } from "@/lib/use-swiggy-connected";
import { resolveCityCoords } from "@/lib/dineout";
import { DineoutRestaurantCard } from "./DineoutRestaurantCard";
import { RailHead } from "@/components/hoizr-ui/RailHead";
import { PoweredBySwiggy } from "./PoweredBySwiggy";
import type { DineoutRestaurantFieldsFragment } from "@/generated/graphql";

/**
 * "Reserve a table nearby" rail for the home/live pages. Swiggy-connected
 * customers only; served from the SHARED city-level Redis cache server-side
 * so a homepage view never burns the customer's per-user Swiggy rate budget.
 * Renders nothing (no skeleton, no error) unless it has real cards — a home
 * rail must never break the page.
 */
export function DineoutTonightRail() {
  const { connected } = useSwiggyConnected();
  const city = useUIStore((s) => s.city);
  const [cards, setCards] = useState<DineoutRestaurantFieldsFragment[] | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (connected !== true) return;
    let alive = true;
    // Clear last city's cards so a slow/failed new-city fetch can't leave the
    // previous city's restaurants paired with the new city's coords (a click
    // would deep-link an old restaurantId against new lat/lng).
    setCards(null);
    (async () => {
      try {
        const c = await resolveCityCoords(city || undefined);
        if (!alive) return;
        setCoords(c);
        const r = await sdk.DineoutTonightRail({
          input: { city: city || "default", latitude: c.lat, longitude: c.lng },
        });
        if (!alive) return;
        const res = r.dineoutTonightRail;
        if (res.needsSwiggyAuth || res.error) return; // silent — home rail never errors
        setCards(res.restaurants);
      } catch {
        /* silent */
      }
    })();
    return () => {
      alive = false;
    };
  }, [connected, city]);

  if (connected !== true || !cards || cards.length === 0 || !coords) return null;

  return (
    <div className="h-rail-sec">
      <div className="flex items-center justify-between">
        <RailHead title="Reserve a table nearby" seeAllHref="/venues" />
        <PoweredBySwiggy />
      </div>
      <div className="h-rail">
        {cards.map((r) => (
          <DineoutRestaurantCard
            key={r.restaurantId}
            restaurant={r}
            lat={coords.lat}
            lng={coords.lng}
          />
        ))}
      </div>
    </div>
  );
}
