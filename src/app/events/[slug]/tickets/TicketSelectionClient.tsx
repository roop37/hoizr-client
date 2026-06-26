"use client";

import { CalendarDays, ChevronLeft, MapPin } from "lucide-react";
import Link from "next/link";
import { EventBookingPanel } from "../EventBookingPanel";
import type { PublicEvent } from "@/types/event";

const formatWhen = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
};

/**
 * Standalone ticket selection page. Lives at /events/[slug]/tickets so
 * the event detail page only carries an "About + Book tickets" pitch —
 * the seat picker, total breakdown and "Continue to checkout" CTA are
 * scoped to this dedicated route. Selecting tickets here locks the cart
 * via setCart and then routes to /checkout?eventId=… exactly as the
 * inline panel used to, so the downstream checkout + Razorpay + polling
 * flow is unchanged.
 */
export const TicketSelectionClient = ({ event }: { event: PublicEvent }) => {
  const venueLine =
    event.location?.formattedAddress ??
    [event.location?.addressLine1, event.location?.city ?? event.city]
      .filter(Boolean)
      .join(", ");
  const heroFlyer = event.eventFlyer || event.horizontalFlyer || "";

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink text-cream">
      {/* Soft ambient flyer backdrop — full-bleed on every screen so the
          page colour matches the event edge-to-edge (no grey gap on the
          sides on mobile). */}
      {heroFlyer ? (
        <img
          src={heroFlyer}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 block h-full w-full scale-110 object-cover opacity-40 blur-3xl"
        />
      ) : null}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/85 to-ink" />

      <div className="relative mx-auto w-full max-w-3xl px-4 pb-24 pt-6 md:px-6 md:pt-10">
        <Link
          href={`/events/${event.slug}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-cream/70 transition hover:text-cream"
        >
          <ChevronLeft size={14} /> Back to event
        </Link>

        <header className="mt-4 flex items-stretch gap-4 md:mt-6 md:gap-6">
          <div className="relative shrink-0 overflow-hidden rounded-2xl bg-ink/40 ring-1 ring-cream/10">
            {heroFlyer ? (
              <img
                src={heroFlyer}
                alt={event.title ?? "Event flyer"}
                className="block h-[120px] w-[90px] object-cover md:h-[160px] md:w-[120px]"
              />
            ) : (
              <div className="h-[120px] w-[90px] bg-gradient-to-br from-emerald-700/40 via-ink to-ink md:h-[160px] md:w-[120px]" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cream/55">
              Choose your tickets
            </div>
            <h1 className="mt-1 line-clamp-2 text-xl font-semibold leading-tight text-cream md:text-2xl">
              {event.title}
            </h1>
            <div className="mt-2 flex flex-col gap-1 text-sm text-cream/75">
              {event.startDate ? (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={14} className="text-cream/55" />
                  {formatWhen(event.startDate as unknown as string)}
                </span>
              ) : null}
              {venueLine ? (
                <span className="inline-flex items-start gap-1.5">
                  <MapPin size={14} className="mt-0.5 shrink-0 text-cream/55" />
                  <span className="line-clamp-2">{venueLine}</span>
                </span>
              ) : null}
            </div>
          </div>
        </header>

        <div className="mt-6">
          <EventBookingPanel event={event} />
        </div>

        <p className="mt-6 text-center text-xs text-cream/55">
          Ticketing by Hoizr. The event itself is run by the organiser —
          Hoizr is not the event organiser.
        </p>
      </div>
    </div>
  );
};
