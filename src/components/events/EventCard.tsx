import { CalendarDays, MapPin, Sparkles } from "lucide-react";
import Link from "next/link";
import type { PublicEvent } from "@/types/event";
import { formatEventDate, minTicketPrice, rupee } from "@/lib/format";

export const EventCard = ({ event }: { event: PublicEvent }) => {
  const price = minTicketPrice(event.tickets);
  const href = event.slug ? `/events/${event.slug}` : `/events?id=${event._id}`;

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-cream transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div
        className="relative aspect-[4/5] w-full bg-border bg-cover bg-center"
        style={
          event.eventFlyer ? { backgroundImage: `url(${event.eventFlyer})` } : undefined
        }
      >
        {!event.eventFlyer ? (
          <div className="flex h-full items-center justify-center text-dark/40">
            <CalendarDays size={42} />
          </div>
        ) : null}
        {event.isHighDemand ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-cream">
            <Sparkles size={11} />
            High demand
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-accent">
          {event.isComingSoon ? "Coming soon" : formatEventDate(event.startDate)}
        </div>
        <h3 className="line-clamp-2 text-lg font-semibold leading-tight">
          {event.title ?? "Untitled event"}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <MapPin size={12} />
          <span className="truncate">{event.city ?? "City pending"}</span>
        </div>
        <div className="mt-auto pt-2 text-sm font-semibold">
          {price === null
            ? "Guestlist"
            : price === 0
            ? "Free entry"
            : `${rupee(price)} onwards`}
        </div>
      </div>
    </Link>
  );
};
