import Link from "next/link";
import type { DisplayEvent } from "@/lib/event-display";
import { formatPrice } from "@/lib/event-display";
import { HICONS } from "./icons";
import { RailHead } from "./RailHead";

type Props = {
  events: DisplayEvent[];
};

/**
 * Top-of-home horizontal hero rail. Only renders events that have a
 * `horizontalFlyer` uploaded (the 16:9 landscape asset hosts can
 * optionally add on the Additional step). When no event has one, the
 * parent should not render this component — we don't show a fallback
 * here because the regular 4:5 grid below already covers those events.
 */
export const FeaturedHorizontalRail = ({ events }: Props) => {
  if (events.length === 0) return null;
  return (
    <div className="h-rail-sec h-feat">
      <div className="h-rail-head h-feat__head">
        <RailHead title="Featured" />
      </div>
      <div className="h-rail h-feat__rail">
        {events.map((event) => (
          <Link key={event.id} href={`/events/${event.slug}`} className="h-feat__card">
            <div className="h-feat__media">
              {event.horizontalImage ? (
                <img src={event.horizontalImage} alt={event.title} />
              ) : null}
              <div className="h-feat__scrim" />
              <span className="h-feat__badge">{event.badge}</span>
            </div>
            <div className="h-feat__overlay">
              <div className="h-feat__date">{event.date}</div>
              <div className="h-feat__title">{event.title}</div>
              <div className="h-feat__meta">
                <span className="h-feat__venue">
                  <span style={{ display: "inline-flex" }}>{HICONS.pin}</span>
                  <span>
                    {event.venueShort}
                    {event.city ? ` · ${event.city}` : ""}
                  </span>
                </span>
                <span className="h-feat__price">{formatPrice(event.fromPrice)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
