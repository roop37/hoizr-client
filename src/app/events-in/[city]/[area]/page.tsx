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
import {
  addressMatchesArea,
  resolveAreaFromSlug,
  resolveCityFromSlug,
} from "@/lib/city-slug";
import type { PublicEvent } from "@/types/event";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hoizr.com";

export const dynamic = "force-dynamic";

// Address text we test the neighbourhood name against. Events store addresses
// as free text (no structured locality), so we widen the haystack.
const addressText = (e: PublicEvent): string =>
  [
    e.title,
    e.location?.addressLine1,
    e.location?.addressLine2,
    e.location?.formattedAddress,
    e.location?.place?.displayName,
  ]
    .filter(Boolean)
    .join(" ");

export async function generateMetadata({
  params,
}: {
  params: { city: string; area: string };
}): Promise<Metadata> {
  const masters = await fetchCustomerMasters();
  const { name: cityName } = resolveCityFromSlug(params.city, masters.cities);
  const areaName = resolveAreaFromSlug(params.city, params.area);
  const path = `/events-in/${params.city}/${params.area}`;
  const title = `Events in ${areaName}, ${cityName} — gigs, club nights & comedy`;
  const description = `What's on in ${areaName}, ${cityName} — concerts, club nights, gigs and comedy near you. Instant QR tickets with UPI on Hoizr.`;

  return {
    title,
    description,
    keywords: [
      `events in ${areaName}`,
      `events in ${areaName} ${cityName}`,
      `things to do in ${areaName}`,
      `club nights in ${areaName}`,
      `${areaName} ${cityName} events`,
      "Hoizr",
    ],
    alternates: {
      canonical: path,
      languages: { "en-IN": path, "x-default": path },
    },
    openGraph: {
      title: `Events in ${areaName}, ${cityName} | Hoizr`,
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
          alt: `Events in ${areaName}, ${cityName} on Hoizr`,
        },
      ],
    },
    robots: { index: true, follow: true },
  };
}

export default async function AreaEventsPage({
  params,
}: {
  params: { city: string; area: string };
}) {
  const masters = await fetchCustomerMasters();
  const { name: cityName } = resolveCityFromSlug(params.city, masters.cities);
  const areaName = resolveAreaFromSlug(params.city, params.area);
  const cityPath = `/events-in/${params.city}`;
  const path = `${cityPath}/${params.area}`;

  // Server-side city filter, then narrow to the neighbourhood by address text.
  const list = await fetchPublishedEvents({ city: cityName, pageSize: 200 });
  const inArea = (list.events ?? []).filter((e) =>
    addressMatchesArea(addressText(e), areaName)
  );
  const events = inArea.map(toDisplayEvent);

  return (
    <div className="h-page">
      <FreshnessRevalidate />
      <CollectionPageJsonLd
        name={`Events in ${areaName}, ${cityName}`}
        description={`Upcoming concerts, club nights and comedy in ${areaName}, ${cityName}.`}
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
          { name: cityName, href: cityPath },
          { name: areaName, href: path },
        ]}
      />

      <div className="h-page-head">
        <div>
          <div className="label">
            <Link href={cityPath} className="hover:underline">
              {cityName}
            </Link>{" "}
            · Neighbourhood
          </div>
          <h1>
            Events in {areaName}, {cityName}
          </h1>
        </div>
      </div>

      <p className="mb-7 max-w-2xl text-[14px] leading-6 text-white/65">
        Concerts, club nights, gigs and comedy in and around {areaName},{" "}
        {cityName}. Book instant QR tickets with UPI on Hoizr.
      </p>

      {events.length === 0 ? (
        <div className="h-empty">
          No upcoming events in {areaName} right now.{" "}
          <Link
            href={cityPath}
            className="font-semibold"
            style={{ color: "var(--h-accent)" }}
          >
            See all events in {cityName} →
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
        <Link href={cityPath} className="transition hover:text-white">
          ← All events in {cityName}
        </Link>
      </div>
    </div>
  );
}
