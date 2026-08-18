"use client";

import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";
import { useSwiggyConnected } from "@/lib/use-swiggy-connected";
import { coordToLatLng } from "@/lib/geo";
import { isoToISTDate, todayIST } from "@/lib/dineout";
import { PoweredBySwiggy } from "./PoweredBySwiggy";

/**
 * "Make a night of it" upsell on ticket order pages. Renders ONLY when the
 * customer's Swiggy is connected (hard gate), the event is upcoming and
 * within Swiggy's 7-day booking window, and the venue has coordinates.
 * Zero Swiggy calls here — it's a deep link into the doors-aware
 * reservation flow.
 */
export function DinnerBeforeDoors({
  startDateISO,
  coordinate,
  eventTitle,
}: {
  startDateISO?: string | null;
  coordinate?: { type?: string | null; coordinates?: number[] | null } | null;
  eventTitle?: string | null;
}) {
  const { connected } = useSwiggyConnected();
  if (connected !== true) return null;

  const c = coordToLatLng(coordinate);
  const date = isoToISTDate(startDateISO);
  if (!c || !date || !startDateISO) return null;

  const start = new Date(startDateISO).getTime();
  if (Number.isNaN(start) || start <= Date.now()) return null; // past event
  // Swiggy books at most 7 days out — hide beyond the window.
  const daysOut =
    (new Date(`${date}T00:00:00+05:30`).getTime() -
      new Date(`${todayIST()}T00:00:00+05:30`).getTime()) /
    86_400_000;
  if (daysOut > 6) return null;

  const doorsAtSec = Math.floor(start / 1000);
  const doorsLabel = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(start));

  return (
    <section className="h-glass-card p-5 text-sm md:p-6">
      <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--h-ink-3)]">
        <UtensilsCrossed size={14} />
        Make a night of it
      </div>
      <h3 className="mt-2 text-lg font-semibold text-[var(--h-ink)]">
        Dinner before doors?
      </h3>
      <p className="mt-1 text-[var(--h-ink-2)]">
        Doors at {doorsLabel}
        {eventTitle ? ` for ${eventTitle}` : ""} — grab a free table nearby
        first.
      </p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <Link
          href={`/dineout?lat=${c.lat}&lng=${c.lng}&date=${date}&doorsAt=${doorsAtSec}`}
          className="h-btn h-btn-accent"
        >
          Find a table
        </Link>
        <PoweredBySwiggy />
      </div>
    </section>
  );
}
