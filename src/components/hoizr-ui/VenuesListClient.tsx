"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { gqlRequest } from "@/lib/graphql";
import {
  GET_PUBLIC_VENUES_QUERY,
  type PublicVenue,
  type PublicVenuePage,
} from "@/lib/venue-queries";

const cityOf = (v: PublicVenue): string =>
  v.address?.city || v.address?.formattedAddress || "";

// Deterministic bento sizing. A repeating 6-tile rhythm gives a mosaic with
// the occasional hero / tall / wide tile while staying balanced; `grid-flow-dense`
// backfills the gaps the varied spans leave behind. Sizes are chosen to read
// well at BOTH the 2-col (mobile) and 4-col (desktop) track counts.
const bentoSpan = (i: number): string => {
  switch (i % 6) {
    case 0:
      return "col-span-2 row-span-2"; // hero
    case 2:
      return "row-span-2"; // tall / portrait emphasis
    case 4:
      return "sm:col-span-2"; // wide / landscape emphasis
    default:
      return "";
  }
};

export function VenuesListClient() {
  const [venues, setVenues] = useState<PublicVenue[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="grid grid-flow-dense grid-cols-2 gap-3 [grid-auto-rows:8.5rem] sm:grid-cols-4 sm:gap-4 sm:[grid-auto-rows:10.5rem]">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className={`animate-pulse rounded-2xl border border-white/5 bg-white/5 ${bentoSpan(
              i
            )}`}
          />
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
    <div className="grid grid-flow-dense grid-cols-2 gap-3 [grid-auto-rows:8.5rem] sm:grid-cols-4 sm:gap-4 sm:[grid-auto-rows:10.5rem]">
      {venues.map((v, i) => {
        const gallery = (v.gallery ?? []).filter(Boolean);
        const cover = gallery[0] || v.logo || null;
        const city = cityOf(v);
        const meta = [v.venueType, city].filter(Boolean).join(" · ") || "Venue";
        return (
          <Link
            key={v._id}
            href={`/venues/${v._id}`}
            className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-[#c5ff3d]/40 ${bentoSpan(
              i
            )}`}
          >
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cover}
                alt={v.name ?? "Venue"}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white/10 to-white/[0.02] text-4xl font-bold text-white/25">
                {(v.name ?? "V").charAt(0).toUpperCase()}
              </div>
            )}

            {/* Bottom scrim so the venue name stays legible over any photo. */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent p-3 pt-10">
              <div className="truncate text-[14px] font-semibold text-white drop-shadow">
                {v.name ?? "Venue"}
              </div>
              <div className="mt-0.5 truncate text-[11px] text-white/70">
                {meta}
              </div>
            </div>

            {/* Logo chip when the cover isn't already the logo. */}
            {v.logo && cover !== v.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={v.logo}
                alt=""
                loading="lazy"
                className="absolute left-2 top-2 h-8 w-8 rounded-lg border border-white/20 object-cover shadow-lg"
              />
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}

export default VenuesListClient;
