/**
 * Shared Dineout client helpers. No new deps — IST formatting uses the native
 * Intl API (repo convention: all display in Asia/Kolkata).
 */

import { gqlRequest } from "@/lib/graphql";
import { ACTIVE_CITIES_WITH_COORDS_QUERY } from "@/lib/queries";

/** Format a Swiggy reservationTime (epoch SECONDS) for display in IST. */
export function formatIST(epochSeconds?: number | null): string {
  if (!epochSeconds) return "";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(epochSeconds * 1000));
}

/** Format a Date (from our DineoutBooking record) in IST. */
export function formatDateIST(d?: string | Date | null): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

// GeoJSON [lng,lat] → {lat,lng} is handled by the repo's coordToLatLng
// (src/lib/geo.ts); DineNearbyLink takes already-resolved lat/lng, so no
// duplicate swap helper lives here.

/** Docs-provided city coordinates for a simple location picker (dev). */
export const DINEOUT_CITY_PRESETS: { label: string; lat: number; lng: number }[] = [
  { label: "Bangalore", lat: 12.9716, lng: 77.5946 },
  { label: "Koramangala", lat: 12.9352, lng: 77.6245 },
  { label: "Indiranagar", lat: 12.9784, lng: 77.6408 },
  { label: "Mumbai", lat: 19.076, lng: 72.8777 },
  { label: "Delhi", lat: 28.6139, lng: 77.209 },
];

/** entityType options surfaced in the search UI (Swiggy's own casing). */
export const DINEOUT_ENTITY_TYPES: { label: string; value: string }[] = [
  { label: "Restaurant name", value: "" },
  { label: "Cuisine", value: "CUISINE" },
  { label: "Locality / area", value: "locality" },
  { label: "Category (cafe, pub, bar…)", value: "RESTAURANT_CATEGORY" },
];

/** Today's calendar date in IST, YYYY-MM-DD (matches the date-chip values). */
export function todayIST(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(
    new Date()
  );
}

/** ISO date-time → IST calendar date (YYYY-MM-DD); null-safe. */
export function isoToISTDate(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);
}

/**
 * "Fits before doors": a dinner slot works when the table time plus a
 * comfortable meal leaves you at the venue by doors-open.
 * ponytail: fixed 90-min meal heuristic; make it per-venue if data ever asks.
 */
export const DINNER_BEFORE_DOORS_MIN = 90;

export function fitsBeforeDoors(
  slotEpochSec?: number | null,
  doorsAtEpochSec?: number | null
): boolean {
  if (!slotEpochSec || !doorsAtEpochSec) return false;
  return slotEpochSec + DINNER_BEFORE_DOORS_MIN * 60 <= doorsAtEpochSec;
}

/**
 * Selected Hoizr city → coordinates. Masters cities carry lat/lng; fall back
 * to the dineout presets, then Bangalore. (Moved here from SwiggyVenuesGrid
 * so the Tonight rail shares it.)
 */
type ActiveCityRow = {
  city?: string | null;
  value?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export async function resolveCityCoords(
  city?: string
): Promise<{ lat: number; lng: number }> {
  const fallback = () => {
    const preset = DINEOUT_CITY_PRESETS.find(
      (p) => city && p.label.toLowerCase() === city.toLowerCase()
    );
    return preset
      ? { lat: preset.lat, lng: preset.lng }
      : { lat: DINEOUT_CITY_PRESETS[0].lat, lng: DINEOUT_CITY_PRESETS[0].lng };
  };
  if (!city) return fallback();
  try {
    const data = await gqlRequest<{ getActiveIndianCities: ActiveCityRow[] }>(
      ACTIVE_CITIES_WITH_COORDS_QUERY
    );
    const match = (data.getActiveIndianCities ?? []).find(
      (c) =>
        (c.city ?? c.value ?? "").toLowerCase() === city.toLowerCase() &&
        c.latitude != null &&
        c.longitude != null
    );
    return match ? { lat: match.latitude!, lng: match.longitude! } : fallback();
  } catch {
    return fallback();
  }
}
