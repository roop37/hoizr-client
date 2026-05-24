import type { Metadata } from "next";
import { EventsPageClient } from "@/components/hoizr-ui/EventsPageClient";
import { TrackView } from "@/components/analytics/TrackView";
import { BreadcrumbJsonLd, CollectionPageJsonLd } from "@/components/hoizr-ui/seo/JsonLd";
import { fetchCustomerMasters, fetchPublishedEvents } from "@/lib/home-data";
import { toDisplayEvent } from "@/lib/event-display";

type SearchParams = {
  vertical?: string;
  city?: string;
  genre?: string;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Discover events in India",
  description:
    "Concerts, festivals, club nights, comedy and live music across India. Hand-picked events with instant QR tickets and UPI checkout.",
  alternates: { canonical: "/events" },
  openGraph: {
    title: "Discover events on Hoizr",
    description: "Concerts, festivals, club nights & comedy across India.",
    url: "/events",
    type: "website",
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
