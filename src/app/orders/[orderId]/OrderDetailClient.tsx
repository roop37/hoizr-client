"use client";

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  Loader2,
  MapPin,
  RefreshCcw,
  Send,
  ShieldCheck,
  Ticket,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import { useEffect, useMemo, useRef, useState } from "react";
import { rupee } from "@/lib/format";
import { gqlRequest } from "@/lib/graphql";
import {
  MY_ORDER_BY_ID_QUERY,
  PUBLIC_EVENT_SUMMARY_BY_ID_QUERY,
  REQUEST_ORDER_REFUND_MUTATION,
} from "@/lib/queries";
import { useAuthStore } from "@/store/auth";
import type { CustomerOrderView } from "@/types/order";
import type { PublicEvent } from "@/types/event";
import { CenteredLoader, ErrorState } from "@/components/ui/feedback";

type OrderEventSummary = Pick<
  PublicEvent,
  | "_id"
  | "title"
  | "startDate"
  | "endDate"
  | "city"
  | "location"
  | "refundPolicy"
  | "eventFlyer"
  | "horizontalFlyer"
>;

const REFUND_WINDOW_DAYS = 2;
const PAYMENT_CONFIRMATION_POLL_INTERVAL_MS = 2000;
const PAYMENT_CONFIRMATION_MAX_POLLS = 60;

