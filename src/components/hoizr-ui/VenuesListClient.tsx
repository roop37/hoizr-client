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
      } catch {
        setVenues([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-56 animate-pulse rounded-2xl border border-white/5 bg-white/5"
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
    <div className="grid grid-cols-2 gap-4 sm:gap-5">
      {venues.map((v) => {
        const gallery = (v.gallery ?? []).filter(Boolean);
        const cover = gallery[0] || v.logo || null;
        // Thumbnails = the gallery images not already used as the cover.
        const thumbs = (cover === gallery[0] ? gallery.slice(1) : gallery).slice(
          0,
          4
        );
        const city = cityOf(v);
        return (
          <Link
            key={v._id}
            href={`/venues/${v._id}`}
            className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-white/25 hover:bg-white/[0.06]"
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-white/10 to-white/[0.02]">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cover}
                  alt={v.name ?? "Venue"}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-white/30">
                  {(v.name ?? "V").charAt(0).toUpperCase()}
                </div>
              )}
              {/* Venue logo badge over the cover (when we have both). */}
              {v.logo && cover !== v.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={v.logo}
                  alt=""
                  loading="lazy"
                  className="absolute bottom-2 left-2 h-9 w-9 rounded-lg border border-white/20 object-cover shadow-lg"
                />
              ) : null}
            </div>
            {thumbs.length > 0 ? (
              <div className="flex gap-1 px-2 pt-2">
                {thumbs.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={src}
                    alt=""
                    loading="lazy"
                    className="h-12 flex-1 rounded-md object-cover"
                  />
                ))}
              </div>
            ) : null}
            <div className="p-3">
              <div className="truncate text-[14px] font-semibold text-white">
                {v.name ?? "Venue"}
              </div>
              <div className="mt-0.5 truncate text-[12px] text-white/55">
                {[v.venueType, city].filter(Boolean).join(" · ") || "Venue"}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default VenuesListClient;
