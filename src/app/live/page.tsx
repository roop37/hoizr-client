import type { Metadata } from "next";
import Link from "next/link";
import { EventCard } from "@/components/hoizr-ui/EventCard";
import { MarqueeRow } from "@/components/hoizr-ui/MarqueeRow";
import { RailHead } from "@/components/hoizr-ui/RailHead";
import {
  BreadcrumbJsonLd,
  CollectionPageJsonLd,
} from "@/components/hoizr-ui/seo/JsonLd";
import {
  fetchCustomerMasters,
  fetchPublishedEvents,
} from "@/lib/home-data";
import { toDisplayEvent, type DisplayEvent } from "@/lib/event-display";
import type { PublicEvent } from "@/types/event";
import type { GenreTagMaster } from "@/types/master";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hoizr.com";

export const metadata: Metadata = {
  title: "Live tonight — events happening across India",
  description:
    "Events happening tonight across India. Doors open in the next few hours — book now, scan at the gate. Concerts, club nights, comedy and live music on Hoizr.",
  keywords: [
    "events tonight India",
    "live music tonight",
    "club nights tonight",
    "comedy tonight India",
    "Hoizr live",
    "events happening now India",
  ],
  alternates: {
    canonical: "/live",
    languages: { "en-IN": "/live", "x-default": "/live" },
  },
  openGraph: {
    title: "Live tonight on Hoizr — events across India",
    description:
      "Tonight's concerts, club nights, comedy, and live music across India.",
    url: "/live",
    type: "website",
    siteName: "Hoizr",
    locale: "en_IN",
    images: [
      {
        url: "/opengraph-image.webp",
        width: 1200,
        height: 630,
        alt: "Live tonight on Hoizr — concerts, club nights and comedy across India",
      },
    ],
  },
};

export const dynamic = "force-dynamic";

const isToday = (iso?: string) => {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return d.toDateString() === now.toDateString();
};

const isThisWeek = (iso?: string) => {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= -1 && diff <= 7;
};

const groupByGenre = (
  events: PublicEvent[],
  genres: GenreTagMaster[]
): { genre: GenreTagMaster; events: DisplayEvent[] }[] => {
  const map = new Map<string, DisplayEvent[]>();
  for (const e of events) {
    const ids = e.genreTagIds ?? [];
    if (!ids.length) continue;
    const display = toDisplayEvent(e);
    for (const id of ids) {
      if (!map.has(id)) map.set(id, []);
      map.get(id)!.push(display);
    }
  }
  return genres
    .map((g) => ({ genre: g, events: map.get(g._id) ?? [] }))
    .filter((row) => row.events.length > 0);
};

export default async function LivePage() {
  const [list, masters] = await Promise.all([
    fetchPublishedEvents({ pageSize: 48 }),
    fetchCustomerMasters(),
  ]);

  const liveToday = list.events
    .filter((e) => isToday(e.startDate))
    .map(toDisplayEvent);
  const upcoming = list.events
    .filter((e) => !isToday(e.startDate) && isThisWeek(e.startDate))
    .map(toDisplayEvent);

  // Build "[Genre] Near You" rows from the FULL event list so the
  // marquees feel populated even when nothing is live tonight in
  // exactly that genre.
  const genreRows = groupByGenre(list.events, masters.genres);

  return (
    <div className="h-page">
      <CollectionPageJsonLd
        name="Live tonight on Hoizr"
        description="Events happening tonight across India."
        href="/live"
        items={liveToday.slice(0, 24).map((e) => ({
          url: `${SITE_URL}/events/${e.slug}`,
          name: e.title,
        }))}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Hoizr", href: "/" },
          { name: "Live tonight", href: "/live" },
        ]}
      />
      <div className="h-page-head">
        <div>
          <div className="label">Live in your city</div>
          <h1>Happening today.</h1>
          <p
            style={{
              color: "var(--h-ink-2)",
              maxWidth: "56ch",
              margin: "10px 0 0",
              fontSize: 14,
            }}
          >
            Doors open in the next few hours. Book now, scan at the gate.
          </p>
        </div>
        {liveToday.length > 0 ? (
          <div className="right">
            <span className="h-chip active" style={{ padding: "7px 12px" }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 999,
                  background: "var(--h-volt)",
                  marginRight: 6,
                }}
              />
              {liveToday.length} live tonight
            </span>
          </div>
        ) : null}
      </div>

      {liveToday.length === 0 ? (
        <div className="h-empty">
          Nothing live in your city today.{" "}
          <Link
            href="/events"
            className="h-btn-text"
            style={{ color: "var(--h-accent)" }}
          >
            See upcoming events
          </Link>
        </div>
      ) : (
        <div className="h-live-grid">
          {liveToday.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}

      {genreRows.map((row) => (
        <MarqueeRow
          key={row.genre._id}
          title={`${row.genre.value} Near You`}
          events={row.events}
        />
      ))}

      {upcoming.length > 0 ? (
        <div className="h-rail-sec">
          <RailHead title="Coming up this week" seeAllHref="/events" />
          <div className="h-rail h-rail-5">
            {upcoming.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
