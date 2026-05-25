import type { Metadata } from "next";
import { EventsPageClient } from "@/components/hoizr-ui/EventsPageClient";
import { TrackView } from "@/components/analytics/TrackView";
import { BreadcrumbJsonLd, CollectionPageJsonLd } from "@/components/hoizr-ui/seo/JsonLd";
import { fetchCustomerMasters, fetchPublishedEvents } from "@/lib/home-data";
import { toDisplayEvent } from "@/lib/event-display";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hoizr.com";

type SearchParams = {
  vertical?: string;
  city?: string;
  genre?: string;
};

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
      pageSize: 48,
      city: searchParams.city,
      genreTagIds: searchParams.genre ? [searchParams.genre] : undefined,
    }),
    fetchCustomerMasters(),
  ]);
  const events = list.events.map(toDisplayEvent);
  return (
    <>
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
          metadata: { totalResults: list.total, vertical: searchParams.vertical, city: searchParams.city },
        }}
      />
      <EventsPageClient
        events={events}
        cities={masters.cities}
        genres={masters.genres}
        initialVertical={searchParams.vertical ?? "All"}
        initialCity={searchParams.city}
        initialGenreId={searchParams.genre}
      />
    </>
  );
}
