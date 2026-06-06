import type { Metadata } from "next";
import Link from "next/link";
import { RailHead } from "@/components/hoizr-ui/RailHead";
import { GenreCollectionCard } from "@/components/hoizr-ui/GenreCollectionCard";
import { EventCard } from "@/components/hoizr-ui/EventCard";
import { HTicker } from "@/components/hoizr-ui/HTicker";
import { DomeGallery } from "@/components/hoizr-ui/DomeGallery";
import { HHero } from "@/components/hoizr-ui/HHero";
import { CollectionPageJsonLd } from "@/components/hoizr-ui/seo/JsonLd";
import { FreshnessRevalidate } from "@/components/hoizr-ui/FreshnessRevalidate";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hoizr.com";

// Title + most metadata inherit from `app/layout.tsx`. The home page
// only needs to add a CollectionPageJsonLd (below) and confirm the
// canonical "/" + language alternates resolve to the right URL.
export const metadata: Metadata = {
  alternates: {
    canonical: "/",
    languages: { "en-IN": "/", "x-default": "/" },
  },
};
// HFooter is now rendered once at the layout level so it can pin to the
// bottom of short pages. Page-level renders removed.
import {
  fetchCustomerMasters,
  fetchPublicArtists,
  fetchPublishedEvents,
} from "@/lib/home-data";
import { toDisplayEvent } from "@/lib/event-display";
import type { DisplayEvent } from "@/lib/event-display";

export const dynamic = "force-dynamic";

const COMING_SOON_EVENT_EXAMPLES = [
  {
    title: "Neon Room Friday",
    meta: "Club night · Andheri",
    price: "From ₹799",
    image:
      "/eventflyers/ChatGPT%20Image%20May%2024%2C%202026%2C%2010_49_08%20PM%20(1).png",
  },
  {
    title: "Laughs After Dark",
    meta: "Comedy · Bandra",
    price: "From ₹499",
    image:
      "/eventflyers/ChatGPT%20Image%20May%2024%2C%202026%2C%2010_49_09%20PM%20(2).png",
  },
  {
    title: "Warehouse Social",
    meta: "Party · Colaba",
    price: "Guestlist live",
    image:
      "/eventflyers/ChatGPT%20Image%20May%2024%2C%202026%2C%2010_49_09%20PM%20(3).png",
  },
] as const;

