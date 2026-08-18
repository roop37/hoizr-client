"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { sdk } from "@/lib/sdk";
import { gqlRequest } from "@/lib/graphql";
import { PUBLIC_EVENT_SUMMARY_BY_ID_QUERY } from "@/lib/queries";
import { useSwiggyConnected } from "@/lib/use-swiggy-connected";
import { isoToISTDate, todayIST } from "@/lib/dineout";
import { PoweredBySwiggy } from "./PoweredBySwiggy";

/**
 * "Your night" — tonight's itinerary. Merges the customer's CONFIRMED Hoizr
 * tickets (event starts today, IST) with their Dineout reservations (table
 * today, IST) into one timeline. Swiggy-connected customers only; renders
 * null when nothing is on tonight. Cross-sell: a ticket with no table gets
 * an inline "add dinner" chip (deep-links doors-aware when coords exist).
 */

type NightItem = {
  key: string;
  epochMs: number;
  kind: "table" | "event";
  title: string;
  sub?: string;
  href: string;
};

const timeIST = (ms: number): string =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(ms));

type EventSummaryLite = {
  _id: string;
  title?: string | null;
  slug?: string | null;
  startDate?: string | null;
  location?: {
    formattedAddress?: string | null;
    city?: string | null;
    coordinate?: { type?: string | null; coordinates?: number[] | null } | null;
  } | null;
};

export function YourNight() {
  const { connected } = useSwiggyConnected();
  const [items, setItems] = useState<NightItem[] | null>(null);
  const [dinnerLink, setDinnerLink] = useState<string | null>(null);

  useEffect(() => {
    if (connected !== true) return;
    let alive = true;
    (async () => {
      try {
        const today = todayIST();
        const [ordersRes, bookingsRes] = await Promise.allSettled([
          sdk.MyOrders(),
          sdk.MyDineoutBookings(),
        ]);

        const next: NightItem[] = [];
        let hasTableTonight = false;
        let firstTonightEvent: EventSummaryLite | null = null;

        if (bookingsRes.status === "fulfilled") {
          for (const b of bookingsRes.value.myDineoutBookings) {
            const t = new Date(b.reservationTime).getTime();
            if (isoToISTDate(String(b.reservationTime)) !== today) continue;
            hasTableTonight = true;
            next.push({
              key: `t-${b.swiggyOrderId}`,
              epochMs: t,
              kind: "table",
              title: b.restaurantName,
              sub: b.restaurantAddress ?? undefined,
              href: "/dineout/bookings",
            });
          }
        }

        if (ordersRes.status === "fulfilled") {
          const good = ordersRes.value.getMyOrders.filter(
            (o) =>
              o.orderStatus === "PAYMENT_SUCCESS" ||
              o.orderStatus === "CHECKED_IN"
          );
          const eventIds = [...new Set(good.map((o) => o.eventId))].slice(0, 8);
          const summaries = await Promise.allSettled(
            eventIds.map((id) =>
              gqlRequest<{ getPublicEventById: EventSummaryLite | null }>(
                PUBLIC_EVENT_SUMMARY_BY_ID_QUERY,
                { id }
              )
            )
          );
          for (const s of summaries) {
            if (s.status !== "fulfilled") continue;
            const ev = s.value.getPublicEventById;
            if (!ev?.startDate) continue;
            if (isoToISTDate(ev.startDate) !== today) continue;
            const ms = new Date(ev.startDate).getTime();
            // Pick the EARLIEST-starting tonight event for the cross-sell
            // (summaries arrive in purchase order, not time order).
            if (
              !firstTonightEvent ||
              (firstTonightEvent.startDate &&
                ms < new Date(firstTonightEvent.startDate).getTime())
            ) {
              firstTonightEvent = ev;
            }
            next.push({
              key: `e-${ev._id}`,
              epochMs: ms,
              kind: "event",
              title: ev.title ?? "Your event",
              sub:
                ev.location?.formattedAddress ?? ev.location?.city ?? undefined,
              href: ev.slug ? `/events/${ev.slug}` : "/orders",
            });
          }
        }

        next.sort((a, b) => a.epochMs - b.epochMs);
        if (!alive) return;
        setItems(next);

        // Cross-sell: event tonight but no table → doors-aware dinner link.
        if (!hasTableTonight && firstTonightEvent?.startDate) {
          const coords = firstTonightEvent.location?.coordinate?.coordinates;
          if (Array.isArray(coords) && coords.length >= 2) {
            const doorsAt = Math.floor(
              new Date(firstTonightEvent.startDate).getTime() / 1000
            );
            setDinnerLink(
              `/dineout?lat=${coords[1]}&lng=${coords[0]}&date=${today}&doorsAt=${doorsAt}`
            );
          } else {
            setDinnerLink("/dineout");
          }
        }
      } catch {
        if (alive) setItems([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [connected]);

  if (connected !== true) return null;
  if (!items || items.length === 0) return null;

  return (
    <section className="h-glass-card p-4">
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--h-ink-3)]">
          🌙 Your night
        </div>
        <PoweredBySwiggy />
      </div>
      <ol className="mt-3 space-y-2">
        {items.map((it) => (
          <li key={it.key}>
            <Link
              href={it.href}
              className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-white/20"
            >
              <span className="w-[74px] flex-none text-[13px] font-semibold text-[var(--h-accent)]">
                {timeIST(it.epochMs)}
              </span>
              <span className="flex-none">{it.kind === "table" ? "🍽" : "🎟"}</span>
              <span className="min-w-0">
                <span className="block truncate text-[14px] font-medium text-[var(--h-ink)] group-hover:text-[var(--h-accent)]">
                  {it.title}
                </span>
                {it.sub ? (
                  <span className="block truncate text-[11px] text-[var(--h-ink-3)]">
                    {it.sub}
                  </span>
                ) : null}
              </span>
            </Link>
          </li>
        ))}
      </ol>
      {dinnerLink ? (
        <Link href={dinnerLink} className="h-chip mt-3 inline-flex">
          🍽 Add dinner before doors
        </Link>
      ) : null}
    </section>
  );
}
