import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TicketSelectionClient } from "./TicketSelectionClient";
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
  if (!event) return { title: "Tickets not found" };
  return {
    title: `Choose tickets — ${event.title}`,
    description: `Pick your tickets for ${event.title}${event.city ? ` in ${event.city}` : ""} and continue to checkout.`,
    robots: { index: false, follow: false },
  };
}

export default async function TicketSelectionPage({
  params,
}: {
  params: { slug: string };
}) {
  const event = await fetchEvent(params.slug);
  if (!event) notFound();
  return <TicketSelectionClient event={event} />;
}
