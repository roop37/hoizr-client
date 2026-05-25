import type { Metadata } from "next";
import Link from "next/link";
import { DomeGallery } from "@/components/hoizr-ui/DomeGallery";
// HFooter now rendered at the layout level so it can pin to bottom on
// short pages. Page-level renders removed.
import {
  BreadcrumbJsonLd,
  CollectionPageJsonLd,
} from "@/components/hoizr-ui/seo/JsonLd";
import { fetchPublicArtists } from "@/lib/home-data";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hoizr.com";

export const metadata: Metadata = {
  title: "Artists on Hoizr — DJs, comedians, bands & live performers in India",
  description:
    "Discover the artists on Hoizr — DJs, comedians, bands, and live performers across Mumbai, Bengaluru, Delhi, Hyderabad, Pune, Chennai, and Goa. Follow your favourites and never miss a show.",
  keywords: [
    "artists India",
    "DJs India",
    "live music India",
    "comedians India",
    "bands India",
    "follow artist India",
    "Hoizr artists",
  ],
  alternates: {
    canonical: "/artists",
    languages: { "en-IN": "/artists", "x-default": "/artists" },
  },
  openGraph: {
    type: "website",
    siteName: "Hoizr",
    locale: "en_IN",
    title: "Artists on Hoizr — DJs, comedians, bands & live performers in India",
    description:
      "Follow DJs, comedians, bands, and live performers across India. Never miss the next show.",
    url: "/artists",
    images: [
      {
        url: "/opengraph-image.webp",
        width: 1200,
        height: 630,
        alt: "Artists on Hoizr — DJs, comedians, bands and live performers in India",
      },
    ],
  },
};

export const dynamic = "force-dynamic";

export default async function ArtistsPage() {
  const res = await fetchPublicArtists(64);
  const artists = res.artists;

  return (
    <div className="h-page">
      <BreadcrumbJsonLd
        items={[
          { name: "Hoizr", href: "/" },
          { name: "Artists", href: "/artists" },
        ]}
      />
      <CollectionPageJsonLd
        name="Artists on Hoizr"
        description="Discover and follow DJs, comedians, bands, and live performers across India on Hoizr."
        href="/artists"
        items={artists.slice(0, 32).map((a) => ({
          url: `${SITE_URL}/artist/${a.slug ?? a._id}`,
          name: `${a.firstName} ${a.lastName}`.trim(),
        }))}
      />
      <div className="h-page-head">
        <div>
          <div className="label">Artists on Hoizr</div>
          <h1>People you should be hearing.</h1>
        </div>
      </div>
      {artists.length === 0 ? (
        <div className="h-empty">
          No artists live yet.{" "}
          <Link href="/events" className="h-btn-text" style={{ color: "var(--h-accent)" }}>
            Browse events
          </Link>
        </div>
      ) : (
        <section className="h-dome-section" style={{ height: 700, margin: "24px 0 0" }}>
          <div className="h-dome-head">
            <h2>The Hoizr dome</h2>
            <span className="sub">Drag to rotate · click to follow</span>
          </div>
          <DomeGallery artists={artists.length < 16 ? [...artists, ...artists, ...artists] : artists} />
        </section>
      )}
    </div>
  );
}
