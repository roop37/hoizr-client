import type { MetadataRoute } from "next";
import { fetchPublicArtists, fetchPublishedEvents } from "@/lib/home-data";
import { addressMatchesArea, CITY_AREAS, SEO_CITIES, citySlug } from "@/lib/city-slug";
import type { PublicEvent } from "@/types/event";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hoizr.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${siteUrl}/events`, lastModified: now, changeFrequency: "hourly", priority: 0.95 },
    { url: `${siteUrl}/live`, lastModified: now, changeFrequency: "hourly", priority: 0.85 },
    { url: `${siteUrl}/search`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${siteUrl}/artists`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/artist`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${siteUrl}/venues`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
  ];

  // Fetch all published events (for /events/<slug> routes) plus per-city
  // events, so location pages appear in the sitemap ONLY once they hold
  // real inventory. Empty location pages are noindexed at the page level;
  // keeping them out of the sitemap too means we only advertise canonical,
  // indexable URLs (no thin/duplicate doorway pages).
  const [eventsList, artistsList, cityEvents] = await Promise.all([
    fetchPublishedEvents({ pageSize: 200 }),
    fetchPublicArtists(200),
    Promise.all(
      SEO_CITIES.map(async (c) => ({
        slug: citySlug(c),
        events: (await fetchPublishedEvents({ city: c, pageSize: 200 })).events ?? [],
      }))
    ),
  ]);

  // Events store addresses as free text (no structured locality), so we
  // match a neighbourhood against the combined address haystack.
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

  // City landing pages — only cities that currently have events.
  const cityRoutes: MetadataRoute.Sitemap = cityEvents
    .filter((c) => c.events.length > 0)
    .map((c) => ({
      url: `${siteUrl}/events-in/${c.slug}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    }));

  // Neighbourhood pages — only areas with matching events.
  const areaRoutes: MetadataRoute.Sitemap = cityEvents.flatMap((c) =>
    (CITY_AREAS[c.slug] ?? [])
      .filter((a) => c.events.some((e) => addressMatchesArea(addressText(e), a)))
      .map((a) => ({
        url: `${siteUrl}/events-in/${c.slug}/${citySlug(a)}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.65,
      }))
  );

  const eventRoutes: MetadataRoute.Sitemap = eventsList.events
    .filter((e) => e.slug)
    .map((e) => ({
      url: `${siteUrl}/events/${e.slug}`,
      lastModified: e.startDate ? new Date(e.startDate) : now,
      changeFrequency: "daily",
      priority: e.isHighDemand ? 0.95 : 0.85,
    }));

  const artistRoutes: MetadataRoute.Sitemap = artistsList.artists
    .filter((a) => a.slug)
    .map((a) => ({
      url: `${siteUrl}/artist/${a.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
    }));

  return [
    ...staticRoutes,
    ...cityRoutes,
    ...areaRoutes,
    ...eventRoutes,
    ...artistRoutes,
  ];
}