// AUDIT-033: never silently swallow a QR render failure — the 6-char
// order suffix the previous fallback implied is NOT a scanner-readable
// credential and would lock customers out at the door. Show an explicit
// retry button and steer the customer toward the email PDF (the safe
// fallback) when the canvas renderer can't draw the code.
const OrderQrCode = ({ payload }: { payload: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [renderToken, setRenderToken] = useState(0);

  useEffect(() => {
    if (!canvasRef.current) return;
    let cancelled = false;
    setRenderError(null);
    QRCode.toCanvas(canvasRef.current, payload, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 232,
      color: { dark: "#0A0A0A", light: "#FFFFFF" },
    }).catch((err) => {
      if (cancelled) return;
      setRenderError(err?.message ?? "QR could not be drawn on this device");
    });
    return () => {
      cancelled = true;
    };
  }, [payload, renderToken]);

  if (renderError) {
    return (
      <div className="flex w-[232px] flex-col items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
        <div className="inline-flex items-center gap-1.5 font-semibold text-amber-900">
          <AlertTriangle size={14} />
          QR didn’t render on this device
        </div>
        <p>
          Open this order from another device, or use the e-ticket PDF
          attached to your booking confirmation email at the door. The
          order number alone is not a valid scan credential.
        </p>
        <button
          type="button"
          onClick={() => setRenderToken((n) => n + 1)}
          className="mt-1 inline-flex h-8 items-center justify-center rounded-lg border border-amber-300 bg-cream px-3 font-semibold text-amber-900 hover:bg-amber-100"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-3 shadow-[0_18px_45px_-18px_rgba(0,0,0,0.55)]">
      <canvas
        ref={canvasRef}
        className="block h-[232px] w-[232px] rounded-lg"
      />
    </div>
  );
};

export const OrderDetailClient = ({ orderId }: { orderId: string }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justPaid = searchParams.get("just_paid") === "1";

  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrated = useAuthStore((s) => s.hydrated);
  const profile = useAuthStore((s) => s.profile);

  const [order, setOrder] = useState<CustomerOrderView | null>(null);
  const [eventSummary, setEventSummary] = useState<OrderEventSummary | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [polls, setPolls] = useState(0);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    if (hydrated && !profile) {
      router.replace(`/login?next=/orders/${orderId}`);
    }
  }, [hydrated, profile, router, orderId]);

  useEffect(() => {
    if (!profile) return;

    let mounted = true;

    const fetchOrder = async () => {
      try {
        const data = await gqlRequest<{ getMyOrderById: CustomerOrderView | null }>(
          MY_ORDER_BY_ID_QUERY,
          { orderId }
        );
        if (!mounted) return;
        if (!data.getMyOrderById) {
          setError("Order not found");
        } else {
          setOrder(data.getMyOrderById);
        }
      } catch (err: any) {
        if (!mounted) return;
        setError(
          err?.response?.errors?.[0]?.message ?? "Unable to load this order"
        );
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchOrder();

    const orderConfirmed =
      order?.orderStatus === "PaymentSuccess" || order?.orderStatus === "CheckedIn";

    // Razorpay webhooks can arrive tens of seconds after the checkout
    // callback. Keep polling the just-paid page long enough for delayed
    // webhook finalisation to attach the QR without requiring a refresh.
    if (justPaid && !orderConfirmed && polls < PAYMENT_CONFIRMATION_MAX_POLLS) {
      const timer = window.setTimeout(() => {
        setPolls((n) => n + 1);
      }, PAYMENT_CONFIRMATION_POLL_INTERVAL_MS);
      return () => {
        mounted = false;
        window.clearTimeout(timer);
      };
    }

    return () => {
      mounted = false;
    };
  }, [profile, orderId, justPaid, polls, order?.orderStatus]);

  // AUDIT-031: separate fetch for event summary so the order detail page
  // can show "Valid for: <title> · <date> · <venue>" above the QR.
  // Customers with multiple orders cannot disambiguate a QR from order
  // line items alone — they need event context on the ticket itself.
  useEffect(() => {
    if (!order?.eventId) return;
    let mounted = true;
    gqlRequest<{ getPublicEventById: OrderEventSummary | null }>(
      PUBLIC_EVENT_SUMMARY_BY_ID_QUERY,
      { id: order.eventId }
    )
      .then((data) => {
        if (!mounted) return;
        if (data.getPublicEventById) setEventSummary(data.getPublicEventById);
      })
      .catch(() => {
        // Best-effort enrichment — the QR + order detail still render.
      });
    return () => {
      mounted = false;
    };
  }, [order?.eventId]);

  const formatEventWhen = (iso?: string): string => {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleString("en-IN", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const heroFlyer = useMemo(
    () => eventSummary?.horizontalFlyer || eventSummary?.eventFlyer || "",
    [eventSummary?.eventFlyer, eventSummary?.horizontalFlyer]
  );

  const venueLine =
    eventSummary?.location?.formattedAddress ??
    [
      eventSummary?.location?.addressLine1,
      eventSummary?.location?.city ?? eventSummary?.city,
    ]
      .filter(Boolean)
      .join(", ");

  if (!hydrated || loading) {
    return (
      <div className="min-h-screen bg-ink text-cream">
        <div className="mx-auto w-full max-w-3xl px-4 py-16">
          <CenteredLoader label="Pulling up your ticket…" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-ink text-cream">
        <div className="mx-auto w-full max-w-3xl px-4 py-16">
          <ErrorState
            title={order ? "Couldn't load this order" : "Order not found"}
            message={
              error ??
              "We couldn't find this order on your account. If you just paid, give it a few seconds and try again."
            }
          />
          <Link
            href="/orders"
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-cream/80 hover:text-cream"
          >
            <ChevronLeft size={14} /> Back to my tickets
          </Link>
        </div>
      </div>
    );
  }

  const confirmed =
    order.orderStatus === "PaymentSuccess" || order.orderStatus === "CheckedIn";
  const waitingForWebhook =
    justPaid &&
    order.orderStatus === "PaymentPending" &&
    polls < PAYMENT_CONFIRMATION_MAX_POLLS;
  const webhookTimedOut =
    justPaid &&
    order.orderStatus === "PaymentPending" &&
    polls >= PAYMENT_CONFIRMATION_MAX_POLLS;
  const canContinuePendingOrder =
    order.orderStatus === "PaymentPending" && !waitingForWebhook;
  const refundDeadline = (() => {
    if (!eventSummary?.endDate) return null;
    const date = new Date(eventSummary.endDate);
    if (Number.isNaN(date.getTime())) return null;
    date.setDate(date.getDate() + REFUND_WINDOW_DAYS);
    return date;
  })();
  const refundWindowOpen = refundDeadline
    ? Date.now() <= refundDeadline.getTime()
    : false;
  const refundAlreadyRequested = Boolean(
    order.refundRequestStatus || order.refundRequestedAt
  );
  const refundableOrder = order.orderStatus === "PaymentSuccess" && !order.checkedIn;
  const canRequestRefund =
    refundableOrder && refundWindowOpen && !refundAlreadyRequested;
  const refundPolicyText =
    eventSummary?.refundPolicy?.trim() ||
    `Refunds can be requested within ${REFUND_WINDOW_DAYS} days after the event ends, before the ticket is checked in.`;
  const refundDeadlineLabel = refundDeadline
    ? refundDeadline.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const submitRefundRequest = async () => {
    const reason = refundReason.trim();
    if (!reason) {
      setRefundError("Select or enter a reason before sending the request.");
      return;
    }
    setRefundSubmitting(true);
    setRefundError(null);
    try {
      const data = await gqlRequest<{ requestOrderRefund: CustomerOrderView }>(
        REQUEST_ORDER_REFUND_MUTATION,
        { orderId: order._id, reason }
      );
      setOrder(data.requestOrderRefund);
      setRefundReason("");
      setRefundModalOpen(false);
    } catch (err: any) {
      setRefundError(
        err?.response?.errors?.[0]?.message ?? "Unable to send refund request"
      );
    } finally {
      setRefundSubmitting(false);
    }
  };

  const orderShortId = order._id.slice(-6).toUpperCase();
  const ticketCount = order.tickets.reduce(
    (sum, t) => sum + Number(t.quantity ?? 0),
    0
  );

  const statusBadge = (() => {
    switch (order.orderStatus) {
      case "PaymentSuccess":
        return {
          label: "Booking confirmed",
          tone: "bg-emerald-400/15 text-emerald-200 ring-emerald-400/40",
        };
      case "CheckedIn":
        return {
          label: "Checked in",
          tone: "bg-sky-400/15 text-sky-200 ring-sky-400/40",
        };
      case "PaymentPending":
        return {
          label: "Pending payment",
          tone: "bg-amber-400/15 text-amber-200 ring-amber-400/40",
        };
      case "PaymentFailed":
        return {
          label: "Payment failed",
          tone: "bg-rose-400/15 text-rose-200 ring-rose-400/40",
        };
      case "Superseded":
        return {
          label: "Replaced by newer order",
          tone: "bg-slate-400/15 text-slate-200 ring-slate-400/40",
        };
      default:
        return {
          label: order.orderStatus,
          tone: "bg-cream/10 text-cream/80 ring-cream/30",
        };
    }
  })();

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink text-cream">
      {/* Apple Music-style ambient background sampled from the flyer */}
      <div className="pointer-events-none absolute inset-0">
        {heroFlyer ? (
          <>
            <img
              src={heroFlyer}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-3xl"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-ink/30 via-ink/70 to-ink" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/30 via-ink to-ink" />
        )}
      </div>

      <div className="relative">
        <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-8 md:px-6 md:pt-12">
          <Link
            href="/orders"
            className="inline-flex items-center gap-1 text-sm font-semibold text-cream/70 transition hover:text-cream"
          >
            <ChevronLeft size={14} /> All tickets
          </Link>

          {/* Hero — flyer + event header */}
          <section className="mt-6 overflow-hidden rounded-3xl border border-cream/10 bg-cream/[0.04] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.75)] backdrop-blur-xl">
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-ink">
              {heroFlyer ? (
                <img
                  src={heroFlyer}
                  alt={eventSummary?.title ?? "Event flyer"}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-700/40 via-ink to-ink" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ring-1 ring-inset ${statusBadge.tone}`}
                >
                  <Ticket size={12} />
                  {statusBadge.label}
                </span>
                {eventSummary?.title ? (
                  <h1 className="mt-3 text-2xl font-semibold leading-tight text-cream md:text-3xl">
                    {eventSummary.title}
                  </h1>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-cream/80">
                  {eventSummary?.startDate ? (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays size={14} className="text-cream/60" />
                      {formatEventWhen(eventSummary.startDate)}
                    </span>
                  ) : null}
                  {venueLine ? (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={14} className="text-cream/60" />
                      <span className="line-clamp-1">{venueLine}</span>
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          {/* Status banners */}
          {justPaid && confirmed ? (
            <div className="mt-5 flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
              <CheckCircle2 size={16} />
              Payment confirmed. Your ticket is ready below.
            </div>
          ) : null}

          {waitingForWebhook ? (
            <div className="mt-5 flex items-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              <Loader2 size={16} className="animate-spin" />
              Confirming your payment with the gateway…
            </div>
          ) : null}

          {webhookTimedOut ? (
            <div className="mt-5 space-y-2 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle size={14} />
                Payment didn’t confirm
              </div>
              <p className="text-amber-100/85">
                We didn’t hear back from the payment gateway in time. If
                money was debited from your account, it will be refunded
                within 24 hours — Razorpay reverses uncaptured holds
                automatically and our team reconciles any captured-but-late
                payments.
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-amber-300/40 bg-cream/5 px-3 text-xs font-semibold text-amber-100 hover:bg-cream/10"
              >
                Reload this page
              </button>
            </div>
          ) : null}

          {canContinuePendingOrder ? (
            <div className="mt-5 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
              <div className="font-semibold">Payment is still pending</div>
              <p className="mt-1 text-amber-100/85">
                You can continue this order while the ticket lock is active. If
                the lock has expired, checkout will ask you to reselect tickets.
              </p>
              <Link
                href={`/checkout?eventId=${encodeURIComponent(order.eventId)}&retryOrderId=${encodeURIComponent(order._id)}`}
                className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-cream transition hover:opacity-95"
              >
                <CreditCard size={16} />
                Continue this order
              </Link>
            </div>
          ) : null}

          {/* The ticket stub */}
          <section className="relative mt-6">
            {/* Perforated edge — two halves separated by a notched divider */}
            <div className="overflow-hidden rounded-3xl bg-cream text-ink shadow-[0_40px_80px_-30px_rgba(0,0,0,0.7)]">
              {/* Top half — QR + summary */}
              <div className="grid gap-6 p-6 md:grid-cols-[auto_1fr] md:items-center md:p-8">
                {confirmed && order.qrCodeData ? (
                  <div className="flex flex-col items-center gap-3">
                    <OrderQrCode payload={order.qrCodeData} />
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                      <ShieldCheck size={12} /> Show this at the door
                    </span>
                  </div>
                ) : (
                  <div className="flex h-[232px] w-[232px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-white text-center text-xs text-muted">
                    {waitingForWebhook ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Finalising your booking…
                      </>
                    ) : (
                      <>
                        <Ticket size={20} />
                        QR appears once payment is confirmed
                      </>
                    )}
                  </div>
                )}

                <div className="min-w-0">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                    Order
                  </div>
                  <div className="mt-1 font-mono text-2xl font-bold tracking-[0.18em] text-ink">
                    #{orderShortId}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                        Tickets
                      </div>
                      <div className="mt-1 text-lg font-semibold text-ink">
                        {ticketCount}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                        Total paid
                      </div>
                      <div className="mt-1 text-lg font-semibold text-ink">
                        {rupee(order.totalAmount)}
                      </div>
                    </div>
                  </div>

                  <ul className="mt-4 space-y-1.5 text-sm text-ink">
                    {order.tickets.map((t) => (
                      <li
                        key={t.ticketTypeId}
                        className="flex items-baseline justify-between gap-2"
                      >
                        <span className="truncate">
                          <span className="font-semibold">{t.quantity}×</span>{" "}
                          {t.ticketName}
                        </span>
                        <span className="font-semibold">
                          {rupee(t.totalPrice)}
                        </span>
                      </li>
                    ))}
                    {order.extras?.map((e) => (
                      <li
                        key={e.extraId}
                        className="flex items-baseline justify-between gap-2 text-muted"
                      >
                        <span className="truncate">
                          {e.quantity}× {e.extraName}
                        </span>
                        <span>{rupee(e.totalPrice)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Perforated divider */}
              <div className="relative">
                <div
                  className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-ink"
                  aria-hidden="true"
                />
                <div
                  className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-ink"
                  aria-hidden="true"
                />
                <div
                  className="mx-6 border-t border-dashed border-ink/20"
                  aria-hidden="true"
                />
              </div>

              {/* Bottom half — fees breakdown */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 p-6 text-sm md:grid-cols-4 md:p-8">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                    Subtotal
                  </div>
                  <div className="mt-1 font-semibold text-ink">
                    {rupee(order.subtotal)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                    Convenience fee
                  </div>
                  <div className="mt-1 font-semibold text-ink">
                    {rupee(order.platformFee)}{" "}
                    <span className="font-normal text-muted">
                      ({order.applicationFeePercent}%)
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                    GST on fee
                  </div>
                  <div className="mt-1 font-semibold text-ink">
                    {rupee(order.platformFeeGst)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                    Taxes
                  </div>
                  <div className="mt-1 font-semibold text-ink">
                    {rupee(order.taxes)}{" "}
                    <span className="font-normal text-muted">
                      ({order.taxesPercent}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Refund card */}
          {confirmed || refundAlreadyRequested ? (
            <section className="mt-6 rounded-3xl border border-cream/10 bg-cream/[0.04] p-5 text-sm text-cream/90 backdrop-blur-xl md:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/60">
                    <RefreshCcw size={14} />
                    Refund request
                  </div>
                  <p className="mt-2 text-cream/75">{refundPolicyText}</p>
                  {refundDeadlineLabel ? (
                    <p className="mt-2 text-xs font-semibold text-cream">
                      Request deadline: {refundDeadlineLabel}
                    </p>
                  ) : null}
                </div>

                {canRequestRefund ? (
                  <button
                    type="button"
                    onClick={() => {
                      setRefundError(null);
                      setRefundModalOpen(true);
                    }}
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-cream transition hover:opacity-95"
                  >
                    <RefreshCcw size={16} />
                    Request refund
                  </button>
                ) : null}
              </div>

              {refundAlreadyRequested ? (
                <div className="mt-4 rounded-2xl border border-emerald-300/30 bg-emerald-400/10 p-3 text-emerald-100">
                  <div className="font-semibold">
                    Refund request sent
                    {order.refundRequestStatus
                      ? `: ${order.refundRequestStatus}`
                      : ""}
                  </div>
                  {order.refundRequestedAt ? (
                    <div className="mt-1 text-xs text-emerald-100/85">
                      Requested on{" "}
                      {new Date(order.refundRequestedAt).toLocaleString("en-IN")}
                    </div>
                  ) : null}
                  {order.refundRequestReason ? (
                    <div className="mt-1 text-xs text-emerald-100/85">
                      Reason: {order.refundRequestReason}
                    </div>
                  ) : null}
                </div>
              ) : !canRequestRefund ? (
                <div className="mt-4 rounded-2xl border border-cream/10 bg-cream/[0.04] p-3 text-xs text-cream/70">
                  {order.checkedIn
                    ? "This ticket has already been checked in."
                    : !refundWindowOpen
                    ? "The refund request window is closed for this event."
                    : order.orderStatus !== "PaymentSuccess"
                    ? "Refund requests are available after payment is confirmed."
                    : "This order is not eligible for a self-service refund request."}
                </div>
              ) : null}
            </section>
          ) : null}

          {/* AUDIT-034: SoT §27 disclosure — Hoizr is the ticketing
              platform, the event organiser is responsible for the event
              itself. Must appear on the order surface (in addition to the
              email footer) at point of admission. */}
          <p className="mt-8 text-center text-xs text-cream/55">
            Ticketing by Hoizr. The event itself is run by the organiser —
            Hoizr is not the event organiser.
          </p>
        </div>
      </div>

      {refundModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/70 px-4 py-5 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-cream p-5 text-ink shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-ink">
                  Request a refund
                </div>
                <p className="mt-1 text-sm text-muted">
                  Send this to the organiser for review. The order remains
                  active until the refund is approved and processed.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!refundSubmitting) setRefundModalOpen(false);
                }}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted hover:text-ink"
                aria-label="Close refund request dialog"
              >
                <X size={16} />
              </button>
            </div>

            <label className="mt-5 block text-xs font-semibold uppercase tracking-wider text-muted">
              Reason
              <select
                value={refundReason}
                onChange={(event) => setRefundReason(event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-normal normal-case tracking-normal text-ink outline-none focus:border-accent"
                disabled={refundSubmitting}
              >
                <option value="">Select a reason</option>
                <option value="Event timing no longer works">
                  Event timing no longer works
                </option>
                <option value="Booked the wrong ticket">
                  Booked the wrong ticket
                </option>
                <option value="Duplicate booking">Duplicate booking</option>
                <option value="Payment or pricing issue">
                  Payment or pricing issue
                </option>
                <option value="Other">Other</option>
              </select>
            </label>

            {refundError ? (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {refundError}
              </div>
            ) : null}

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setRefundModalOpen(false)}
                disabled={refundSubmitting}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold text-muted hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitRefundRequest}
                disabled={refundSubmitting}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-cream transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {refundSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                Send request
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
