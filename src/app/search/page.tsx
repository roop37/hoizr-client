import type { Metadata } from "next";
import { SearchPageClient } from "@/components/hoizr-ui/SearchPageClient";
import { BreadcrumbJsonLd, CollectionPageJsonLd } from "@/components/hoizr-ui/seo/JsonLd";
import { fetchCustomerMasters, fetchPublishedEvents } from "@/lib/home-data";
import { toDisplayEvent } from "@/lib/event-display";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hoizr.com";

export const metadata: Metadata = {
  title: "Search events, artists & venues across India",
  description:
    "Search live events, artists, venues, and cities across India on Hoizr. Find concerts, festivals, club nights, comedy shows, and DJs in Mumbai, Bengaluru, Delhi, Hyderabad, Pune, Chennai, and Goa.",
  keywords: [
    "search events India",
    "find concerts India",
    "find festivals India",
    "search artists India",
    "search venues India",
    "Hoizr search",
  ],
  alternates: {
    canonical: "/search",
    languages: { "en-IN": "/search", "x-default": "/search" },
  },
  openGraph: {
    title: "Search events on Hoizr",
    description: "Find concerts, club nights, festivals & comedy across India.",
    url: "/search",
    type: "website",
    siteName: "Hoizr",
    locale: "en_IN",
    images: [
      {
        url: "/opengraph-image.webp",
        width: 1200,
        height: 630,
        alt: "Search events, artists, venues and cities across India on Hoizr",
      },
    ],
  },
};
export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const [list, masters] = await Promise.all([
    fetchPublishedEvents({ pageSize: 100 }),
    fetchCustomerMasters(),
  ]);
  const events = list.events.map((e) => ({ ...toDisplayEvent(e), startDateIso: e.startDate }));
  return (
    <>
      <CollectionPageJsonLd
        name="Search events on Hoizr"
        description="Search live events, artists, venues, and cities across India on Hoizr."
        href="/search"
        items={events.slice(0, 24).map((e) => ({
          url: `${SITE_URL}/events/${e.slug}`,
          name: e.title,
        }))}
      />
      <BreadcrumbJsonLd items={[{ name: "Hoizr", href: "/" }, { name: "Search", href: "/search" }]} />
      <SearchPageClient
        events={events}
        cities={masters.cities}
        genres={masters.genres}
      />
    </>
  );
}
