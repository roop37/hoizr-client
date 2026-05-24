"use client";

import { Loader2, Minus, Plus, TicketCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { rupee } from "@/lib/format";
import { gqlRequest } from "@/lib/graphql";
import { SET_CART_MUTATION } from "@/lib/queries";
import { writeActiveCart } from "@/lib/active-cart";
import { track } from "@/lib/tracker";
import { useAuthStore } from "@/store/auth";
import type { PublicEvent, PublicExtra, PublicTicket } from "@/types/event";
import type { CartResponse } from "@/types/order";

type Selection = Record<string, number>;

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

  useEffect(() => {
    if (!hydrated) {
      hydrate();
    }
  }, [hydrated, hydrate]);

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
    if (!profile) {
      router.push(`/login?next=${encodeURIComponent(`/events/${event.slug}`)}`);
      return;
    }
    setLoading(true);
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
    try {
      const cartResponse = await gqlRequest<{ setCart: CartResponse }>(SET_CART_MUTATION, {
        input: {
          eventId: event._id,
          tickets: Object.entries(ticketSel)
            .filter(([, qty]) => qty > 0)
            .map(([ticketId, quantity]) => ({ ticketId, quantity })),
          extras: Object.entries(extraSel)
            .filter(([, qty]) => qty > 0)
            .map(([extraId, quantity]) => ({ extraId, quantity })),
        },
      });
      const cart = cartResponse?.setCart;
      if (cart?.expiresAt) {
        writeActiveCart({
          eventId: event._id,
          eventSlug: event.slug,
          eventTitle: event.title,
          eventImage: event.eventFlyer,
          totalAmount: Number(cart.pricing?.totalAmount ?? 0),
          expiresAt: cart.expiresAt,
        });
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

  return (
    <div className="rounded-2xl border border-border bg-cream">
      <div className="border-b border-border px-5 py-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted">
          Tickets
        </div>
      </div>

      <div className="divide-y divide-border">
        {tickets.length ? (
          tickets.map((ticket) => {
            const available = isTicketAvailable(ticket);
            const qty = ticketSel[ticket._id] ?? 0;
            return (
              <div key={ticket._id} className="flex items-center gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{ticket.ticketName}</div>
                  <div className="mt-0.5 text-xs text-muted">
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
                  <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-1">
                    <button
                      type="button"
                      disabled={qty <= 0}
                      onClick={() => stepTicket(ticket, -1)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink disabled:opacity-30"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="min-w-[1.25rem] text-center text-sm font-semibold">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => stepTicket(ticket, 1)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted">
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
          <div className="px-5 py-6 text-center text-sm text-muted">
            No tickets configured yet.
          </div>
        )}
      </div>

      {extras.length ? (
        <div>
          <div className="border-y border-border bg-background px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
            Add-ons
          </div>
          <div className="divide-y divide-border">
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
                      <div className="mt-0.5 line-clamp-2 text-xs text-muted">
                        {extra.description}
                      </div>
                    ) : null}
                    <div className="mt-1 text-sm font-semibold">
                      {rupee(Number(extra.price ?? 0))}
                    </div>
                  </div>
                  {available > 0 ? (
                    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-1">
                      <button
                        type="button"
                        disabled={qty <= 0}
                        onClick={() => stepExtra(extra._id, -1, available)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink disabled:opacity-30"
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
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink disabled:opacity-30"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted">
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
        <div className="space-y-1.5 border-t border-border bg-background px-5 py-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Subtotal</span>
            <span className="font-medium">{rupee(preview.grossAmount)}</span>
          </div>
          {preview.taxes > 0 ? (
            <div className="flex justify-between">
              <span className="text-muted">Ticket GST</span>
              <span className="font-medium">{rupee(preview.taxes)}</span>
            </div>
          ) : null}
          <div className="flex justify-between">
            <span className="text-muted">Platform fee</span>
            <span className="font-medium">{rupee(preview.applicationFee)}</span>
          </div>
          {preview.platformFeeGst > 0 ? (
            <div className="flex justify-between">
              <span className="text-muted">GST on platform fee</span>
              <span className="font-medium">{rupee(preview.platformFeeGst)}</span>
            </div>
          ) : null}
          <div className="mt-2 flex justify-between border-t border-border pt-2 text-base">
            <span className="font-semibold">Total</span>
            <span className="font-semibold">{rupee(preview.totalAmount)}</span>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="border-t border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="border-t border-border px-5 py-4">
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
              {profile ? "Continue to checkout" : "Sign in to book"}
            </>
          )}
        </button>
        <p className="mt-2 text-center text-xs text-muted">
          Tickets are reserved for 13 minutes once locked.
        </p>
      </div>
    </div>
  );
};
