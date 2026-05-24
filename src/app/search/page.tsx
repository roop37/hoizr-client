import type { Metadata } from "next";
import { SearchPageClient } from "@/components/hoizr-ui/SearchPageClient";
import { BreadcrumbJsonLd } from "@/components/hoizr-ui/seo/JsonLd";
import { fetchCustomerMasters, fetchPublishedEvents } from "@/lib/home-data";
import { toDisplayEvent } from "@/lib/event-display";

export const metadata: Metadata = {
  title: "Search events",
  description: "Search live events, artists, venues, and cities across India on Hoizr.",
  alternates: { canonical: "/search" },
  openGraph: {
    title: "Search events on Hoizr",
    description: "Find concerts, club nights, festivals & comedy across India.",
    url: "/search",
    type: "website",
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
      <BreadcrumbJsonLd items={[{ name: "Hoizr", href: "/" }, { name: "Search", href: "/search" }]} />
      <SearchPageClient
        events={events}
        cities={masters.cities}
        genres={masters.genres}
      />
    </>
  );
}
