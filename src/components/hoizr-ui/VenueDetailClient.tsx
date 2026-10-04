"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { gqlRequest } from "@/lib/graphql";
import { sanitizeRichText } from "@/lib/sanitize";
import { VenueCoupons } from "@/components/hoizr-ui/VenueCoupons";
import {
  GET_ORGANIZER_EVENTS_QUERY,
  GET_PUBLIC_VENUE_BY_ID_QUERY,
  GET_VENUE_PUBLIC_GUESTLISTS_QUERY,
  type OrganizerEvents,
  type PublicEventSummary,
  type PublicVenue,
  type VenuePublicGuestlist,
} from "@/lib/venue-queries";

const mapsHref = (v: PublicVenue): string | null => {
  const q = v.address?.formattedAddress || v.address?.city;
  return q
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
    : null;
};

const formatEventDate = (iso?: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
};

const formatEventDay = (iso?: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
};

type VenueEvent = PublicEventSummary & { isPast: boolean };

// One venue-event card, shared by the Happening now / Upcoming / Past
// sections. Shows the FULL portrait flyer (3:4) like the listing card;
// falls back to the landscape asset only when no portrait exists.
const renderVenueEventCard = (ev: VenueEvent, kind: string) => {
  const cover = ev.eventFlyer || ev.horizontalFlyer || null;
  const badge =
    kind === "live" ? (
      <span className="shrink-0 rounded-full bg-[#c5ff3d] px-2.5 py-1 text-[11px] font-bold text-[#0a0a0e]">
        Live now
      </span>
    ) : kind === "past" ? (
      <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/50">
        Past
      </span>
    ) : (
      <span className="shrink-0 rounded-full bg-[#c5ff3d]/15 px-2.5 py-1 text-[11px] font-semibold text-[#c5ff3d]">
        Upcoming
      </span>
    );
  const card = (
    <>
      <div className="aspect-[3/4] w-full overflow-hidden bg-white/5">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={ev.title ?? "Event"}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : null}
      </div>
      <div className="flex items-start justify-between gap-2 p-3">
        <div className="min-w-0">
          <div className="truncate text-[14px] font-semibold text-white">
            {ev.title ?? "Event"}
          </div>
          <div className="truncate text-[12px] text-white/55">
            {[formatEventDay(ev.startDate), ev.city].filter(Boolean).join(" · ")}
          </div>
        </div>
        {badge}
      </div>
    </>
  );
  return ev.slug ? (
    <Link
      key={ev._id}
      href={`/events/${ev.slug}`}
      className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] transition hover:border-[#c5ff3d]/40"
    >
      {card}
    </Link>
  ) : (
    <div
      key={ev._id}
      className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]"
    >
      {card}
    </div>
  );
};

