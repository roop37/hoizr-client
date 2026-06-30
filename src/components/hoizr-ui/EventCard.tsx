"use client";

import Link from "next/link";
import type { DisplayEvent } from "@/lib/event-display";
import { formatPrice } from "@/lib/event-display";
import { coordToLatLng, formatKmBadge, kmBetween, sameCity } from "@/lib/geo";
import { useAuthStore } from "@/store/auth";

type Props = {
  event: DisplayEvent;
  /** Zero-based index within the rendered list. Kept for callers; list
   *  impressions are no longer tracked as a discrete analytics event
   *  (derived from `pageView` at report time). */
  position?: number;
};

const formatDateTimeLabel = (event: DisplayEvent): string => {
  if (!event.startDateISO) return event.dateLong || event.date || "Date pending";
  const start = new Date(event.startDateISO);
  if (Number.isNaN(start.getTime())) return event.dateLong || event.date || "Date pending";
  const weekday = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
  }).format(start);
  const day = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
  }).format(start);
  const month = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    month: "short",
  }).format(start);
  const time = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
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
  // A guestlist-only event reads as "RSVP", not "Free" — guests register, they
  // don't buy. Everything else uses the normal price label.
  const price = event.isRsvpOnly ? "RSVP" : formatPrice(event.fromPrice);
  const priceSuffix = price === "RSVP" || price === "Free" ? "" : " onwards";
  const cardImage = event.portraitImage ?? event.image;

  // Distance badge: shown only when the user has a saved address with
  // a coordinate, the event has its own venue coord, AND they're in
  // the same city (manual entries with no lat/lng intentionally suppress
  // the badge — a wrong km figure is worse than no figure).
  const userAddress = useAuthStore((s) => s.profile?.address);
  const distanceLabel = (() => {
    if (!userAddress) return null;
    if (!sameCity(userAddress.city, event.city)) return null;
    const userLatLng = coordToLatLng(userAddress.coordinate);
    return formatKmBadge(kmBetween(userLatLng, event.coordinate));
  })();

  return (
    <Link href={`/events/${event.slug}`} className="h-tile">
      <div className="h-tile-flyer">
        {distanceLabel ? (
          <span className="h-tile-distance" aria-label={`${distanceLabel} from you`}>
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M12 22s7-7.8 7-13a7 7 0 1 0-14 0c0 5.2 7 13 7 13Z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
            {distanceLabel}
          </span>
        ) : null}
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
