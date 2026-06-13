import type { Metadata } from "next";
import {
  BreadcrumbJsonLd,
  CollectionPageJsonLd,
} from "@/components/hoizr-ui/seo/JsonLd";
import VenuesListClient from "@/components/hoizr-ui/VenuesListClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hoizr.com";

export const metadata: Metadata = {
  title: "Venues on Hoizr — clubs, festival grounds & comedy rooms across India",
  description:
    "Discover the rooms behind the nights — clubs, lounges, comedy basements, and festival grounds across Mumbai, Bengaluru, Delhi, Pune, Hyderabad, Chennai, Goa, and Kolkata.",
  keywords: [
    "venues India",
    "clubs India",
    "comedy clubs India",
    "festival grounds India",
    "nightlife venues India",
    "music venues India",
    "Hoizr venues",
  ],
  alternates: {
    canonical: "/venues",
    languages: { "en-IN": "/venues", "x-default": "/venues" },
  },
  openGraph: {
    type: "website",
    siteName: "Hoizr",
    locale: "en_IN",
    title: "Venues on Hoizr",
    description:
      "Clubs, lounges, comedy basements, festival grounds — the rooms behind the nights.",
    url: "/venues",
    images: [
      {
        url: "/opengraph-image.webp",
        width: 1200,
        height: 630,
        alt: "Venues on Hoizr — clubs, lounges, festival grounds across India",
      },
    ],
  },
  robots: { index: true, follow: true },
};

export const dynamic = "force-dynamic";

export default function VenuesPage() {
  return (
    <div className="h-page">
      <BreadcrumbJsonLd
        items={[
          { name: "Hoizr", href: "/" },
          { name: "Venues", href: "/venues" },
        ]}
      />
      <CollectionPageJsonLd
        name="Venues on Hoizr"
        description="Clubs, lounges, comedy basements, and festival grounds across India on Hoizr."
        href={`${SITE_URL}/venues`}
        items={[]}
      />
      <div className="h-page-head">
        <div>
          <div className="label">Venues on Hoizr</div>
          <h1>The rooms behind the nights.</h1>
        </div>
      </div>

      <VenuesListClient />
    </div>
  );
}
