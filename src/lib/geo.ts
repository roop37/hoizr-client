/**
 * Geo helpers for the "N km away" event badge.
 *
 * Distance uses the Haversine formula on a spherical-Earth model
 * (radius 6371 km). Indian cities are well within the regime where
 * this is accurate to within a few percent — good enough for a UI
 * badge whose only job is to give the user a sense of proximity.
 *
 * Both endpoints are optional: callers pass user coords and event
 * coords; if either side is missing or the lat/lng pair is invalid,
 * `kmBetween` returns `null` so the caller can skip the badge.
 */

const R_KM = 6371;

const isFiniteNumber = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n);

const toRad = (deg: number) => (deg * Math.PI) / 180;

export type LatLng = { lat: number; lng: number };

export const isLatLng = (v: unknown): v is LatLng => {
  if (!v || typeof v !== "object") return false;
  const r = v as Partial<LatLng>;
  return isFiniteNumber(r.lat) && isFiniteNumber(r.lng);
};

/**
 * Unpack the GeoJSON CoordinatePoint shape returned by hoizr-shared
 * (`{type, coordinates: [lng, lat]}`) into `{lat, lng}` used by the
 * rest of the client. Returns `null` if the input is missing, the
 * order is wrong, or either value isn't finite — never throws.
 */
export const coordToLatLng = (
  point:
    | { type?: string | null; coordinates?: number[] | null }
    | null
    | undefined
): LatLng | null => {
  const coords = point?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) return null;
  const [lng, lat] = coords;
  if (!isFiniteNumber(lat) || !isFiniteNumber(lng)) return null;
  return { lat, lng };
};

export const kmBetween = (
  a: Partial<LatLng> | null | undefined,
  b: Partial<LatLng> | null | undefined
): number | null => {
  if (!isLatLng(a) || !isLatLng(b)) return null;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  return R_KM * c;
};

/**
 * Format a km distance for the event-card badge. Under 10 km we keep
 * one decimal place (2.6 km feels meaningful at that scale); past 10
 * we round to whole km because the half-km precision stops mattering.
 * Returns `null` if the distance is null/NaN.
 */
export const formatKmBadge = (km: number | null): string | null => {
  if (km == null || !Number.isFinite(km)) return null;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
};

/**
 * Case-insensitive trimmed city compare. Two strings count as the same
 * city when one fully equals (after lowercasing) the trimmed form of
 * the other — covers "Bengaluru" vs "bengaluru" vs " Bengaluru ".
 */
export const sameCity = (
  a?: string | null,
  b?: string | null
): boolean => {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
};
