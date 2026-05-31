import type { PublicEvent } from "@/types/event";
import type { PublicArtistProfile } from "@/types/artist";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hoizr.com";
const ORG_NAME = "Hoizr";
const LEGAL_NAME = "Hoizr Technologies Pvt. Ltd.";
const LOGO_URL = `${SITE_URL}/logo/logoDark.png`;

const HOIZR_FAMILY = [
  { "@type": "Organization", name: "Hoizr", url: "https://hoizr.com" },
  { "@type": "Organization", name: "Hoizr Business", url: "https://business.hoizr.com" },
  { "@type": "Organization", name: "Hoizr Artist", url: "https://artist.hoizr.com" },
  { "@type": "Organization", name: "Hoizr Promoters", url: "https://promoters.hoizr.com" },
];

const ldScript = (id: string, data: object) => (
  <script
    id={id}
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify(data).replace(/</g, "\\u003c"),
    }}
  />
);

export const OrganizationJsonLd = () =>
  ldScript("hoizr-organization-jsonld", {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: ORG_NAME,
    legalName: LEGAL_NAME,
    url: SITE_URL,
    logo: LOGO_URL,
    description:
      "Hoizr is India's live-night technology company. The Hoizr family covers Hoizr (consumer ticketing), Hoizr Business (organizer and venue tools), Hoizr Artist (performer profiles), and Hoizr Promoters (coming soon).",
    parentOrganization: {
      "@type": "Organization",
      name: LEGAL_NAME,
      url: SITE_URL,
    },
    subOrganization: HOIZR_FAMILY,
    sameAs: [
      "https://business.hoizr.com",
      "https://artist.hoizr.com",
      "https://www.instagram.com/hoizr.technologies",
    ],
    areaServed: { "@type": "Country", name: "India" },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "contact@hoizr.com",
        telephone: "+91-83695-72945",
        areaServed: "IN",
        availableLanguage: ["en", "hi"],
      },
      {
        "@type": "ContactPoint",
        contactType: "technical support",
        email: "tech@hoizr.com",
        areaServed: "IN",
        availableLanguage: ["en"],
      },
    ],
  });

export const WebSiteJsonLd = () =>
  ldScript("hoizr-website-jsonld", {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: ORG_NAME,
    url: SITE_URL,
    inLanguage: "en-IN",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  });

export const BreadcrumbJsonLd = ({
  items,
}: {
  items: { name: string; href: string }[];
}) =>
  ldScript("hoizr-breadcrumb-jsonld", {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.href}`,
    })),
  });

export const EventJsonLd = ({ event }: { event: PublicEvent }) => {
  const locationLine =
    event.location?.formattedAddress ?? event.location?.addressLine1 ?? event.city ?? "India";
  const offers = (event.tickets ?? [])
    .filter((t) => t.ticketVisible !== false)
    .map((t) => ({
      "@type": "Offer",
      name: t.ticketName,
      price: t.ticketPrice,
      priceCurrency: "INR",
      url: `${SITE_URL}/events/${event.slug ?? event._id}`,
      availability:
        t.ticketSold >= t.ticketCapacity
          ? "https://schema.org/SoldOut"
          : "https://schema.org/InStock",
    }));

  return ldScript(`hoizr-event-${event._id}-jsonld`, {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title ?? "Hoizr event",
    description: event.description ?? undefined,
    image: event.horizontalFlyer ?? event.eventFlyer ?? undefined,
    startDate: event.startDate ?? undefined,
    endDate: event.endDate ?? undefined,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: locationLine,
      address: {
        "@type": "PostalAddress",
        streetAddress: event.location?.addressLine1,
        addressLocality: event.location?.city ?? event.city,
        addressRegion: event.location?.state,
        postalCode: event.location?.pincode,
        addressCountry: "IN",
      },
    },
    organizer: { "@type": "Organization", name: ORG_NAME, url: SITE_URL },
    offers: offers.length ? offers : undefined,
    inLanguage: "en-IN",
  });
};

export const ArtistJsonLd = ({ artist }: { artist: PublicArtistProfile }) => {
  const name = `${artist.firstName} ${artist.lastName}`.trim();
  const sameAs = [
    artist.instagramLink,
    artist.spotifyLink,
    artist.youtubeLink,
    artist.soundcloudLink,
    artist.appleMusicLink,
    artist.twitterLink,
  ].filter(Boolean);
  return ldScript(`hoizr-artist-${artist._id}-jsonld`, {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    name,
    description: artist.bio ?? artist.tagline ?? undefined,
    image: artist.profilePhoto ?? undefined,
    genre: artist.genres ?? undefined,
    sameAs,
    url: `${SITE_URL}/artist/${artist.slug ?? artist._id}`,
  });
};

export const CollectionPageJsonLd = ({
  name,
  description,
  href,
  items,
}: {
  name: string;
  description: string;
  href: string;
  /**
   * Optional list of items to embed as a Schema.org ItemList under
   * `mainEntity`. Used by index pages (/artists, /events, /) so the
   * page advertises both the collection metadata and the entries.
   */
  items?: { url: string; name: string }[];
}) =>
  ldScript(`hoizr-collection-${href.replace(/\W+/g, "-")}-jsonld`, {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: `${SITE_URL}${href}`,
    isPartOf: { "@type": "WebSite", name: ORG_NAME, url: SITE_URL },
    inLanguage: "en-IN",
    ...(items?.length
      ? {
          mainEntity: {
            "@type": "ItemList",
            name,
            numberOfItems: items.length,
            itemListElement: items.map((item, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: item.url,
              name: item.name,
            })),
          },
        }
      : {}),
  });
