import { fetchPublishedEvents } from "@/lib/home-data";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hoizr.com";

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const absoluteUrl = (path: string): string =>
  path.startsWith("http") ? path : `${SITE_URL}${path}`;

const pubDate = (date?: string): string => {
  const parsed = date ? new Date(date) : new Date();
  return Number.isNaN(parsed.getTime())
    ? new Date().toUTCString()
    : parsed.toUTCString();
};

export async function buildEventsRss(selfPath = "/rss.xml") {
  const list = await fetchPublishedEvents({ pageSize: 50 });
  const items = list.events
    .filter((event) => event.slug)
    .map((event) => {
      const url = `${SITE_URL}/events/${event.slug}`;
      const image = event.horizontalFlyer ?? event.eventFlyer;
      const title = event.title ?? "Hoizr event";
      const description =
        event.description ??
        `${title}${event.city ? ` in ${event.city}` : ""} on Hoizr.`;

      return [
        "<item>",
        `<title>${escapeXml(title)}</title>`,
        `<link>${url}</link>`,
        `<guid isPermaLink="true">${url}</guid>`,
        `<description>${escapeXml(description)}</description>`,
        `<pubDate>${pubDate(event.startDate)}</pubDate>`,
        event.city ? `<category>${escapeXml(event.city)}</category>` : "",
        image ? `<enclosure url="${escapeXml(absoluteUrl(image))}" type="image/jpeg" />` : "",
        "</item>",
      ]
        .filter(Boolean)
        .join("");
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Hoizr Events</title>
    <link>${SITE_URL}/events</link>
    <atom:link href="${SITE_URL}${selfPath}" rel="self" type="application/rss+xml" />
    <description>Fresh concerts, festivals, club nights, comedy, and live music events across India.</description>
    <language>en-IN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;
}

export async function eventsRssResponse(selfPath = "/rss.xml") {
  return new Response(await buildEventsRss(selfPath), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=1800",
    },
  });
}
