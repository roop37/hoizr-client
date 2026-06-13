"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { gqlRequest } from "@/lib/graphql";
import {
  GET_PUBLIC_VENUE_BY_ID_QUERY,
  type PublicVenue,
} from "@/lib/venue-queries";

const mapsHref = (v: PublicVenue): string | null => {
  const q = v.address?.formattedAddress || v.address?.city;
  return q
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
    : null;
};

export function VenueDetailClient({ id }: { id: string }) {
  const [venue, setVenue] = useState<PublicVenue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await gqlRequest<{ getPublicVenueById: PublicVenue | null }>(
          GET_PUBLIC_VENUE_BY_ID_QUERY,
          { id }
        );
        setVenue(data.getPublicVenueById ?? null);
      } catch {
        setVenue(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl animate-pulse space-y-4 px-4 py-10">
        <div className="h-40 rounded-2xl bg-white/5" />
        <div className="h-6 w-1/2 rounded bg-white/5" />
        <div className="h-24 rounded bg-white/5" />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-white">Venue not found</h1>
        <p className="mt-2 text-white/55">
          This venue isn&rsquo;t available right now.
        </p>
        <Link
          href="/venues"
          className="mt-4 inline-flex h-10 items-center rounded-xl border border-white/15 px-4 text-sm font-semibold text-white"
        >
          Back to venues
        </Link>
      </div>
    );
  }

  const maps = mapsHref(venue);
  const gallery = (venue.gallery ?? []).filter(Boolean).slice(0, 5);
  const cityLine = [venue.venueType, venue.address?.city]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/venues"
        className="text-[13px] text-white/55 transition hover:text-white"
      >
        ← All venues
      </Link>

      <div className="mt-4 flex items-center gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          {venue.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={venue.logo}
              alt={venue.name ?? "Venue"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-white/30">
              {(venue.name ?? "V").charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold text-white">
            {venue.name ?? "Venue"}
          </h1>
          {cityLine ? (
            <div className="mt-0.5 text-[13px] text-white/55">{cityLine}</div>
          ) : null}
        </div>
      </div>

      {venue.description ? (
        <p className="mt-5 whitespace-pre-line text-[14px] leading-6 text-white/75">
          {venue.description}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col gap-2 text-[13px]">
        {venue.address?.formattedAddress ? (
          <div className="text-white/70">
            {maps ? (
              <a
                href={maps}
                target="_blank"
                rel="noreferrer"
                className="underline decoration-white/30 underline-offset-2 transition hover:text-[#c5ff3d] hover:decoration-[#c5ff3d]"
                title="Open in Google Maps"
              >
                {venue.address.formattedAddress}
              </a>
            ) : (
              venue.address.formattedAddress
            )}
          </div>
        ) : null}
        {venue.websiteUrl ? (
          <a
            href={venue.websiteUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[#c5ff3d] underline-offset-2 hover:underline"
          >
            Visit website ↗
          </a>
        ) : null}
      </div>

      {gallery.length > 0 ? (
        <div className="mt-8">
          <h2 className="mb-3 text-[15px] font-semibold text-white">Gallery</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {gallery.map((src, i) => (
              <a
                key={`${src}-${i}`}
                href={src}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-xl border border-white/10 bg-white/5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`${venue.name ?? "Venue"} photo ${i + 1}`}
                  loading="lazy"
                  className="aspect-square h-full w-full object-cover transition hover:scale-[1.03]"
                />
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default VenueDetailClient;
