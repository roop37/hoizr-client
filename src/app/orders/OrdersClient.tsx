"use client";

import {
  CheckCircle2,
  Clock,
  Package,
  TicketCheck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { rupee } from "@/lib/format";
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

type Tab = "tickets" | "merch";

const ticketStatusBadge = (status: OrderStatus) => {
  switch (status) {
    case "PaymentSuccess":
      return {
        Icon: CheckCircle2,
        text: "Confirmed",
        className: "bg-emerald-50 text-emerald-700",
      };
    case "CheckedIn":
      return {
        Icon: TicketCheck,
        text: "Checked in",
        className: "bg-sky-50 text-sky-700",
      };
    case "PaymentPending":
      return {
        Icon: Clock,
        text: "Pending",
        className: "bg-amber-50 text-amber-700",
      };
    case "PaymentFailed":
    case "Cancelled":
    case "Superseded":
      return {
        Icon: XCircle,
        text: status === "Superseded" ? "Replaced" : "Cancelled",
        className: "bg-gray-100 text-gray-600",
      };
    case "Refunded":
      return {
        Icon: XCircle,
        text: "Refunded",
        className: "bg-purple-50 text-purple-700",
      };
    default:
      return {
        Icon: Clock,
        text: status,
        className: "bg-gray-100 text-gray-600",
      };
  }
};

const merchStatusBadge = (status: ArtistMerchOrderStatus) => {
  switch (status) {
    case "PaymentSuccess":
      return {
        Icon: CheckCircle2,
        text: "Paid",
        className: "bg-blue-50 text-blue-700",
      };
    case "Fulfilled":
      return {
        Icon: Package,
        text: "Shipped",
        className: "bg-emerald-50 text-emerald-700",
      };
    case "PaymentPending":
      return {
        Icon: Clock,
        text: "Pending",
        className: "bg-amber-50 text-amber-700",
      };
    case "PaymentFailed":
    case "Cancelled":
      return {
        Icon: XCircle,
        text: status === "Cancelled" ? "Cancelled" : "Payment failed",
        className: "bg-gray-100 text-gray-600",
      };
    case "Refunded":
      return {
        Icon: XCircle,
        text: "Refunded",
        className: "bg-purple-50 text-purple-700",
      };
    default:
      return {
        Icon: Clock,
        text: status,
        className: "bg-gray-100 text-gray-600",
      };
  }
};

const formatDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", {
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

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
    ]).then((results) => {
      const [ticketsRes, merchRes] = results;
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
      // We don't surface merch-fetch failures so the page keeps working
      // for the (much more common) ticket-only customer.
      setLoading(false);
    });
  }, [profile]);

  const merchCount = useMemo(
    () =>
      merchOrders.filter(
        (o) => o.status === "PaymentSuccess" || o.status === "Fulfilled"
      ).length,
    [merchOrders]
  );

  if (!hydrated || loading) {
    // Skeleton cards instead of a bare spinner — the page chrome (title
    // + tabs) renders immediately so the user sees the right layout
    // forming, not a 40vh hole.
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 md:py-12">
        <div className="h-7 w-40 animate-pulse rounded bg-border/60" />
        <div className="mt-3 h-4 w-72 animate-pulse rounded bg-border/40" />
        <div className="mt-6 flex gap-1 border-b border-border">
          <div className="h-9 w-24 animate-pulse rounded-t bg-border/40" />
          <div className="h-9 w-24 animate-pulse rounded-t bg-border/40" />
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
    <div className="mx-auto w-full max-w-3xl px-4 py-10 md:py-12">
      <h1 className="text-2xl font-semibold md:text-3xl">My orders</h1>
      <p className="mt-1 text-sm text-muted">
        Tickets and merch you've ordered through Hoizr.
      </p>

      <div className="mt-6 flex gap-1 border-b border-border">
        <button
          type="button"
          onClick={() => setTab("tickets")}
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition ${
            tab === "tickets"
              ? "border-accent text-ink"
              : "border-transparent text-muted hover:text-ink"
          }`}
        >
          Tickets · {orders.length}
        </button>
        <button
          type="button"
          onClick={() => setTab("merch")}
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition ${
            tab === "merch"
              ? "border-accent text-ink"
              : "border-transparent text-muted hover:text-ink"
          }`}
        >
          Merch · {merchCount}
        </button>
      </div>

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
                  className="block rounded-2xl border border-border bg-cream p-4 transition hover:bg-background"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs text-muted">
                        Order #{order._id.slice(-6).toUpperCase()}
                      </div>
                      <div className="mt-1 truncate font-semibold">
                        {order.tickets
                          .map((t) => `${t.quantity}× ${t.ticketName}`)
                          .join(", ")}
                      </div>
                      {order.extras?.length ? (
                        <div className="mt-0.5 truncate text-xs text-muted">
                          +{" "}
                          {order.extras
                            .map((e) => `${e.quantity}× ${e.extraName}`)
                            .join(", ")}
                        </div>
                      ) : null}
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}
                    >
                      <Icon size={12} />
                      {badge.text}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-muted">
                      {formatDate(order.createdAt)}
                    </span>
                    <span className="font-semibold">
                      {rupee(order.totalAmount)}
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
        ) : merchOrders.length ? (
          merchOrders.map((order) => {
            const badge = merchStatusBadge(order.status);
            const Icon = badge.Icon;
            return (
              <div
                key={order._id}
                className="block rounded-2xl border border-border bg-cream p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-muted">
                      Order #{order._id.slice(-6).toUpperCase()}
                    </div>
                    <div className="mt-1 truncate font-semibold">
                      {order.quantity}× {order.itemName}
                    </div>
                    {order.shippingCity ? (
                      <div className="mt-0.5 truncate text-xs text-muted">
                        Shipping to {order.shippingCity}
                        {order.shippingPincode
                          ? ` · ${order.shippingPincode}`
                          : ""}
                      </div>
                    ) : null}
                    {order.status === "Fulfilled" &&
                    (order.shippedAt || order.carrier || order.trackingNumber) ? (
                      <div className="mt-1 text-xs text-muted">
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
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}
                  >
                    <Icon size={12} />
                    {badge.text}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted">
                    {formatDate(order.createdAt)}
                  </span>
                  <span className="font-semibold">
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
        )}
      </div>
    </div>
  );
};
