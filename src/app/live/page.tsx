import type { Metadata } from "next";
import Link from "next/link";
import { EventTile } from "@/components/hoizr-ui/EventTile";
// HFooter now rendered at the layout level.
import { RailHead } from "@/components/hoizr-ui/RailHead";
import { BreadcrumbJsonLd, CollectionPageJsonLd } from "@/components/hoizr-ui/seo/JsonLd";
import { fetchPublishedEvents } from "@/lib/home-data";
import { toDisplayEvent } from "@/lib/event-display";

export const metadata: Metadata = {
  title: "Live tonight",
  description:
    "Events happening tonight across India. Doors open in the next few hours — book now, scan at the gate.",
  alternates: { canonical: "/live" },
  openGraph: {
    title: "Live tonight on Hoizr",
    description: "Tonight's events across India.",
    url: "/live",
    type: "website",
  },
};
export const dynamic = "force-dynamic";

const isToday = (iso?: string) => {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return d.toDateString() === now.toDateString();
};

const isThisWeek = (iso?: string) => {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= -1 && diff <= 7;
};

export default async function LivePage() {
  const list = await fetchPublishedEvents({ pageSize: 48 });
  const liveToday = list.events.filter((e) => isToday(e.startDate)).map(toDisplayEvent);
  const upcoming = list.events
    .filter((e) => !isToday(e.startDate) && isThisWeek(e.startDate))
    .map(toDisplayEvent);

  return (
    <div className="h-page">
      <CollectionPageJsonLd
        name="Live tonight on Hoizr"
        description="Events happening tonight across India."
        href="/live"
      />
      <BreadcrumbJsonLd items={[{ name: "Hoizr", href: "/" }, { name: "Live tonight", href: "/live" }]} />
      <div className="h-page-head">
        <div>
          <div className="label">Live in your city</div>
          <h1>Happening today.</h1>
          <p style={{ color: "var(--h-ink-2)", maxWidth: "56ch", margin: "10px 0 0", fontSize: 14 }}>
            Doors open in the next few hours. Book now, scan at the gate.
          </p>
        </div>
        <div className="right">
          <span className="h-chip active" style={{ padding: "7px 12px" }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: 999,
                background: "var(--h-volt)",
                marginRight: 6,
              }}
            />
            {liveToday.length} live tonight
          </span>
        </div>
      </div>

      {liveToday.length === 0 ? (
        <div className="h-empty">
          Nothing live in your city today.{" "}
          <Link href="/events" className="h-btn-text" style={{ color: "var(--h-accent)" }}>
            See upcoming events
          </Link>
        </div>
      ) : (
        <div className="h-live-grid">
          {liveToday.map((e) => (
            <EventTile key={e.id} event={e} />
          ))}
        </div>
      )}

      {upcoming.length > 0 ? (
        <div className="h-rail-sec">
          <RailHead title="Coming up this week" seeAllHref="/events" />
          <div className="h-rail h-rail-5">
            {upcoming.map((e) => (
              <EventTile key={e.id} event={e} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
