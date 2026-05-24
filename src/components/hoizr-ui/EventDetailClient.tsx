"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { PublicEvent } from "@/types/event";
import { toDisplayEvent } from "@/lib/event-display";
import { HICONS } from "./icons";
// HFooter rendered once at the layout level.
import { EventBookingPanel } from "@/app/events/[slug]/EventBookingPanel";

type Props = {
  event: PublicEvent;
};

export const EventDetailClient = ({ event }: Props) => {
  const router = useRouter();
  const display = toDisplayEvent(event);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [event._id]);

  return (
    <div className="h-page h-detail">
      <button type="button" className="h-detail-back" onClick={() => router.back()}>
        <span style={{ display: "inline-flex" }}>{HICONS.chevL}</span>
        <span>Back</span>
      </button>

      <h1 className="h-detail-title">{display.title}</h1>
      <div className="h-detail-line">
        <span className="date">
          {display.date}
          {display.startTime ? `, ${display.startTime}` : ""}
        </span>
        <span className="sep">|</span>
        <span>{display.venueLong}</span>
      </div>

      <div className="h-banner">
        <div className="h-banner-bg">
          {display.image ? (
            <img src={display.image} alt={display.title} />
          ) : (
            <div style={{ position: "absolute", inset: 0, background: display.imageStyle, opacity: 0.55 }} />
          )}
        </div>
        <div className="h-banner-poster">
          {display.image ? (
            <img src={display.image} alt={display.title} />
          ) : (
            <div style={{ position: "absolute", inset: 0, background: display.imageStyle }} />
          )}
        </div>
      </div>

      <div className="h-detail-grid">
        <div>
          {display.about ? (
            <div className="h-detail-section">
              <h2>About</h2>
              <p style={{ whiteSpace: "pre-line" }}>{display.about}</p>
            </div>
          ) : null}

          <div className="h-detail-section">
            <h2>When &amp; where</h2>
            <p>
              {display.dateLong}
              {display.startTime ? ` · ${display.startTime}` : ""}
              {display.endTime ? ` — ${display.endTime}` : ""}
            </p>
            <p>{display.venueLong}</p>
          </div>

          <div className="h-detail-section">
            <h2>Things to know</h2>
            <div className="h-things">
              <div className="h-thing">
                <span className="ic">{HICONS.ticket}</span>
                <span>
                  {display.ticketingEnabled
                    ? "Online tickets available — instant QR after payment"
                    : "Guestlist / on-ground entry"}
                </span>
              </div>
              <div className="h-thing">
                <span className="ic">{HICONS.pin}</span>
                <span>{display.venueLong}</span>
              </div>
              <div className="h-thing">
                <span className="ic">{HICONS.clock}</span>
                <span>
                  Starts {display.startTime || "TBA"}
                  {display.endTime ? ` · Ends ${display.endTime}` : ""}
                </span>
              </div>
              {display.isHighDemand ? (
                <div className="h-thing">
                  <span className="ic">{HICONS.fav}</span>
                  <span>High demand — book early to secure your slot</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="h-detail-section">
            <h2>Venue</h2>
            <p>{display.venueLong}. Cashless bar — UPI / card only. Re-entry not permitted.</p>
          </div>

          <p style={{ fontSize: 12, color: "var(--h-ink-3)" }}>
            Ticketing by Hoizr. The event itself is run by the organiser — Hoizr is not the event organiser.
          </p>
        </div>

        <aside className="h-book">
          <EventBookingPanel event={event} />
        </aside>
      </div>
    </div>
  );
};
