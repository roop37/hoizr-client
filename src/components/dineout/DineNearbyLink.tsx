import Link from "next/link";

/**
 * "Dineout near here" entry point for venue/event pages. Seeds the /dineout
 * flow with the venue's location. Hidden unless the feature flag is on or the
 * coordinates are missing.
 *
 * Takes ALREADY-RESOLVED lat/lng (callers use the repo's `coordToLatLng`
 * (src/lib/geo.ts) to unpack Hoizr's GeoJSON [lng,lat] CoordinatePoint — the
 * coordinate-order trap lives there, in one place).
 *
 * Optional `startDate` (event start ISO) appends `date`/`doorsAt` so the
 * reservation flow can badge slots that fit comfortably before doors.
 */
export function DineNearbyLink({
  lat,
  lng,
  startDate,
  className,
}: {
  lat?: number | null;
  lng?: number | null;
  startDate?: string | null;
  className?: string;
}) {
  if (process.env.NEXT_PUBLIC_SWIGGY_DINEOUT_ENABLED !== "true") return null;
  if (
    lat == null ||
    lng == null ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return null;
  }
  let extra = "";
  if (startDate) {
    const t = new Date(startDate).getTime();
    if (!Number.isNaN(t) && t > Date.now()) {
      const d = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
      }).format(new Date(t));
      extra = `&date=${d}&doorsAt=${Math.floor(t / 1000)}`;
    }
  }
  return (
    <Link
      href={`/dineout?lat=${lat}&lng=${lng}${extra}`}
      className={
        className ??
        "inline-flex items-center gap-1.5 rounded-full border border-[#FF5200] px-3 py-1.5 text-sm font-medium text-[#FF5200]"
      }
    >
      🍽 Dineout near here
    </Link>
  );
}
