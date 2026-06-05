"use client";

import Link from "next/link";
import type { DisplayEvent } from "@/lib/event-display";
import { formatPrice } from "@/lib/event-display";

type Props = {
  event: DisplayEvent;
};

const formatDateTimeLabel = (event: DisplayEvent): string => {
  if (!event.startDateISO) return event.dateLong || event.date || "Date pending";
  const start = new Date(event.startDateISO);
  if (Number.isNaN(start.getTime())) return event.dateLong || event.date || "Date pending";
  const weekday = new Intl.DateTimeFormat("en-IN", { weekday: "short" }).format(start);
  const day = new Intl.DateTimeFormat("en-IN", { day: "2-digit" }).format(start);
  const month = new Intl.DateTimeFormat("en-IN", { month: "short" }).format(start);
  const time = new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(start);
  return `${weekday}, ${day} ${month}, ${time}`;
};

/**
 * Canonical event card. The card slot is a fixed 3:4 portrait frame —
 * landscape images shown here would either letterbox or distort the
 * grid, so we ALWAYS render the portrait flyer (eventFlyer) regardless
 * of whether the event also has a landscape (horizontalFlyer) asset.
 * The landscape asset is reserved for the featured hero rail and the
 * event detail page.
 */
export const EventCard = ({ event }: Props) => {
  const dateTime = formatDateTimeLabel(event);
  const price = formatPrice(event.fromPrice);
  const priceSuffix = price === "Guestlist" || price === "Free" ? "" : " onwards";
  const cardImage = event.portraitImage ?? event.image;
  return (
    <Link href={`/events/${event.slug}`} className="h-tile">
      <div className="h-tile-flyer">
        {event.videoSneakPeek ? (
          <video
            src={event.videoSneakPeek}
            muted
            playsInline
            autoPlay
            loop
            aria-label={event.title}
          />
        ) : cardImage ? (
          <img
            src={cardImage}
            alt={event.title}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div
            className="h-tile-flyer-fallback"
            style={{ background: event.imageStyle }}
            aria-hidden
          />
        )}
      </div>
      <div className="h-tile-info">
        <span className="h-tile-date">{dateTime}</span>
        <h3 className="h-tile-title">{event.title}</h3>
        <p className="h-tile-venue">
          {event.venueShort}
          {event.city ? ` | ${event.city}` : ""}
        </p>
        <p className="h-tile-price">
          {price}
          {priceSuffix}
        </p>
      </div>
    </Link>
  );
};
