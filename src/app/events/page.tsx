import type { Metadata } from "next";
import { EventsPageClient } from "@/components/hoizr-ui/EventsPageClient";
import { TrackView } from "@/components/analytics/TrackView";
import { BreadcrumbJsonLd, CollectionPageJsonLd } from "@/components/hoizr-ui/seo/JsonLd";
import { FreshnessRevalidate } from "@/components/hoizr-ui/FreshnessRevalidate";
import { fetchCustomerMasters, fetchPublishedEvents } from "@/lib/home-data";
import { toDisplayEvent } from "@/lib/event-display";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hoizr.com";

type SearchParams = {
  vertical?: string;
  vibe?: string;
  city?: string;
  genre?: string;
  when?: string;
  price?: string;
  sort?: string;
  q?: string;
};

const VALID_WHEN = ["all", "today", "tomorrow", "weekend", "week", "month"] as const;
const VALID_PRICE = ["any", "free", "under500", "mid", "premium"] as const;
const VALID_SORT = ["earliest", "trending", "cheapest", "priciest"] as const;
type WhenId = (typeof VALID_WHEN)[number];
type PriceId = (typeof VALID_PRICE)[number];
type SortId = (typeof VALID_SORT)[number];

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Discover events in India — concerts, festivals, club nights & comedy",
  description:
    "Concerts, festivals, club nights, comedy and live music across India. Hand-picked events with instant QR tickets and UPI checkout on Hoizr.",
  keywords: [
    "events in India",
    "concert tickets India",
    "festival tickets India",
    "club night tickets India",
    "comedy show tickets India",
    "live music India",
    "events in Mumbai",
    "events in Bengaluru",
    "events in Delhi",
    "Hoizr events",
  ],
  alternates: {
    canonical: "/events",
    languages: { "en-IN": "/events", "x-default": "/events" },
  },
  openGraph: {
    title: "Discover events on Hoizr — concerts, festivals & club nights in India",
    description:
      "Concerts, festivals, club nights and comedy across India. Tickets in 60 seconds.",
    url: "/events",
    type: "website",
    siteName: "Hoizr",
    locale: "en_IN",
    images: [
      {
        url: "/opengraph-image.webp",
        width: 1200,
        height: 630,
        alt: "Discover events on Hoizr — concerts, festivals, club nights and comedy across India",
      },
    ],
  },
};

export default async function EventsPage({ searchParams }: { searchParams: SearchParams }) {
  const [list, masters] = await Promise.all([
    fetchPublishedEvents({
      pageSize: 96,
      // City is filtered CLIENT-side (EventsPageClient) so switching city
      // updates the grid instantly. Fetching all cities here is what lets the
      // city picker actually refresh the list (the server pre-filter froze it).
      genreTagIds: searchParams.genre ? [searchParams.genre] : undefined,
    }),
    fetchCustomerMasters(),
  ]);
  const events = list.events.map(toDisplayEvent);
  const initialVibe = searchParams.vibe ?? searchParams.vertical ?? "All";
  const initialWhen: WhenId = (VALID_WHEN as readonly string[]).includes(
    searchParams.when ?? "",
  )
    ? (searchParams.when as WhenId)
    : "all";
  const initialPrice: PriceId = (VALID_PRICE as readonly string[]).includes(
    searchParams.price ?? "",
  )
    ? (searchParams.price as PriceId)
    : "any";
  const initialSort: SortId = (VALID_SORT as readonly string[]).includes(
    searchParams.sort ?? "",
  )
    ? (searchParams.sort as SortId)
    : "earliest";
  return (
    <>
      <FreshnessRevalidate />
      <CollectionPageJsonLd
        name="Hoizr events"
        description="Live music, club nights, festivals and comedy events across India."
        href="/events"
        items={events.slice(0, 32).map((e) => ({
          url: `${SITE_URL}/events/${e.slug}`,
          name: e.title,
        }))}
      />
      <BreadcrumbJsonLd items={[{ name: "Hoizr", href: "/" }, { name: "Events", href: "/events" }]} />
      <TrackView
        event="eventListView"
        payload={{
          metadata: {
            totalResults: list.total,
            vibe: initialVibe,
            city: searchParams.city,
            when: initialWhen,
            price: initialPrice,
          },
        }}
      />
      <EventsPageClient
        events={events}
        cities={masters.cities}
        genres={masters.genres}
        initialVertical={initialVibe}
        initialCity={searchParams.city}
        initialGenreId={searchParams.genre}
        initialWhen={initialWhen}
        initialPrice={initialPrice}
        initialSort={initialSort}
        initialSearch={searchParams.q ?? ""}
      />
    </>
  );
}
