import Link from "next/link";
import { HHero } from "@/components/hoizr-ui/HHero";
import { RailHead } from "@/components/hoizr-ui/RailHead";
import { GenreCollectionCard } from "@/components/hoizr-ui/GenreCollectionCard";
import { EventTile } from "@/components/hoizr-ui/EventTile";
import { HTicker } from "@/components/hoizr-ui/HTicker";
import { DomeGallery } from "@/components/hoizr-ui/DomeGallery";
import { FeaturedHorizontalRail } from "@/components/hoizr-ui/FeaturedHorizontalRail";
// HFooter is now rendered once at the layout level so it can pin to the
// bottom of short pages. Page-level renders removed.
import {
  fetchCustomerMasters,
  fetchPublicArtists,
  fetchPublishedEvents,
} from "@/lib/home-data";
import { toDisplayEvent } from "@/lib/event-display";

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

  const all = eventsRes.events.map(toDisplayEvent);
  if (all.length === 0) {
    return (
      <div className="h-page">
        <div className="h-page-head">
          <div>
            <h1>Find the night.</h1>
          </div>
        </div>
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

  // Featured rail picks only events with a horizontalFlyer asset. The host
  // explicitly opts in by uploading one on the Additional step — without
  // it, the regular 4:5 grid below already covers the event.
  const featuredHorizontal = all.filter((e) => Boolean(e.horizontalImage)).slice(0, 6);

  // Hero picks the strongest signal we have. If a featured horizontal
  // event exists, prefer that; else the first high-demand; else the first.
  const heroEvent =
    featuredHorizontal[0] ?? all.find((e) => e.isHighDemand) ?? all[0];
  const others = all.filter((e) => e.id !== heroEvent.id);

  // Genres collection rail — only show genres that have at least one live
  // event right now so we never link customers to an empty filter result.
  const eventGenreIds = new Set(all.flatMap((e) => e.genreTagIds));
  const liveGenres = masters.genres
    .filter((g) => eventGenreIds.has(g._id))
    .slice(0, 8);

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
      {featuredHorizontal.length > 0 ? (
        <FeaturedHorizontalRail events={featuredHorizontal} />
      ) : null}

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
            <EventTile key={e.id} event={e} />
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
                <EventTile key={e.id} event={e} />
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
