// Shared Google Maps deep-link builder. Mirrors the event-detail
// `mapOpenInGoogleHref` convention: a `query` (free-text address) opens a
// Maps search, and when a Google `placeId` is known we pin the exact place
// with `query_place_id` so the marker lands on the venue, not a fuzzy
// geocode. We deliberately do NOT use stored lat/lng coordinates — the
// codebase has a [lat,lng] vs [lng,lat] ordering inconsistency that risks a
// wrong pin.
export const mapsSearchHref = (
  query?: string | null,
  placeId?: string | null
): string | null => {
  const q = query?.trim();
  if (!q) return null;
  const base = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    q
  )}`;
  return placeId ? `${base}&query_place_id=${encodeURIComponent(placeId)}` : base;
};
