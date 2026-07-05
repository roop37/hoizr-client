"use client";

import { Loader2, Minus, Plus, TicketCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { rupee } from "@/lib/format";
import { gqlRequest } from "@/lib/graphql";
import { SET_CART_MUTATION } from "@/lib/queries";
import {
  activeCartFromCartResponse,
  activeCartSelections,
  readActiveCart,
  writeActiveCart,
} from "@/lib/active-cart";
import { track } from "@/lib/tracker";
import {
  isMultiDayEvent,
  preselectDayId,
  ticketAdmitsDay,
  ticketSalesClosed,
} from "@/lib/event-days";
import { useAuthStore } from "@/store/auth";
import type { PublicEvent, PublicExtra, PublicTicket } from "@/types/event";
import type { CartResponse } from "@/types/order";
import { AuthSheet } from "@/components/auth/AuthSheet";
import { EventWaitlistPanel } from "./EventWaitlistPanel";

type Selection = Record<string, number>;
type LineSel = { tickets: { ticketId: string; quantity: number }[]; extras: { extraId: string; quantity: number }[] };

const resolveTicketGstRate = (ticket: PublicTicket) => {
  if (
    ticket.ticketGST === "CgstSgst18" ||
    ticket.ticketGST === "CGST_SGST_18" ||
    ticket.ticketGST === "Igst18" ||
    ticket.ticketGST === "IGST_18"
  ) {
    return 18;
  }
  if (ticket.ticketGST === "Other" || ticket.ticketGST === "OTHER") {
    return Number(ticket.gstRate ?? 0);
  }
  return 0;
};

const computePreview = (
  tickets: PublicTicket[],
  extras: PublicExtra[],
  ticketSel: Selection,
  extraSel: Selection,
  applicationFeePercent: number
) => {
  const ticketLines = tickets.flatMap((t) => {
    const qty = ticketSel[t._id] ?? 0;
    if (!qty) return [];
    const total = qty * Number(t.ticketPrice ?? 0);
    return [
      {
        name: t.ticketName,
        qty,
        total,
        tax: total * (resolveTicketGstRate(t) / 100),
      },
    ];
  });
  const extraLines = extras.flatMap((e) => {
    const qty = extraSel[e._id] ?? 0;
    if (!qty) return [];
    return [{ name: e.name, qty, total: qty * Number(e.price ?? 0) }];
  });
  const grossAmount =
    ticketLines.reduce((sum, l) => sum + l.total, 0) +
    extraLines.reduce((sum, l) => sum + l.total, 0);
  const applicationFee = +(grossAmount * (applicationFeePercent / 100)).toFixed(2);
  const platformFeeGst = +(applicationFee * 0.18).toFixed(2);
  const taxes = +ticketLines.reduce((sum, l) => sum + l.tax, 0).toFixed(2);
  const totalAmount = +(grossAmount + applicationFee + platformFeeGst + taxes).toFixed(2);
  return { grossAmount, applicationFee, platformFeeGst, taxes, totalAmount };
};

const isTicketAvailable = (ticket: PublicTicket) =>
  ticket.ticketVisible !== false &&
  !ticket.markAsComingSoon &&
  !ticket.markAsOnGroundOnly &&
  ticket.ticketSold < ticket.ticketCapacity;

export const EventBookingPanel = ({ event }: { event: PublicEvent }) => {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrated = useAuthStore((s) => s.hydrated);

  const [ticketSel, setTicketSel] = useState<Selection>({});
  const [extraSel, setExtraSel] = useState<Selection>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Multi-day: a day selector filters which tickets show. The cart payload is
  // unchanged (it sends ticketIds; the server resolves each ticket's dayId), so
  // this is purely a display filter. now is captured once for stable preselect.
  const multiDay = isMultiDayEvent(event);
  const days = event.days ?? [];
  const now = useMemo(() => new Date(), []);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  useEffect(() => {
    if (multiDay && selectedDayId == null) {
      setSelectedDayId(preselectDayId(event, now));
    }
  }, [multiDay, selectedDayId, event, now]);
  // Login gate (not-logged-in) — opened from "Continue to checkout". This is
  // NOT a guest order: the buyer signs in (phone OTP) without leaving the page,
  // their ticket selection stays put, and they just tap "Continue to checkout".
  const [loginSel, setLoginSel] = useState<LineSel | null>(null);

  useEffect(() => {
    if (!hydrated) {
      hydrate();
    }
  }, [hydrated, hydrate]);

  // After sign-in: re-hydrate so `profile` flips to logged-in on this same page
  // (mirrors the checkout-gate pattern), then close the sheet. The selection is
  // preserved in state — the buyer just taps "Continue to checkout" again.
  const handleAuthenticated = async () => {
    useAuthStore.setState({ hydrated: false });
    await hydrate();
    setLoginSel(null);
  };

  useEffect(() => {
    const activeCart = readActiveCart();
    if (!activeCart || activeCart.eventId !== event._id) return;
    const selections = activeCartSelections(activeCart);
    setTicketSel(selections.tickets);
    setExtraSel(selections.extras);
  }, [event._id]);

  // Hidden tickets (ticketVisible === false) are removed entirely — they
  // must not appear, and must NOT fall through to a misleading "Sold out"
  // badge. "Sold out" is reserved for visible tickets at capacity.
  const tickets = (event.tickets ?? []).filter(
    (t) => t.ticketVisible !== false
  );
  // On a multi-day event, show the selected day's tickets plus the all-days
  // passes (ticketAdmitsDay covers day-match + all-days + untagged). Single-day
  // shows everything, exactly as before.
  const displayTickets =
    multiDay && selectedDayId
      ? tickets.filter((t) => ticketAdmitsDay(t, selectedDayId))
      : tickets;
  const extras = event.extras ?? [];

  // The actual rates come from the server but mirror env defaults for the
  // preview so the customer sees a sensible breakdown before locking.
  const preview = useMemo(
    () => computePreview(tickets, extras, ticketSel, extraSel, 5),
    [tickets, extras, ticketSel, extraSel]
  );

  const totalTickets = Object.values(ticketSel).reduce(
    (sum, qty) => sum + qty,
    0
  );

  const stepTicket = (ticket: PublicTicket, delta: number) => {
    setTicketSel((current) => {
      const ticketId = ticket._id;
      const remaining = Math.max(
        0,
        Number(ticket.ticketCapacity ?? 0) - Number(ticket.ticketSold ?? 0)
      );
      const next = Math.max(0, (current[ticketId] ?? 0) + delta);
      const maxAllowed = ticket.maxTicketPerUser
        ? Math.min(ticket.maxTicketPerUser, remaining)
        : remaining;
      return { ...current, [ticketId]: Math.min(next, maxAllowed) };
    });
  };

  const stepExtra = (extraId: string, delta: number, available: number) => {
    setExtraSel((current) => {
      const next = Math.max(0, (current[extraId] ?? 0) + delta);
      return { ...current, [extraId]: Math.min(next, available) };
    });
  };

  const proceed = async () => {
    setError(null);
    if (totalTickets <= 0) {
      setError("Select at least one ticket to continue.");
      return;
    }
    const selectedTickets = Object.entries(ticketSel)
      .filter(([, qty]) => qty > 0)
      .map(([ticketId, quantity]) => ({ ticketId, quantity }));
    const selectedExtras = Object.entries(extraSel)
      .filter(([, qty]) => qty > 0)
      .map(([extraId, quantity]) => ({ extraId, quantity }));
    const selectedTicketIds = Object.entries(ticketSel)
      .filter(([, qty]) => qty > 0)
      .map(([ticketId]) => ticketId);

    if (!profile) {
      // Not logged in → open the sign-in sheet right here (log in BEFORE the
      // order — not a guest checkout). The selection is remembered; once signed
      // in they're logged in on this same page and just tap Continue again.
      setLoginSel({ tickets: selectedTickets, extras: selectedExtras });
      return;
    }

    setLoading(true);
    try {
      const cartResponse = await gqlRequest<{ setCart: CartResponse }>(SET_CART_MUTATION, {
        input: {
          eventId: event._id,
          tickets: selectedTickets,
          extras: selectedExtras,
        },
      });
      const cart = cartResponse?.setCart;
      if (cart?.expiresAt) {
        writeActiveCart(
          activeCartFromCartResponse(cart, {
            eventSlug: event.slug,
            eventTitle: event.title,
            eventImage: event.horizontalFlyer ?? event.eventFlyer,
          })
        );
      }
      track("cartCreated", {
        eventId: event._id,
        hostId: (event as any).hostId,
        itemIds: selectedTicketIds,
        // Identify the logged-in buyer so the abandoned-cart automation
        // (retarget_abandoned) can reach them — this branch is logged-in only.
        customerId: profile?._id,
      });
      router.push(`/checkout?eventId=${event._id}`);
    } catch (err: any) {
      setError(
        err?.response?.errors?.[0]?.message ?? "Unable to lock these tickets."
      );
    } finally {
      setLoading(false);
    }
  };

  // Waitlist gating — evaluated BEFORE the ticketing guard so an organizer can
  // run a pure demand-sensing waitlist with no tickets configured. Precedence
  // mirrors docs/WAITLIST_SPEC.md §5.2.
  const nowMs = now.getTime();
  const wlExpiryMs = event.waitlistExpiry
    ? new Date(event.waitlistExpiry).getTime()
    : null;
  const inPreSaleWindow =
    !!event.waitlistEnabled &&
    !event.waitlistOnly &&
    wlExpiryMs != null &&
    nowMs < wlExpiryMs;
  const anyTicketAvailable = tickets.some((t) => isTicketAvailable(t));
  const endsAtMs = event.endDate
    ? new Date(event.endDate).getTime()
    : event.startDate
    ? new Date(event.startDate).getTime()
    : null;
  const eventEnded = endsAtMs != null && endsAtMs < nowMs;
  // Show the waitlist when: it's a waitlist-only gate, we're in the pre-sale
  // window, OR there's simply nothing sellable right now — that last case
  // covers both a sold-out event (overflow) AND a pure demand-sensing event
  // with no tickets configured at all (the "just gauge interest" use).
  const showWaitlist =
    !eventEnded &&
    !!event.waitlistEnabled &&
    (event.waitlistOnly ||
      inPreSaleWindow ||
      (!inPreSaleWindow && !anyTicketAvailable));
  if (showWaitlist) {
    return <EventWaitlistPanel event={event} />;
  }

  if (!event.ticketingEnabled) {
    return (
      <div className="rounded-2xl border border-border bg-cream p-6 text-sm text-muted">
        Online ticketing isn't enabled for this event. Check the event's social
        channels for entry details.
      </div>
    );
  }

  // AUDIT-065: once an event ends it flips to COMPLETED and its detail page
  // still renders (so the URL doesn't 404), but it can no longer be booked —
  // the server's cart/order gates reject it too. Show a clear "ended" state
  // instead of a dead book button. Keyed on endDate (COMPLETED events always
  // have endDate < now); falls back to startDate when no endDate is set.
  const endsAt = event.endDate
    ? new Date(event.endDate)
    : event.startDate
    ? new Date(event.startDate)
    : null;
  const hasEnded = !!endsAt && !Number.isNaN(endsAt.getTime()) && endsAt < new Date();
  if (hasEnded) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center text-white backdrop-blur-md">
        <div className="text-sm font-semibold">This event has ended</div>
        <div className="mt-1 text-xs text-white/60">
          Booking is closed. Browse upcoming events to find your next night out.
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] text-white backdrop-blur-md">
      <div className="border-b border-white/10 px-5 py-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-white/60">
          Tickets
        </div>
      </div>

      {multiDay && days.length ? (
        <div className="flex flex-wrap gap-2 border-b border-white/10 px-5 py-3">
          {days.map((day, i) => {
            const active = day.dayId === selectedDayId;
            return (
              <button
                key={day.dayId}
                type="button"
                onClick={() => setSelectedDayId(day.dayId)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "border-accent bg-accent text-cream"
                    : "border-white/15 bg-white/5 text-white/70 hover:text-white"
                }`}
              >
                {day.title || `Day ${i + 1}`}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="divide-y divide-white/8">
        {displayTickets.length ? (
          displayTickets.map((ticket) => {
            const salesClosed = multiDay && ticketSalesClosed(event, ticket, now);
            const available = isTicketAvailable(ticket) && !salesClosed;
            const qty = ticketSel[ticket._id] ?? 0;
            const isPass = ticket.dayId === "ALL_DAYS";
            return (
              <div key={ticket._id} className="flex items-center gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold">{ticket.ticketName}</span>
                    {multiDay && isPass ? (
                      <span className="shrink-0 rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                        All days
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-0.5 text-xs text-white/60">
                    {ticket.ticketCategory === "GUESTLIST"
                      ? "RSVP"
                      : ticket.ticketCategory}
                    {ticket.ticketInfo ? ` · ${ticket.ticketInfo}` : ""}
                  </div>
                  <div className="mt-1 text-sm font-semibold">
                    {ticket.ticketCategory === "GUESTLIST" ||
                    ticket.ticketPrice === 0
                      ? "Free"
                      : rupee(Number(ticket.ticketPrice ?? 0))}
                  </div>
                </div>
                {available ? (
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-1 backdrop-blur">
                    <button
                      type="button"
                      disabled={qty <= 0}
                      onClick={() => stepTicket(ticket, -1)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white disabled:opacity-30"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="min-w-[1.25rem] text-center text-sm font-semibold">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => stepTicket(ticket, 1)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
                    {salesClosed
                      ? "Sales closed"
                      : ticket.markAsComingSoon
                      ? "Soon"
                      : ticket.markAsOnGroundOnly
                      ? "On-ground"
                      : "Sold out"}
                  </span>
                )}
              </div>
            );
          })
        ) : (
          <div className="px-5 py-6 text-center text-sm text-white/60">
            {multiDay ? "No tickets for this day." : "No tickets configured yet."}
          </div>
        )}
      </div>

      {extras.length ? (
        <div>
          <div className="border-y border-white/10 bg-white/5 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white/60">
            Add-ons
          </div>
          <div className="space-y-2.5 px-5 py-4">
            {extras.map((extra) => {
              const available = Math.max(
                0,
                Number(extra.quantity ?? 0) - Number(extra.sold ?? 0)
              );
              const qty = extraSel[extra._id] ?? 0;
              const soldOut = available <= 0;
              return (
                <div
                  key={extra._id}
                  className={`flex items-center gap-3.5 rounded-2xl border p-2.5 transition ${
                    qty > 0
                      ? "border-[var(--h-accent)]/45 bg-[var(--h-accent)]/[0.06]"
                      : "border-white/10 bg-white/[0.03]"
                  } ${soldOut ? "opacity-60" : ""}`}
                >
                  {/* Thumbnail — shown only when the add-on carries an image,
                      otherwise a neutral initial tile keeps the row aligned. */}
                  {extra.image ? (
                    <img
                      src={extra.image}
                      alt={extra.name}
                      loading="lazy"
                      decoding="async"
                      className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-white/10"
                    />
                  ) : (
                    <div
                      className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-base font-bold text-white/45 ring-1 ring-white/10"
                      aria-hidden
                    >
                      {(extra.name ?? "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-semibold leading-tight text-white">
                      {extra.name}
                    </div>
                    {extra.description ? (
                      <div className="mt-0.5 line-clamp-2 text-xs leading-snug text-white/55">
                        {extra.description}
                      </div>
                    ) : null}
                    <div className="mt-1 text-sm font-semibold text-white/90">
                      {rupee(Number(extra.price ?? 0))}
                    </div>
                  </div>
                  {soldOut ? (
                    <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-white/50">
                      Sold out
                    </span>
                  ) : (
                    <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-1 backdrop-blur">
                      <button
                        type="button"
                        disabled={qty <= 0}
                        onClick={() => stepExtra(extra._id, -1, available)}
                        aria-label={`Remove one ${extra.name}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white disabled:opacity-30"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="min-w-[1.25rem] text-center text-sm font-semibold">
                        {qty}
                      </span>
                      <button
                        type="button"
                        disabled={qty >= available}
                        onClick={() => stepExtra(extra._id, 1, available)}
                        aria-label={`Add one ${extra.name}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white disabled:opacity-30"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {preview.grossAmount > 0 ? (
        <div className="space-y-1.5 border-t border-white/10 bg-white/5 px-5 py-4 text-sm">
          <div className="flex justify-between">
            <span className="text-white/60">Subtotal</span>
            <span className="font-medium">{rupee(preview.grossAmount)}</span>
          </div>
          {preview.taxes > 0 ? (
            <div className="flex justify-between">
              <span className="text-white/60">Ticket GST</span>
              <span className="font-medium">{rupee(preview.taxes)}</span>
            </div>
          ) : null}
          <div className="flex justify-between">
            <span className="text-white/60">Platform fee</span>
            <span className="font-medium">{rupee(preview.applicationFee)}</span>
          </div>
          {preview.platformFeeGst > 0 ? (
            <div className="flex justify-between">
              <span className="text-white/60">GST on platform fee</span>
              <span className="font-medium">{rupee(preview.platformFeeGst)}</span>
            </div>
          ) : null}
          <div className="mt-2 flex justify-between border-t border-white/10 pt-2 text-base">
            <span className="font-semibold">Total</span>
            <span className="font-semibold">{rupee(preview.totalAmount)}</span>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="border-t border-red-400/30 bg-red-500/10 px-5 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <div className="border-t border-white/10 px-5 py-4">
        <button
          type="button"
          disabled={loading || totalTickets <= 0}
          onClick={proceed}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-cream transition hover:opacity-95 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              <TicketCheck size={16} />
              Continue to checkout
            </>
          )}
        </button>
      </div>

      <AuthSheet
        open={!!loginSel}
        onClose={() => setLoginSel(null)}
        onAuthenticated={handleAuthenticated}
        headline="Sign in to book your tickets"
        subheadline="Verify with a quick phone OTP — your selection is saved and you'll pick up right here."
      />
    </div>
  );
};
