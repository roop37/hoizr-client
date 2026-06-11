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
import { useAuthStore } from "@/store/auth";
import type { PublicEvent, PublicExtra, PublicTicket } from "@/types/event";
import type { CartResponse } from "@/types/order";
import { GuestCheckoutModal } from "@/components/hoizr-ui/GuestCheckoutModal";

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
  // Guest checkout (not-logged-in) modal — opened from "Continue to checkout".
  const [guestSel, setGuestSel] = useState<LineSel | null>(null);

  useEffect(() => {
    if (!hydrated) {
      hydrate();
    }
  }, [hydrated, hydrate]);

  useEffect(() => {
    const activeCart = readActiveCart();
    if (!activeCart || activeCart.eventId !== event._id) return;
    const selections = activeCartSelections(activeCart);
    setTicketSel(selections.tickets);
    setExtraSel(selections.extras);
  }, [event._id]);

  const tickets = event.tickets ?? [];
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
    track("ticketSelect", {
      eventId: event._id,
      hostId: (event as any).hostId,
      itemIds: selectedTicketIds,
      metadata: {
        ticketCount: totalTickets,
        extraCount: Object.values(extraSel).reduce((s, n) => s + n, 0),
      },
    });

    if (!profile) {
      // Not logged in → open the guest-checkout modal (bottom sheet on
      // mobile) right here. The buyer can fill details + pay as a guest, or
      // choose "Log in" which falls back to the existing checkout-page flow.
      setGuestSel({ tickets: selectedTickets, extras: selectedExtras });
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

      <div className="divide-y divide-white/8">
        {tickets.length ? (
          tickets.map((ticket) => {
            const available = isTicketAvailable(ticket);
            const qty = ticketSel[ticket._id] ?? 0;
            return (
              <div key={ticket._id} className="flex items-center gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{ticket.ticketName}</div>
                  <div className="mt-0.5 text-xs text-white/60">
                    {ticket.ticketCategory}
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
                    {ticket.markAsComingSoon
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
            No tickets configured yet.
          </div>
        )}
      </div>

      {extras.length ? (
        <div>
          <div className="border-y border-white/10 bg-white/5 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white/60">
            Add-ons
          </div>
          <div className="divide-y divide-white/8">
            {extras.map((extra) => {
              const available = Math.max(
                0,
                Number(extra.quantity ?? 0) - Number(extra.sold ?? 0)
              );
              const qty = extraSel[extra._id] ?? 0;
              return (
                <div key={extra._id} className="flex items-center gap-3 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{extra.name}</div>
                    {extra.description ? (
                      <div className="mt-0.5 line-clamp-2 text-xs text-white/60">
                        {extra.description}
                      </div>
                    ) : null}
                    <div className="mt-1 text-sm font-semibold">
                      {rupee(Number(extra.price ?? 0))}
                    </div>
                  </div>
                  {available > 0 ? (
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-1 backdrop-blur">
                      <button
                        type="button"
                        disabled={qty <= 0}
                        onClick={() => stepExtra(extra._id, -1, available)}
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
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white disabled:opacity-30"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
                      Sold out
                    </span>
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

      <GuestCheckoutModal
        open={!!guestSel}
        onClose={() => setGuestSel(null)}
        eventId={event._id}
        eventTitle={event.title ?? "this event"}
        tickets={guestSel?.tickets ?? []}
        extras={guestSel?.extras ?? []}
        onLoginInstead={() => {
          // Fall back to the existing login → checkout-page flow: persist the
          // selection locally and let the checkout page prompt sign-in.
          writeActiveCart({
            eventId: event._id,
            eventSlug: event.slug,
            eventTitle: event.title,
            eventImage: event.horizontalFlyer ?? event.eventFlyer,
            totalAmount: preview.totalAmount,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            tickets: guestSel?.tickets ?? [],
            extras: guestSel?.extras ?? [],
            pending: true,
          });
          setGuestSel(null);
          router.push(`/checkout?eventId=${event._id}`);
        }}
      />
    </div>
  );
};
