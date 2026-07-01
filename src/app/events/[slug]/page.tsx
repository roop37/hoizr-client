import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventDetailClient } from "@/components/hoizr-ui/EventDetailClient";
import { BreadcrumbJsonLd, EventJsonLd } from "@/components/hoizr-ui/seo/JsonLd";
import { FreshnessRevalidate } from "@/components/hoizr-ui/FreshnessRevalidate";
import { gqlRequest } from "@/lib/graphql";
import {
  ACTIVE_LANGUAGES_QUERY,
  ACTIVE_PROHIBITED_ITEMS_QUERY,
  PUBLIC_EVENT_BY_SLUG_QUERY,
  PUBLIC_EVENT_PEOPLE_QUERY,
} from "@/lib/queries";
import type {
  PublicEvent,
  PublicLanguageMaster,
  PublicEventPeopleResponse,
  PublicProhibitedItemMaster,
} from "@/types/event";

export const dynamic = "force-dynamic";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hoizr.com";

async function fetchEvent(slug: string): Promise<PublicEvent | null> {
  try {
    const data = await gqlRequest<{ getPublicEventBySlug: PublicEvent | null }>(
      PUBLIC_EVENT_BY_SLUG_QUERY,
      { slug },
    );
    return data.getPublicEventBySlug ?? null;
  } catch {
    return null;
  }
}

async function fetchPeople(
  eventId: string
): Promise<PublicEventPeopleResponse> {
  try {
    const data = await gqlRequest<{
      getPublicEventPeople: PublicEventPeopleResponse;
    }>(PUBLIC_EVENT_PEOPLE_QUERY, { eventId });
    return (
      data.getPublicEventPeople ?? { artists: [], organizers: [] }
    );
  } catch {
    return { artists: [], organizers: [] };
  }
}

async function fetchDetailLookups(): Promise<{
  languages: PublicLanguageMaster[];
  prohibitedItems: PublicProhibitedItemMaster[];
}> {
  const [languages, prohibitedItems] = await Promise.all([
    gqlRequest<{ getActiveLanguages: PublicLanguageMaster[] }>(
      ACTIVE_LANGUAGES_QUERY,
    )
      .then((data) => data.getActiveLanguages ?? [])
      .catch(() => []),
    gqlRequest<{ getActiveProhibitedItems: PublicProhibitedItemMaster[] }>(
      ACTIVE_PROHIBITED_ITEMS_QUERY,
    )
      .then((data) => data.getActiveProhibitedItems ?? [])
      .catch(() => []),
  ]);

  return { languages, prohibitedItems };
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const event = await fetchEvent(params.slug);
  if (!event) return { title: "Event not found" };
  const desc =
    event.description?.slice(0, 160) ??
    `Book tickets for ${event.title}${event.city ? ` in ${event.city}` : ""} on Hoizr.`;
  const canonical = `/events/${event.slug ?? params.slug}`;
  const canonicalUrl = `${SITE_URL}${canonical}`;
  const image = event.horizontalFlyer ?? event.eventFlyer;
  const title = `${event.title}${event.city ? ` tickets in ${event.city}` : " tickets"} | Hoizr`;
  return {
    title,
    description: desc,
    alternates: { canonical },
    robots: { index: true, follow: true },
    keywords: [
      event.title ?? "",
      event.city ? `${event.city} events` : "events India",
      "event tickets",
      "Hoizr",
    ].filter(Boolean),
    openGraph: {
      type: "article",
      title,
      description: desc,
      url: canonicalUrl,
      siteName: "Hoizr",
      locale: "en_IN",
      images: image ? [{ url: image, alt: event.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: image ? [image] : undefined,
    },
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const event = await fetchEvent(params.slug);
  if (!event) notFound();
  const [people, detailLookups] = await Promise.all([
    fetchPeople(event._id),
    fetchDetailLookups(),
  ]);
  return (
    <>
      <FreshnessRevalidate />
      <EventJsonLd event={event} artists={people.artists} />
      <BreadcrumbJsonLd
        items={[
          { name: "Hoizr", href: "/" },
          { name: "Events", href: "/events" },
          { name: event.title ?? "Event", href: `/events/${event.slug ?? event._id}` },
        ]}
      />
      <EventDetailClient
        event={event}
        people={people}
        detailLookups={detailLookups}
      />
    </>
  );
}
