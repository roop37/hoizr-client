"use client";

import Link from "next/link";
import type { DisplayEvent } from "@/lib/event-display";
import { formatPrice } from "@/lib/event-display";
import { HICONS } from "./icons";

type Props = {
  event: DisplayEvent;
};

/**
 * Canonical event card used everywhere events are listed — events
 * page, search, live, marquees on /live, related sections, etc.
 * Tall 4:5 poster with a glass info strip pinned to the bottom
 * showing date, title, venue, city and price.
 */
export const EventCard = ({ event }: Props) => (
  <Link href={`/events/${event.slug}`} className="h-tile">
    <div className="cover">
      {event.image ? (
        <img src={event.image} alt={event.title} />
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: event.imageStyle,
          }}
        />
      )}
      <div className="meta-top">
        <span className="badge">{event.badge}</span>
        <button
          type="button"
          className="fav"
          aria-label="Save"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {HICONS.fav}
        </button>
      </div>

      <div className="glass-strip">
        <div className="row">
          <div className="title-block">
            <span className="date-tag">{event.date}</span>
            <span className="title">{event.title}</span>
          </div>
          <span className="price">{formatPrice(event.fromPrice)}</span>
        </div>
        <div className="venue">
          <span className="venue-ic">{HICONS.pin}</span>
          <span className="venue-text">
            {event.venueShort}
            {event.city ? ` · ${event.city}` : ""}
          </span>
        </div>
      </div>
    </div>
  </Link>
);
