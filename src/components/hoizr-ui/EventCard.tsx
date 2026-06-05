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
 * Canonical event card. The flyer renders at its natural aspect ratio
 * with `object-fit: contain` so vertical posters AND horizontal flyers
 * both show fully — no zoom, no crop, no gradient overlays. The info
 * footer below uses the same translucent glass surface as the bottom
 * cart bar so the card belongs to the rest of the chrome.
 */
export const EventCard = ({ event }: Props) => {
  const dateTime = formatDateTimeLabel(event);
  const price = formatPrice(event.fromPrice);
  const priceSuffix = price === "Guestlist" || price === "Free" ? "" : " onwards";
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
        ) : event.image ? (
          <img
            src={event.image}
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
