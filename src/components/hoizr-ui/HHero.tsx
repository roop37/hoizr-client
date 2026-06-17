"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { DisplayEvent } from "@/lib/event-display";
import { formatPrice } from "@/lib/event-display";
import { HICONS } from "./icons";

type Props = {
  event: DisplayEvent;
  /** Organizing account name — shown as the hero eyebrow instead of the
   *  generic series tag when available. */
  hostName?: string | null;
};

export const HHero = ({ event, hostName }: Props) => {
  const router = useRouter();
  const href = `/events/${event.slug}`;
  return (
    <section
      className="h-hero"
      role="link"
      tabIndex={0}
      onClick={() => router.push(href)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(href);
        }
      }}
      aria-label={`Open ${event.title}`}
    >
      {/* Hero uses the landscape flyer directly. Home page filters the
          feed to landscape-only events before reaching here, so the
          portrait fallback is never hit on the live site; the gradient
          stub remains as a defensive no-image branch. */}
      {event.horizontalImage ? (
        <img
          className="bg"
          src={event.horizontalImage}
          alt={event.title}
        />
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: event.imageStyle,
            zIndex: 0,
          }}
        />
      )}
      <div className="scrim" />
      <div className="h-hero-tag">
        <i />
        TRENDING NOW
      </div>
      <div className="h-hero-body">
        <div>
          <div className="eye">{hostName || event.series}</div>
          <h1>{event.title}</h1>
          {event.sub ? <p>{event.sub}</p> : null}
        </div>
        <div className="h-hero-card" onClick={(e) => e.stopPropagation()}>
          <div className="kv">
            <div className="k">When</div>
            <div className="v">
              {event.date}
              {event.startTime ? ` · ${event.startTime}` : ""}
            </div>
          </div>
          <div className="kv">
            <div className="k">Where</div>
            <div className="v">{event.venueShort}</div>
          </div>
          <div className="kv">
            <div className="k">City</div>
            <div className="v">{event.city}</div>
          </div>
          <div className="kv">
            <div className="k">From</div>
            <div className="v">{formatPrice(event.fromPrice)}</div>
          </div>
          <Link href={href} className="h-btn h-btn-accent">
            <span style={{ display: "inline-flex" }}>{HICONS.ticket}</span>
            <span>Get tickets</span>
          </Link>
        </div>
      </div>
    </section>
  );
};
