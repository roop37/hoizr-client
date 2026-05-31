import type { MetadataRoute } from "next";
import { fetchPublicArtists, fetchPublishedEvents } from "@/lib/home-data";

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

  const [eventsList, artistsList] = await Promise.all([
    fetchPublishedEvents({ pageSize: 200 }),
    fetchPublicArtists(200),
  ]);

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

  return [...staticRoutes, ...eventRoutes, ...artistRoutes];
}
