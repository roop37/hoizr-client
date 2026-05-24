"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  Loader2,
  RefreshCcw,
  Send,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
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
      width: 260,
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
      <div className="flex w-[260px] flex-col items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
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
    <canvas
      ref={canvasRef}
      className="h-[260px] w-[260px] rounded-xl border border-border bg-cream"
    />
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
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <CenteredLoader label="Pulling up your ticket…" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <ErrorState
          title={order ? "Couldn't load this order" : "Order not found"}
          message={
            error ??
            "We couldn't find this order on your account. If you just paid, give it a few seconds and try again."
          }
        />
        <Link
          href="/orders"
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline"
        >
          <ChevronLeft size={14} /> Back to my tickets
        </Link>
      </div>
    );
  }

  const confirmed =
    order.orderStatus === "PaymentSuccess" || order.orderStatus === "CheckedIn";
  const waitingForWebhook =
    justPaid &&
    order.orderStatus === "PaymentPending" &&
    polls < PAYMENT_CONFIRMATION_MAX_POLLS;
  // AUDIT-032: webhook didn't land in 16s (8 × 2s polling). Tell the
  // customer the payment didn't confirm and reassure them about the
  // money path — Razorpay reverses authorized-but-uncaptured holds
  // automatically; captured-but-late webhooks are reconciled by the
  // server-side late-capture handler.
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

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 md:py-12">
      <Link
        href="/orders"
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink"
      >
        <ChevronLeft size={14} /> All tickets
      </Link>

      <div className="mt-4 space-y-5">
        {eventSummary ? (
          <div className="rounded-2xl border border-border bg-cream p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted">
              Valid for
            </div>
            <div className="mt-1.5 text-base font-semibold text-ink md:text-lg">
              {eventSummary.title}
            </div>
            <div className="mt-1 text-sm text-muted">
              {[formatEventWhen(eventSummary.startDate), venueLine]
                .filter(Boolean)
                .join(" · ")}
            </div>
          </div>
        ) : null}

        {justPaid && confirmed ? (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <CheckCircle2 size={16} />
            Payment confirmed. Your ticket is ready.
          </div>
        ) : null}

        {waitingForWebhook ? (
          <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <Loader2 size={16} className="animate-spin" />
            Confirming your payment with the gateway…
          </div>
        ) : null}

        {webhookTimedOut ? (
          <div className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle size={14} />
              Payment didn’t confirm
            </div>
            <p>
              We didn’t hear back from the payment gateway in time. If money
              was debited from your account, it will be refunded within 24
              hours — Razorpay reverses uncaptured holds automatically and
              our team reconciles any captured-but-late payments.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-amber-300 bg-cream px-3 text-xs font-semibold text-amber-900 hover:bg-amber-100"
            >
              Reload this page
            </button>
          </div>
        ) : null}

        {canContinuePendingOrder ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <div className="font-semibold">Payment is still pending</div>
            <p className="mt-1 text-amber-800">
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

        {confirmed || refundAlreadyRequested ? (
          <div className="rounded-2xl border border-border bg-cream p-5 text-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                  <RefreshCcw size={14} />
                  Refund request
                </div>
                <p className="mt-2 text-muted">{refundPolicyText}</p>
                {refundDeadlineLabel ? (
                  <p className="mt-2 text-xs font-semibold text-ink">
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
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-900">
                <div className="font-semibold">
                  Refund request sent
                  {order.refundRequestStatus ? `: ${order.refundRequestStatus}` : ""}
                </div>
                {order.refundRequestedAt ? (
                  <div className="mt-1 text-xs">
                    Requested on{" "}
                    {new Date(order.refundRequestedAt).toLocaleString("en-IN")}
                  </div>
                ) : null}
                {order.refundRequestReason ? (
                  <div className="mt-1 text-xs">
                    Reason: {order.refundRequestReason}
                  </div>
                ) : null}
              </div>
            ) : !canRequestRefund ? (
              <div className="mt-4 rounded-xl border border-border bg-white/70 p-3 text-xs text-muted">
                {order.checkedIn
                  ? "This ticket has already been checked in."
                  : !refundWindowOpen
                  ? "The refund request window is closed for this event."
                  : order.orderStatus !== "PaymentSuccess"
                  ? "Refund requests are available after payment is confirmed."
                  : "This order is not eligible for a self-service refund request."}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="rounded-2xl border border-border bg-cream p-5">
          <div className="text-xs text-muted">
            Order #{order._id.slice(-6).toUpperCase()}
          </div>
          <div className="mt-2 grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div className="space-y-1.5">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted">
                {order.orderStatus === "PaymentSuccess"
                  ? "Confirmed"
                  : order.orderStatus === "CheckedIn"
                  ? "Checked in"
                  : order.orderStatus === "PaymentPending"
                  ? "Pending payment"
                  : order.orderStatus === "PaymentFailed"
                  ? "Payment failed"
                  : order.orderStatus === "Superseded"
                  ? "Replaced by newer order"
                  : order.orderStatus}
              </div>
              <ul className="space-y-1 text-sm">
                {order.tickets.map((t) => (
                  <li key={t.ticketTypeId} className="flex justify-between">
                    <span>
                      {t.quantity}× {t.ticketName}
                    </span>
                    <span className="font-semibold">{rupee(t.totalPrice)}</span>
                  </li>
                ))}
                {order.extras?.map((e) => (
                  <li key={e.extraId} className="flex justify-between">
                    <span>
                      {e.quantity}× {e.extraName}
                    </span>
                    <span className="font-semibold">{rupee(e.totalPrice)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-between border-t border-border pt-2 text-sm font-semibold">
                <span>Total paid</span>
                <span>{rupee(order.totalAmount)}</span>
              </div>
            </div>

            {confirmed && order.qrCodeData ? (
              <div className="flex flex-col items-center gap-2">
                <OrderQrCode payload={order.qrCodeData} />
                <span className="text-xs text-muted">Show this QR at the door</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-cream p-5 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted">
                Subtotal
              </div>
              <div className="mt-1 font-semibold">{rupee(order.subtotal)}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted">
                Convenience fee
              </div>
              <div className="mt-1 font-semibold">
                {rupee(order.platformFee)}{" "}
                <span className="font-normal text-muted">
                  ({order.applicationFeePercent}%)
                </span>
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted">
                GST on fee
              </div>
              <div className="mt-1 font-semibold">{rupee(order.platformFeeGst)}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted">
                Taxes
              </div>
              <div className="mt-1 font-semibold">
                {rupee(order.taxes)}{" "}
                <span className="font-normal text-muted">
                  ({order.taxesPercent}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* AUDIT-034: SoT §27 disclosure — Hoizr is the ticketing
            platform, the event organiser is responsible for the event
            itself. Must appear on the order surface (in addition to the
            email footer) at point of admission. */}
        <p className="text-center text-xs text-muted">
          Ticketing by Hoizr. The event itself is run by the organiser —
          Hoizr is not the event organiser.
        </p>
      </div>

      {refundModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 px-4 py-5 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-cream p-5 shadow-xl">
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
