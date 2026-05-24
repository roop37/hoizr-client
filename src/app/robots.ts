import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hoizr.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/events", "/events/", "/artist", "/artist/", "/artists", "/live", "/search", "/rss.xml", "/feed.xml", "/llms.txt"],
        disallow: [
          "/me",
          "/me/",
          "/orders",
          "/orders/",
          "/checkout",
          "/checkout/",
          "/login",
          "/api/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
