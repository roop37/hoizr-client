"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { DisplayEvent } from "@/lib/event-display";
import { formatPrice } from "@/lib/event-display";
import { HICONS } from "./icons";

type Props = {
  event: DisplayEvent;
};

export const HHero = ({ event }: Props) => {
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
      {event.image ? (
        <img className="bg" src={event.image} alt={event.title} />
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
        SELLING NOW
      </div>
      <div className="h-hero-body">
        <div>
          <div className="eye">{event.series}</div>
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
