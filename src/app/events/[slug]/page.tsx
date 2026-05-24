import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventDetailClient } from "@/components/hoizr-ui/EventDetailClient";
import { TrackView } from "@/components/analytics/TrackView";
import { BreadcrumbJsonLd, EventJsonLd } from "@/components/hoizr-ui/seo/JsonLd";
import { gqlRequest } from "@/lib/graphql";
import { PUBLIC_EVENT_BY_SLUG_QUERY } from "@/lib/queries";
import type { PublicEvent } from "@/types/event";

export const dynamic = "force-dynamic";

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

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const event = await fetchEvent(params.slug);
  if (!event) return { title: "Event not found" };
  const desc = event.description?.slice(0, 160) ?? `Book tickets for ${event.title} on Hoizr.`;
  const canonical = `/events/${event.slug ?? params.slug}`;
  return {
    title: event.title,
    description: desc,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title: event.title,
      description: desc,
      url: canonical,
      images: event.eventFlyer ? [{ url: event.eventFlyer, alt: event.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description: desc,
      images: event.eventFlyer ? [event.eventFlyer] : undefined,
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
  return (
    <>
      <EventJsonLd event={event} />
      <BreadcrumbJsonLd
        items={[
          { name: "Hoizr", href: "/" },
          { name: "Events", href: "/events" },
          { name: event.title ?? "Event", href: `/events/${event.slug ?? event._id}` },
        ]}
      />
      <TrackView
        event="eventDetailView"
        payload={{
          eventId: event._id,
          hostId: (event as unknown as { hostId?: string }).hostId,
          metadata: {
            slug: event.slug,
            city: event.city,
            ticketingEnabled: event.ticketingEnabled,
          },
        }}
      />
      <EventDetailClient event={event} />
    </>
  );
}