export default async function HomePage() {
  const [eventsRes, artistsRes, masters] = await Promise.all([
    fetchPublishedEvents({ pageSize: 24 }),
    fetchPublicArtists(32),
    fetchCustomerMasters(),
  ]);
  // Home feed shows ONLY events that ship with a landscape flyer.
  // The new home design (Apple-Music-style hero + landscape tile rails)
  // composes around the 16:9 asset; portrait-only events look broken in
  // both the hero scrim and the rail cards, so we drop them at the
  // source rather than render letterboxed fallbacks. Hosts opt in by
  // uploading a landscape image on the event-journey "Additional" step.
  const all: DisplayEvent[] = eventsRes.events
    .map(toDisplayEvent)
    .filter((e) => Boolean(e.horizontalImage));

  if (all.length === 0) {
    return (
      <div className="h-page">
        <CollectionPageJsonLd
          name="Hoizr — Live music, comedy, club nights & festivals across India"
          description="Hoizr is in pre-launch — onboarding India's clubs, comedy rooms, party crews, festivals, and venues. Tickets land here the moment they go on sale."
          href="/"
        />
        <section className="h-coming-soon">
          <div className="h-coming-soon__card">
            <div className="h-coming-soon__copy">
              <div className="h-coming-soon__kicker">Coming soon</div>
              <h2>The first nights drop here.</h2>
              <p>
                Hoizr is in pre-launch. We&rsquo;re onboarding India&rsquo;s
                clubs, comedy rooms, party crews, festivals, and venues —
                tickets land here the moment they go on sale.
              </p>
              <div className="h-coming-soon__row">
                <Link
                  href="https://business.hoizr.com"
                  target="_blank"
                  rel="noreferrer"
                  className="h-btn h-btn-accent h-btn-coming h-btn-coming--simple"
                >
                  List your event
                </Link>
                <a
                  href="https://www.instagram.com/hoizr.technologies"
                  target="_blank"
                  rel="noreferrer"
                  className="h-btn h-btn-outline h-btn-coming"
                >
                  Follow on Instagram
                </a>
              </div>
              <div className="h-coming-soon__meta">
                Questions? Email{" "}
                <a href="mailto:contact@hoizr.com">contact@hoizr.com</a>{" "}
                · Call{" "}
                <a href="tel:+918369572945">+91 83695 72945</a>{" "}
                ·{" "}
                <a
                  href="https://wa.me/918369572945"
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>
              </div>
            </div>
            <div className="h-coming-soon__preview" aria-label="Example Hoizr event cards">
              {COMING_SOON_EVENT_EXAMPLES.map((example) => (
                <article className="h-coming-event-card" key={example.title}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={example.image} alt={`${example.title} event flyer preview`} />
                  <div className="h-coming-event-card__body">
                    <h3>{example.title}</h3>
                    <p>{example.meta}</p>
                    <span>{example.price}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  // `all` is already filtered to landscape-only above, so any event in
  // the pool is a valid hero candidate. Prefer the first high-demand
  // one; fall back to the first overall so the home always opens with
  // something on top.
  const heroEvent = all.find((e) => e.isHighDemand) ?? all[0];
  const others = all.filter((e) => e.id !== heroEvent.id);

  // Genres collection rail — surface the full active genre catalogue
  // (same list the event-journey "Genre" picker uses on business-client)
  // so the home page reads as a complete map of vibes, not just the
  // ones with live inventory tonight. The rail is horizontally
  // scrollable; the `h-bleed` modifier lets it scroll UNDER the
  // sidebar on the left.
  const liveGenres = masters.genres;

  const ticker = all
    .slice(0, 6)
    .map(
      (e) =>
        `${e.title} · ${e.city} · ${e.date}${
          e.fromPrice ? ` · from ₹${e.fromPrice.toLocaleString("en-IN")}` : ""
        }`
    );

  return (
    <div className="h-page">
      <FreshnessRevalidate />
      <CollectionPageJsonLd
        name="Hoizr — Live music, comedy, club nights & festivals across India"
        description="Discover and book tickets for concerts, festivals, club nights, comedy, and live music across India on Hoizr."
        href="/"
        items={all.slice(0, 24).map((e) => ({
          url: `${SITE_URL}/events/${e.slug}`,
          name: e.title,
        }))}
      />
      {/* Compact "SELLING NOW" single-card hero. Reverted to HHero from
          the previously-shipped FeaturedHorizontalRail because the
          rail version rendered each card at full landscape size and
          dominated the viewport. HHero is one card with built-in
          progression through the landscape-flyer pool. */}
      <HHero event={heroEvent} />

      {liveGenres.length > 0 ? (
        <div className="h-rail-sec">
          <RailHead title="Browse by vibe" seeAllHref="/events" />
          <div className="h-rail h-rail-5">
            {liveGenres.map((g) => (
              <GenreCollectionCard key={g._id} genre={g} />
            ))}
          </div>
        </div>
      ) : null}

      <div className="h-rail-sec">
        <RailHead title="Tonight" seeAllHref="/events" />
        <div className="h-rail h-rail-5">
          {others.slice(0, 8).map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      </div>

      {ticker.length > 0 ? <HTicker lines={ticker} /> : null}

      {others.length > 4 ? (
        <div className="h-rail-sec">
          <RailHead title="Recently Added" seeAllHref="/events" />
          <div className="h-rail h-rail-5">
            {[...others]
              .reverse()
              .slice(0, 8)
              .map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
          </div>
        </div>
      ) : null}

      {artistsRes.artists.length > 0 ? (
        <section className="h-dome-section">
          <div className="h-dome-head">
            <h2>Artists on Hoizr</h2>
            <span className="sub">Drag to rotate · click to follow</span>
          </div>
          <DomeGallery artists={artistsRes.artists} />
        </section>
      ) : null}
    </div>
  );
}
