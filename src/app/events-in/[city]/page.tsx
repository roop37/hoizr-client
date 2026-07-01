import type { Metadata } from "next";
import Link from "next/link";
import { EventCard } from "@/components/hoizr-ui/EventCard";
import {
  BreadcrumbJsonLd,
  CollectionPageJsonLd,
} from "@/components/hoizr-ui/seo/JsonLd";
import { FreshnessRevalidate } from "@/components/hoizr-ui/FreshnessRevalidate";
import { fetchCustomerMasters, fetchPublishedEvents } from "@/lib/home-data";
import { toDisplayEvent } from "@/lib/event-display";
import { CITY_AREAS, citySlug, resolveCityFromSlug } from "@/lib/city-slug";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hoizr.com";

// SSR on each request so crawlers always get fresh, city-filtered content.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { city: string };
}): Promise<Metadata> {
  const masters = await fetchCustomerMasters();
  const { name } = resolveCityFromSlug(params.city, masters.cities);
  const path = `/events-in/${params.city}`;
  // Noindex city pages with zero upcoming events (empty listings are thin);
  // they flip back to indexable automatically once inventory exists.
  const list = await fetchPublishedEvents({ city: name, pageSize: 96 });
  const hasEvents = (list.events?.length ?? 0) > 0;
  const title = `Events in ${name} — concerts, club nights, gigs & comedy`;
  const description = `Discover and book the best events in ${name} — concerts, club nights, festivals, comedy and live music. Instant QR tickets and UPI checkout on Hoizr.`;

  return {
    title,
    description,
    keywords: [
      `events in ${name}`,
      `things to do in ${name}`,
      `concerts in ${name}`,
      `club nights in ${name}`,
      `gigs in ${name}`,
      `comedy shows in ${name}`,
      `live music ${name}`,
      `${name} events tonight`,
      "Hoizr",
    ],
    alternates: {
      canonical: path,
      languages: { "en-IN": path, "x-default": path },
    },
    openGraph: {
      title: `Events in ${name} | Hoizr`,
      description,
      url: path,
      type: "website",
      siteName: "Hoizr",
      locale: "en_IN",
      images: [
        {
          url: "/opengraph-image.webp",
          width: 1200,
          height: 630,
          alt: `Events in ${name} on Hoizr`,
        },
      ],
    },
    robots: { index: hasEvents, follow: true },
  };
}

export default async function CityEventsPage({
  params,
}: {
  params: { city: string };
}) {
  const masters = await fetchCustomerMasters();
  const { name } = resolveCityFromSlug(params.city, masters.cities);
  // Server-side city filter → the rendered HTML is exactly this city's events.
  const list = await fetchPublishedEvents({ city: name, pageSize: 96 });
  const events = list.events.map(toDisplayEvent);
  const path = `/events-in/${params.city}`;

  return (
    <div className="h-page">
      <FreshnessRevalidate />
      <CollectionPageJsonLd
        name={`Events in ${name}`}
        description={`Upcoming concerts, club nights, festivals and comedy in ${name}.`}
        href={path}
        items={events.slice(0, 32).map((e) => ({
          url: `${SITE_URL}/events/${e.slug}`,
          name: e.title,
        }))}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Hoizr", href: "/" },
          { name: "Events", href: "/events" },
          { name, href: path },
        ]}
      />

      <div className="h-page-head">
        <div>
          <div className="label">Live in {name}</div>
          <h1>Events in {name}</h1>
        </div>
      </div>

      <p className="mb-5 max-w-2xl text-[14px] leading-6 text-white/65">
        Concerts, club nights, festivals, comedy and live music happening in{" "}
        {name}. Book instant QR tickets with UPI on Hoizr — no app, no queue.
      </p>

      {(CITY_AREAS[params.city] ?? []).length > 0 ? (
        <div className="mb-7 flex flex-wrap gap-2">
          {CITY_AREAS[params.city].map((area) => (
            <Link
              key={area}
              href={`/events-in/${params.city}/${citySlug(area)}`}
              className="rounded-full border border-white/15 px-3 py-1.5 text-[13px] text-white/75 transition hover:border-[var(--h-accent)] hover:text-white"
            >
              {area}
            </Link>
          ))}
        </div>
      ) : null}

      {events.length === 0 ? (
        <div className="h-empty">
          No upcoming events in {name} right now.{" "}
          <Link
            href="/events"
            className="font-semibold"
            style={{ color: "var(--h-accent)" }}
          >
            Explore all events →
          </Link>
        </div>
      ) : (
        <div className="h-evt-grid">
          {events.map((e, i) => (
            <EventCard key={e.id} event={e} position={i} />
          ))}
        </div>
      )}

      <div className="mt-12 border-t border-white/10 pt-6 text-sm text-white/55">
        <Link
          href="/events"
          className="transition hover:text-white"
        >
          Browse all events across India →
        </Link>
      </div>
    </div>
  );
}