export function VenueDetailClient({ id }: { id: string }) {
  const [venue, setVenue] = useState<PublicVenue | null>(null);
  const [guestlists, setGuestlists] = useState<VenuePublicGuestlist[]>([]);
  const [events, setEvents] = useState<VenueEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await gqlRequest<{ getPublicVenueById: PublicVenue | null }>(
          GET_PUBLIC_VENUE_BY_ID_QUERY,
          { id }
        );
        setVenue(data.getPublicVenueById ?? null);
      } catch (err) {
        // A GraphQL/validation error (e.g. an unknown field) lands here too —
        // log it so a query bug doesn't silently masquerade as "not found".
        console.error("Failed to load venue", err);
        setVenue(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Public guestlists are best-effort: a failure here must never block the
  // venue page itself, so it runs in its own effect and swallows errors.
  useEffect(() => {
    (async () => {
      try {
        const data = await gqlRequest<{
          venuePublicGuestlists: VenuePublicGuestlist[];
        }>(GET_VENUE_PUBLIC_GUESTLISTS_QUERY, { venueId: id });
        setGuestlists(data.venuePublicGuestlists ?? []);
      } catch (err) {
        console.error("Failed to load venue guestlists", err);
        setGuestlists([]);
      }
    })();
  }, [id]);

  // The venue's events (a venue IS a host). Both buckets, merged latest-first
  // so the newest shows on top regardless of past/upcoming. Best-effort.
  useEffect(() => {
    (async () => {
      try {
        const data = await gqlRequest<{
          getOrganizerPastUpcomingEvents: OrganizerEvents;
        }>(GET_ORGANIZER_EVENTS_QUERY, { hostId: id });
        const res = data.getOrganizerPastUpcomingEvents;
        const merged: VenueEvent[] = [
          ...(res?.upcoming ?? []).map((e) => ({ ...e, isPast: false })),
          ...(res?.past ?? []).map((e) => ({ ...e, isPast: true })),
        ].sort((a, b) => {
          const ta = a.startDate ? new Date(a.startDate).getTime() : 0;
          const tb = b.startDate ? new Date(b.startDate).getTime() : 0;
          return tb - ta; // latest first
        });
        setEvents(merged);
      } catch (err) {
        console.error("Failed to load venue events", err);
        setEvents([]);
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

      {/* Venue description is authored in business-client's RichTextEditor, so
          it arrives as HTML — render it (sanitized) instead of printing the
          raw tags, same as the event "About" block. */}
      {venue.description ? (
        <div
          className="h-richtext mt-5"
          dangerouslySetInnerHTML={{
            __html: sanitizeRichText(venue.description),
          }}
        />
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

      <VenueCoupons hostId={id} />

      {events.length > 0 ? (
        (() => {
          // Bucket the merged list: the server's "upcoming" bucket includes
          // ongoing events (it keeps events until they END), so an upcoming
          // event whose startDate has passed is happening RIGHT NOW.
          const now = Date.now();
          const started = (ev: VenueEvent) =>
            ev.startDate ? new Date(ev.startDate).getTime() <= now : false;
          const live = events.filter((ev) => !ev.isPast && started(ev));
          const upcoming = events
            .filter((ev) => !ev.isPast && !started(ev))
            .sort(
              (a, b) =>
                +new Date(a.startDate ?? 0) - +new Date(b.startDate ?? 0)
            ); // soonest first
          const past = events.filter((ev) => ev.isPast); // latest first already
          const sections: [string, VenueEvent[], string][] = [
            ["Happening now", live, "live"],
            ["Upcoming", upcoming, "upcoming"],
            ["Past events", past, "past"],
          ];
          return sections
            .filter(([, list]) => list.length > 0)
            .map(([title, list, kind]) => (
              <div className="mt-8" key={kind}>
                <h2 className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-white">
                  {kind === "live" && (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c5ff3d] opacity-60" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#c5ff3d]" />
                    </span>
                  )}
                  {title}
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {list.map((ev) => renderVenueEventCard(ev, kind))}
                </div>
              </div>
            ));
        })()
      ) : null}

      {guestlists.length > 0 ? (
        <div className="mt-8">
          <h2 className="mb-3 text-[15px] font-semibold text-white">
            On the guestlist
          </h2>
          <div className="space-y-2">
            {guestlists.map((g) => (
              <Link
                key={g.guestlistId}
                href={`/guestlist/${g.code}`}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 transition hover:border-[#c5ff3d]/40"
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                  {g.eventFlyer ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={g.eventFlyer}
                      alt={g.eventTitle ?? "Event"}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-semibold text-white">
                    {g.eventTitle ?? "Event"}
                  </div>
                  <div className="truncate text-[12px] text-white/55">
                    {formatEventDate(g.eventDate)}
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-semibold ${
                    g.isFull
                      ? "bg-white/10 text-white/50"
                      : "bg-[#c5ff3d] text-[#0a0a0e]"
                  }`}
                >
                  {g.isFull ? "Full" : "Join"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {gallery.length > 0 ? (
        <div className="mt-8">
          <h2 className="mb-3 text-[15px] font-semibold text-white">Gallery</h2>
          {/* Masonry (CSS columns) so photos render at their NATURAL aspect
              ratio — portrait, landscape, or square — never force-cropped. */}
          <div className="gap-3 [column-fill:balance] columns-2 sm:columns-3">
            {gallery.map((src, i) => (
              <a
                key={`${src}-${i}`}
                href={src}
                target="_blank"
                rel="noreferrer"
                className="mb-3 block break-inside-avoid overflow-hidden rounded-xl border border-white/10 bg-white/5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`${venue.name ?? "Venue"} photo ${i + 1}`}
                  loading="lazy"
                  className="h-auto w-full object-cover transition duration-300 hover:scale-[1.02]"
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
