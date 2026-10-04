"use client";

import {
  CheckCircle2,
  Clock,
  Package,
  Sparkles,
  TicketCheck,
  UtensilsCrossed,
  X,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { rupee, rupeeOrFree } from "@/lib/format";
import { gqlRequest } from "@/lib/graphql";
import {
  MY_ARTIST_MERCH_ORDERS_QUERY,
  MY_ORDERS_QUERY,
} from "@/lib/queries";
import { useAuthStore } from "@/store/auth";
import {
  CardSkeleton,
  CenteredLoader,
  EmptyState,
  ErrorState,
} from "@/components/ui/feedback";
import type {
  ArtistMerchOrderStatus,
  CustomerMerchOrderView,
  CustomerOrderView,
  OrderStatus,
} from "@/types/order";
import {
  fetchMyGuestlistTickets,
  type GuestlistTicketView,
} from "@/lib/guestlist";
import { GoldenTicket } from "@/components/hoizr-ui/GoldenTicket";
import { YourNight } from "@/components/dineout/YourNight";
import { PoweredBySwiggy } from "@/components/dineout/PoweredBySwiggy";
import { sdk } from "@/lib/sdk";
import { formatDateIST } from "@/lib/dineout";
import { useSwiggyConnected } from "@/lib/use-swiggy-connected";
import type { MyDineoutBookingsQuery } from "@/generated/graphql";

type Tab = "tickets" | "merch" | "passes" | "reservations";

type Reservation = MyDineoutBookingsQuery["myDineoutBookings"][number];

// Tones picked to read clearly on the dark glass cards below. Each
// badge is a translucent fill + 1px inset ring + a high-contrast text
// colour — the same recipe used on the order detail page.
const ticketStatusBadge = (status: OrderStatus) => {
  switch (status) {
    case "PAYMENT_SUCCESS":
      return {
        Icon: CheckCircle2,
        text: "Confirmed",
        className:
          "bg-emerald-400/15 text-emerald-200 ring-1 ring-inset ring-emerald-400/40",
      };
    case "CHECKED_IN":
      return {
        Icon: TicketCheck,
        text: "Checked in",
        className:
          "bg-sky-400/15 text-sky-200 ring-1 ring-inset ring-sky-400/40",
      };
    case "PAYMENT_PENDING":
      return {
        Icon: Clock,
        text: "Pending",
        className:
          "bg-amber-400/15 text-amber-200 ring-1 ring-inset ring-amber-400/40",
      };
    case "PAYMENT_FAILED":
    case "CANCELLED":
    case "SUPERSEDED":
      return {
        Icon: XCircle,
        text:
          status === "SUPERSEDED"
            ? "Replaced"
            : status === "PAYMENT_FAILED"
            ? "Payment failed"
            : "Cancelled",
        className:
          "bg-white/10 text-white/70 ring-1 ring-inset ring-white/15",
      };
    case "REFUNDED":
      return {
        Icon: XCircle,
        text: "Refunded",
        className:
          "bg-violet-400/15 text-violet-200 ring-1 ring-inset ring-violet-400/40",
      };
    default:
      return {
        Icon: Clock,
        text: status,
        className:
          "bg-white/10 text-white/70 ring-1 ring-inset ring-white/15",
      };
  }
};

const merchStatusBadge = (status: ArtistMerchOrderStatus) => {
  switch (status) {
    case "PAYMENT_SUCCESS":
      return {
        Icon: CheckCircle2,
        text: "Paid",
        className:
          "bg-sky-400/15 text-sky-200 ring-1 ring-inset ring-sky-400/40",
      };
    case "FULFILLED":
      return {
        Icon: Package,
        text: "Shipped",
        className:
          "bg-emerald-400/15 text-emerald-200 ring-1 ring-inset ring-emerald-400/40",
      };
    case "PAYMENT_PENDING":
      return {
        Icon: Clock,
        text: "Pending",
        className:
          "bg-amber-400/15 text-amber-200 ring-1 ring-inset ring-amber-400/40",
      };
    case "PAYMENT_FAILED":
    case "CANCELLED":
      return {
        Icon: XCircle,
        text: status === "CANCELLED" ? "Cancelled" : "Payment failed",
        className:
          "bg-white/10 text-white/70 ring-1 ring-inset ring-white/15",
      };
    case "REFUNDED":
      return {
        Icon: XCircle,
        text: "Refunded",
        className:
          "bg-violet-400/15 text-violet-200 ring-1 ring-inset ring-violet-400/40",
      };
    default:
      return {
        Icon: Clock,
        text: status,
        className:
          "bg-white/10 text-white/70 ring-1 ring-inset ring-white/15",
      };
  }
};

// Swiggy returns the reservation status as a free-form string (not an enum we
// own), so match on substrings and fall back to showing whatever they sent —
// an unknown status must still be readable, never blank.
const reservationStatusBadge = (status: string) => {
  const s = status.toLowerCase();
  if (s.includes("confirm") || s.includes("book") || s.includes("success"))
    return {
      Icon: CheckCircle2,
      className:
        "bg-emerald-400/15 text-emerald-200 ring-1 ring-inset ring-emerald-400/40",
    };
  if (s.includes("pend") || s.includes("progress") || s.includes("await"))
    return {
      Icon: Clock,
      className:
        "bg-amber-400/15 text-amber-200 ring-1 ring-inset ring-amber-400/40",
    };
  if (s.includes("cancel") || s.includes("fail") || s.includes("reject"))
    return {
      Icon: XCircle,
      className: "bg-white/10 text-white/70 ring-1 ring-inset ring-white/15",
    };
  return {
    Icon: Clock,
    className: "bg-white/10 text-white/70 ring-1 ring-inset ring-white/15",
  };
};

const formatDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

export const OrdersClient = () => {
  const router = useRouter();
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrated = useAuthStore((s) => s.hydrated);
  const profile = useAuthStore((s) => s.profile);

  const [tab, setTab] = useState<Tab>("tickets");
  const [orders, setOrders] = useState<CustomerOrderView[]>([]);
  const [merchOrders, setMerchOrders] = useState<CustomerMerchOrderView[]>([]);
  const [passes, setPasses] = useState<GuestlistTicketView[]>([]);
  // null = not loaded yet, so the tab label can omit its count instead of
  // flashing "· 0" before the fetch lands.
  const [reservations, setReservations] = useState<Reservation[] | null>(null);
  const [selectedPass, setSelectedPass] = useState<GuestlistTicketView | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Table reservations are a Swiggy-connected-only surface, so they load on
  // their own timeline (the status round-trip resolves after hydrate) rather
  // than gating the whole page behind a Swiggy call for every customer.
  const { connected } = useSwiggyConnected();

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    if (connected !== true) return;
    let alive = true;
    sdk
      .MyDineoutBookings()
      .then((r) => alive && setReservations(r.myDineoutBookings))
      .catch(() => alive && setReservations([]));
    return () => {
      alive = false;
    };
  }, [connected]);

  // Disconnecting Swiggy elsewhere removes the tab; drop the customer back to
  // Tickets so the active tab can't point at a surface that no longer exists.
  useEffect(() => {
    if (connected === false) setTab((t) => (t === "reservations" ? "tickets" : t));
  }, [connected]);

  useEffect(() => {
    if (hydrated && !profile) {
      router.replace("/login?next=/orders");
    }
  }, [hydrated, profile, router]);

  useEffect(() => {
    if (!profile) return;
    // Load both lists in parallel — failures are kept per-list so a
    // merch-order outage doesn't hide ticket orders.
    setLoading(true);
    Promise.allSettled([
      gqlRequest<{ getMyOrders: CustomerOrderView[] }>(MY_ORDERS_QUERY),
      gqlRequest<{ myArtistMerchOrders: CustomerMerchOrderView[] }>(
        MY_ARTIST_MERCH_ORDERS_QUERY
      ),
      fetchMyGuestlistTickets(),
    ]).then((results) => {
      const [ticketsRes, merchRes, passesRes] = results;
      if (ticketsRes.status === "fulfilled") {
        setOrders(ticketsRes.value.getMyOrders);
      } else {
        setError(
          (ticketsRes.reason as any)?.response?.errors?.[0]?.message ??
            "Unable to load your tickets"
        );
      }
      if (merchRes.status === "fulfilled") {
        setMerchOrders(merchRes.value.myArtistMerchOrders);
      }
      if (passesRes.status === "fulfilled") {
        setPasses(passesRes.value);
      }
      // We don't surface merch/pass-fetch failures so the page keeps working
      // for the (much more common) ticket-only customer.
      setLoading(false);
    });
  }, [profile]);

  const merchCount = useMemo(
    () =>
      merchOrders.filter(
        (o) => o.status === "PAYMENT_SUCCESS" || o.status === "FULFILLED"
      ).length,
    [merchOrders]
  );

  // Upcoming tables first (soonest at the top — that's the one you're about to
  // walk into), then past ones latest-first. Server order is insertion order,
  // which would float last month's dinner above tonight's.
  const sortedReservations = useMemo(() => {
    if (!reservations) return [];
    const now = Date.now();
    const at = (r: Reservation) => new Date(r.reservationTime).getTime();
    return [...reservations].sort((a, b) => {
      const [ta, tb] = [at(a), at(b)];
      const [upcomingA, upcomingB] = [ta >= now, tb >= now];
      if (upcomingA !== upcomingB) return upcomingA ? -1 : 1;
      return upcomingA ? ta - tb : tb - ta;
    });
  }, [reservations]);

  if (!hydrated || loading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 md:py-12">
        <div className="h-7 w-40 animate-pulse rounded bg-white/[0.08]" />
        <div className="mt-3 h-4 w-72 animate-pulse rounded bg-white/[0.06]" />
        <div className="mt-6 flex gap-1 border-b border-white/[0.08]">
          <div className="h-9 w-24 animate-pulse rounded-t bg-white/[0.06]" />
          <div className="h-9 w-24 animate-pulse rounded-t bg-white/[0.06]" />
        </div>
        <div className="mt-6 space-y-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 md:py-12 text-white">
      <h1 className="text-2xl font-semibold text-white md:text-3xl">
        Orders &amp; Passes
      </h1>
      <p className="mt-1 text-sm text-white/65">
        Tickets, guest passes and merch from Hoizr.
      </p>

      <div className="mt-6 flex gap-1 border-b border-white/[0.08]">
        <button
          type="button"
          onClick={() => setTab("tickets")}
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition ${
            tab === "tickets"
              ? "border-[#c5ff3d] text-white"
              : "border-transparent text-white/55 hover:text-white"
          }`}
        >
          Tickets · {orders.length}
        </button>
        <button
          type="button"
          onClick={() => setTab("passes")}
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition ${
            tab === "passes"
              ? "border-[#c5ff3d] text-white"
              : "border-transparent text-white/55 hover:text-white"
          }`}
        >
          Passes · {passes.length}
        </button>
        <button
          type="button"
          onClick={() => setTab("merch")}
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition ${
            tab === "merch"
              ? "border-[#c5ff3d] text-white"
              : "border-transparent text-white/55 hover:text-white"
          }`}
        >
          Merch · {merchCount}
        </button>
        {connected === true ? (
          <button
            type="button"
            onClick={() => setTab("reservations")}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition ${
              tab === "reservations"
                ? "border-[#c5ff3d] text-white"
                : "border-transparent text-white/55 hover:text-white"
            }`}
          >
            Reservations
            {reservations ? ` · ${reservations.length}` : ""}
          </button>
        ) : null}
      </div>

      {tab === "tickets" ? (
        <div className="mt-6">
          <YourNight />
        </div>
      ) : null}

      {error ? (
        <div className="mt-6">
          <ErrorState message={error} onRetry={() => router.refresh()} />
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        {tab === "tickets" ? (
          orders.length ? (
            orders.map((order) => {
              const badge = ticketStatusBadge(order.orderStatus);
              const Icon = badge.Icon;
              return (
                <Link
                  key={order._id}
                  href={`/orders/${order._id}`}
                  className="block rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 text-white backdrop-blur-xl transition hover:bg-white/[0.07]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-mono text-[11px] tracking-[0.18em] text-white/55">
                        #{order._id.slice(-6).toUpperCase()}
                      </div>
                      <div className="mt-1 truncate font-semibold text-white">
                        {order.tickets
                          .map((t) => `${t.quantity}× ${t.ticketName}`)
                          .join(", ")}
                      </div>
                      {order.extras?.length ? (
                        <div className="mt-0.5 truncate text-xs text-white/55">
                          +{" "}
                          {order.extras
                            .map((e) => `${e.quantity}× ${e.extraName}`)
                            .join(", ")}
                        </div>
                      ) : null}
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${badge.className}`}
                    >
                      <Icon size={12} />
                      {badge.text}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-white/55">
                      {formatDate(order.createdAt)}
                    </span>
                    <span className="font-semibold text-white">
                      {rupeeOrFree(order.totalAmount)}
                    </span>
                  </div>
                </Link>
              );
            })
          ) : (
            <EmptyState
              icon={<TicketCheck size={28} />}
              title="No tickets yet"
              description="When you book an event, your tickets and QR codes will live here."
              actionLabel="Discover events"
              actionHref="/events"
            />
          )
        ) : tab === "merch" ? (
          merchOrders.length ? (
          merchOrders.map((order) => {
            const badge = merchStatusBadge(order.status);
            const Icon = badge.Icon;
            return (
              <div
                key={order._id}
                className="block rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 text-white backdrop-blur-xl"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-mono text-[11px] tracking-[0.18em] text-white/55">
                      #{order._id.slice(-6).toUpperCase()}
                    </div>
                    <div className="mt-1 truncate font-semibold text-white">
                      {order.quantity}× {order.itemName}
                    </div>
                    {order.shippingCity ? (
                      <div className="mt-0.5 truncate text-xs text-white/55">
                        Shipping to {order.shippingCity}
                        {order.shippingPincode
                          ? ` · ${order.shippingPincode}`
                          : ""}
                      </div>
                    ) : null}
                    {order.status === "FULFILLED" &&
                    (order.shippedAt || order.carrier || order.trackingNumber) ? (
                      <div className="mt-1 text-xs text-white/55">
                        Shipped
                        {order.shippedAt
                          ? ` ${formatDate(order.shippedAt)}`
                          : ""}
                        {order.carrier ? ` · ${order.carrier}` : ""}
                        {order.trackingNumber
                          ? ` · ${order.trackingNumber}`
                          : ""}
                      </div>
                    ) : null}
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${badge.className}`}
                  >
                    <Icon size={12} />
                    {badge.text}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-white/55">
                    {formatDate(order.createdAt)}
                  </span>
                  <span className="font-semibold text-white">
                    {rupee(order.totalAmount)}
                  </span>
                </div>
              </div>
            );
          })
          ) : (
            <EmptyState
              icon={<Package size={28} />}
              title="No merch orders yet"
              description="Buy directly from an artist's page and your orders + shipping updates will land here."
              actionLabel="Browse artists"
              actionHref="/artist"
            />
          )
        ) : tab === "reservations" && connected === true ? (
          <>
            {/* Swiggy co-branding is required on every dineout surface. */}
            <div className="flex justify-end">
              <PoweredBySwiggy />
            </div>
            {!reservations ? (
              <>
                <CardSkeleton />
                <CardSkeleton />
              </>
            ) : sortedReservations.length ? (
              sortedReservations.map((r) => {
                const badge = reservationStatusBadge(r.status);
                const Icon = badge.Icon;
                return (
                  <Link
                    key={r.swiggyOrderId}
                    href="/dineout/bookings"
                    className="block rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 text-white backdrop-blur-xl transition hover:bg-white/[0.07]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-mono text-[11px] tracking-[0.18em] text-white/55">
                          #{r.swiggyOrderId.slice(-6).toUpperCase()}
                        </div>
                        <div className="mt-1 truncate font-semibold text-white">
                          {r.restaurantName}
                        </div>
                        {r.restaurantAddress ? (
                          <div className="mt-0.5 truncate text-xs text-white/55">
                            {r.restaurantAddress}
                          </div>
                        ) : null}
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${badge.className}`}
                      >
                        <Icon size={12} />
                        {r.status}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-white/55">
                        {formatDateIST(r.reservationTime)}
                      </span>
                      <span className="font-semibold text-white">
                        {r.guestCount} {r.guestCount === 1 ? "guest" : "guests"}
                      </span>
                    </div>
                  </Link>
                );
              })
            ) : (
              <EmptyState
                icon={<UtensilsCrossed size={28} />}
                title="No table reservations yet"
                description="Book a free table before doors and your reservations will show up here."
                actionLabel="Find a table"
                actionHref="/dineout"
              />
            )}
          </>
        ) : passes.length ? (
          passes.map((p) => (
            <button
              key={p.entryId}
              type="button"
              onClick={() => setSelectedPass(p)}
              className="block w-full rounded-2xl border border-amber-300/20 bg-gradient-to-br from-amber-200/[0.08] to-amber-500/[0.04] p-4 text-left text-white backdrop-blur-xl transition hover:from-amber-200/[0.12]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-mono text-[11px] tracking-[0.18em] text-amber-200/70">
                    GUEST PASS
                  </div>
                  <div className="mt-1 truncate font-semibold text-white">
                    {p.eventTitle ?? "Event"}
                  </div>
                  {p.contributorName ? (
                    <div className="mt-0.5 truncate text-xs text-white/55">
                      by {p.contributorName}
                    </div>
                  ) : null}
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2.5 py-1 text-[11px] font-semibold text-amber-200">
                  <Sparkles size={12} />
                  {p.checkedIn
                    ? "Checked in"
                    : p.status === "ACCEPTED"
                    ? "Active"
                    : "Pending"}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-white/55">{formatDate(p.eventDate)}</span>
                <span className="font-semibold text-amber-200">View pass</span>
              </div>
            </button>
          ))
        ) : (
          <EmptyState
            icon={<Sparkles size={28} />}
            title="No guest passes yet"
            description="When an organizer or artist adds you to a guestlist, your golden pass appears here."
            actionLabel="Discover events"
            actionHref="/events"
          />
        )}
      </div>

      {selectedPass ? (
        <div
          className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedPass(null)}
        >
          <button
            type="button"
            onClick={() => setSelectedPass(null)}
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white"
            aria-label="Close"
          >
            <X size={18} />
          </button>
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto"
          >
            <GoldenTicket ticket={selectedPass} />
          </div>
        </div>
      ) : null}
    </div>
  );
};
