"use client";

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  Download,
  Loader2,
  MapPin,
  RefreshCcw,
  Send,
  Share2,
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
import { sanitizeRichText } from "@/lib/sanitize";
import {
  MY_ORDER_BY_ID_QUERY,
  MY_ORDER_INVOICE_QUERY,
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
  | "description"
>;

const REFUND_WINDOW_DAYS = 2;
const PAYMENT_CONFIRMATION_POLL_INTERVAL_MS = 2000;
// 30 × 2s = 60s. The user-facing contract is "we wait one minute for
// the gateway, then call it failed and tell you any captured payment
// will be refunded." BullMQ webhook retries take seconds, so a minute
// is generous for the happy path and short enough that a stuck
// pending order doesn't keep the customer staring at a spinner.
const PAYMENT_CONFIRMATION_MAX_POLLS = 30;

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

/**
 * YouTube-style ambient color sampler. Pulls a saturated average from
 * the flyer pixels and exposes it as an rgb string the mobile background
 * can spread radially. CORS-failed loads (e.g. a Cloudinary delivery
 * URL without crossorigin headers) silently no-op — the page falls back
 * to a neutral ink wash so the UI never shows a broken state.
 */
const useAmbientColor = (src?: string | null): string | null => {
  const [color, setColor] = useState<string | null>(null);
  useEffect(() => {
    if (!src) {
      setColor(null);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement("canvas");
        const size = 32;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        let r = 0;
        let g = 0;
        let b = 0;
        let n = 0;
        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3];
          if (alpha < 64) continue;
          // De-prioritise near-greyscale pixels so the ambient picks up the
          // dominant *hue* of a flyer (e.g. the red of "The Inner Room")
          // instead of averaging toward muddy grey.
          const cr = data[i];
          const cg = data[i + 1];
          const cb = data[i + 2];
          const max = Math.max(cr, cg, cb);
          const min = Math.min(cr, cg, cb);
          if (max - min < 20) continue;
          r += cr;
          g += cg;
          b += cb;
          n += 1;
        }
        if (!n) return;
        setColor(
          `rgb(${Math.round(r / n)}, ${Math.round(g / n)}, ${Math.round(b / n)})`
        );
      } catch {
        // Cross-origin taint or canvas API failure — leave ambient null.
      }
    };
    img.onerror = () => {
      if (!cancelled) setColor(null);
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);
  return color;
};

const buildShareText = (
  eventTitle: string | undefined,
  when: string,
  orderShortId: string
) =>
  `My ticket for ${eventTitle ?? "the event"} on ${when}. Order #${orderShortId} via Hoizr.`;

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
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [refundPolicyOpen, setRefundPolicyOpen] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [invoiceState, setInvoiceState] = useState<{
    busy: boolean;
    message: string | null;
  }>({ busy: false, message: null });

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
      order?.orderStatus === "PAYMENT_SUCCESS" || order?.orderStatus === "CHECKED_IN";

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

  // Mobile ambient glow is sampled from the portrait flyer (more
  // saturated hues than the often-letterboxed landscape variant).
  const ambientColor = useAmbientColor(
    eventSummary?.eventFlyer || eventSummary?.horizontalFlyer || null
  );

  const venueLine =
    eventSummary?.location?.formattedAddress ??
    [
      eventSummary?.location?.addressLine1,
      eventSummary?.location?.city ?? eventSummary?.city,
    ]
      .filter(Boolean)
      .join(", ");

  const handleShareTicket = async () => {
    if (!order) return;
    const orderShortId = order._id.slice(-6).toUpperCase();
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = buildShareText(
      eventSummary?.title,
      eventSummary?.startDate
        ? new Date(eventSummary.startDate).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "the upcoming date",
      orderShortId
    );
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: eventSummary?.title ?? "My Hoizr ticket",
          text,
          url,
        });
        return;
      }
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        setShareToast("Ticket link copied to clipboard");
        setTimeout(() => setShareToast(null), 2400);
        return;
      }
      setShareToast("Sharing isn't supported on this browser");
      setTimeout(() => setShareToast(null), 2400);
    } catch (err: any) {
      // User cancelled the share sheet — silently no-op.
      if (err?.name === "AbortError") return;
      setShareToast("Couldn't share — try copying the link from the address bar");
      setTimeout(() => setShareToast(null), 2400);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!order || invoiceState.busy) return;
    setInvoiceState({ busy: true, message: null });
    try {
      const data = await gqlRequest<{
        getMyOrderInvoice: {
          invoiceNumber: string;
          pdfUrl: string;
          expiresAt: string;
        } | null;
      }>(MY_ORDER_INVOICE_QUERY, { orderId: order._id });

      if (!data.getMyOrderInvoice) {
        setInvoiceState({
          busy: false,
          message:
            "Your invoice isn't ready yet — Hoizr generates it within a few minutes of payment. Try again shortly, or check the order confirmation email.",
        });
        return;
      }

      // Open in a new tab so the customer keeps the order page open
      // while the PDF downloads. Cloudinary's private_download_url uses
      // attachment disposition, so most browsers save instead of inline.
      window.open(data.getMyOrderInvoice.pdfUrl, "_blank", "noopener,noreferrer");
      setInvoiceState({
        busy: false,
        message: `Invoice ${data.getMyOrderInvoice.invoiceNumber} opened in a new tab.`,
      });
    } catch (err: any) {
      const code = err?.response?.errors?.[0]?.extensions?.code;
      const message =
        code === "INVOICE_NOT_CONFIGURED"
          ? "Invoice downloads aren't configured on this server yet. Please email contact@hoizr.com and we'll send your invoice."
          : err?.response?.errors?.[0]?.message ??
            err?.message ??
            "Couldn't fetch the invoice. Try again in a moment.";
      setInvoiceState({ busy: false, message });
    }
  };

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
    order.orderStatus === "PAYMENT_SUCCESS" || order.orderStatus === "CHECKED_IN";
  const waitingForWebhook =
    justPaid &&
    order.orderStatus === "PAYMENT_PENDING" &&
    polls < PAYMENT_CONFIRMATION_MAX_POLLS;
  const webhookTimedOut =
    justPaid &&
    order.orderStatus === "PAYMENT_PENDING" &&
    polls >= PAYMENT_CONFIRMATION_MAX_POLLS;
  // Only offer the "continue this order" retry for orders the customer
  // *abandoned* (never reached the Razorpay handler). If they came back
  // with ?just_paid=1, Razorpay already accepted a payment intent for
  // this orderId — re-opening checkout would reuse the same order but
  // mint a fresh Razorpay order_id and charge them again while the
  // first capture is still reconciling. Show the timeout/refund banner
  // instead and let the webhook (or admin reconciliation) finalise.
  const canContinuePendingOrder =
    order.orderStatus === "PAYMENT_PENDING" &&
    !waitingForWebhook &&
    !webhookTimedOut &&
    !justPaid;
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
  const refundableOrder = order.orderStatus === "PAYMENT_SUCCESS" && !order.checkedIn;
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
      case "PAYMENT_SUCCESS":
        return {
          label: "Booking confirmed",
          tone: "bg-emerald-400/15 text-emerald-200 ring-emerald-400/40",
        };
      case "CHECKED_IN":
        return {
          label: "Checked in",
          tone: "bg-sky-400/15 text-sky-200 ring-sky-400/40",
        };
      case "PAYMENT_PENDING":
        return {
          label: "Pending payment",
          tone: "bg-amber-400/15 text-amber-200 ring-amber-400/40",
        };
      case "PAYMENT_FAILED":
        return {
          label: "Payment failed",
          tone: "bg-rose-400/15 text-rose-200 ring-rose-400/40",
        };
      case "SUPERSEDED":
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

  const eventDescription = eventSummary?.description?.trim() ?? "";
  // Description on the public Event doc is rich-text HTML authored in
  // the business-client editor. For the inline 3-line preview we strip
  // tags + collapse whitespace so the clamp doesn't show raw markup;
  // the modal renders the sanitised HTML so formatting (bullets,
  // bold, line breaks) survives.
  const eventDescriptionPreview = eventDescription
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
  const eventWhenLabel = eventSummary?.startDate
    ? formatEventWhen(eventSummary.startDate)
    : "";

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink text-cream">
      {/* Background — desktop renders a heavily blurred copy of the flyer
          as ambient art; mobile uses a YouTube-style radial glow sampled
          from the flyer's dominant hue so the page feels lit by the
          flyer without the visual noise a blurred poster brings to a
          small viewport. */}
      <div className="pointer-events-none absolute inset-0">
        {heroFlyer ? (
          <img
            src={heroFlyer}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 hidden h-full w-full scale-110 object-cover opacity-50 blur-3xl md:block"
          />
        ) : null}
        <div
          className="absolute inset-x-0 top-0 h-[60vh] md:hidden"
          style={{
            background: ambientColor
              ? `radial-gradient(ellipse 110% 80% at 50% 18%, ${ambientColor}66, ${ambientColor}1f 38%, transparent 72%)`
              : "linear-gradient(to bottom, rgba(20, 184, 130, 0.18), transparent 55%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/80 to-ink" />
      </div>

      <div className="relative">
        <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-6 md:px-6 md:pt-10">
          {/* Mobile hides the back link per design — the bottom nav
              already covers backward navigation on small screens. */}
          <Link
            href="/orders"
            className="hidden md:inline-flex items-center gap-1 text-sm font-semibold text-cream/70 transition hover:text-cream"
          >
            <ChevronLeft size={14} /> All tickets
          </Link>

          {/* Hero — compact event header. Title/badge sit BELOW the
              flyer (cleaner than the previous overlaid gradient at this
              new shorter height). The mobile flyer is portrait so it
              composes with the ambient glow; desktop swaps to a wide
              banner to keep vertical real estate for the ticket card. */}
          <section className="mt-4 md:mt-6">
            <div className="flex flex-col items-center gap-4 md:flex-row md:items-stretch md:gap-6">
              <div className="relative overflow-hidden rounded-3xl bg-ink/40 ring-1 ring-cream/10 shadow-[0_24px_60px_-25px_rgba(0,0,0,0.7)]">
                {heroFlyer ? (
                  <img
                    src={heroFlyer}
                    alt={eventSummary?.title ?? "Event flyer"}
                    className="block h-[220px] w-auto max-w-[240px] object-cover md:h-[220px] md:max-w-[300px]"
                  />
                ) : (
                  <div className="h-[220px] w-[180px] bg-gradient-to-br from-emerald-700/40 via-ink to-ink" />
                )}
              </div>
              {/* Desktop-only meta column. On mobile the same fields are
                  composed inside the white ticket card so the flyer can
                  stay clean and the meta sits above the QR with a
                  divider, per request. */}
              <div className="hidden flex-1 flex-col items-start justify-center text-left md:flex">
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
                  {eventWhenLabel ? (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays size={14} className="text-cream/60" />
                      {eventWhenLabel}
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

          {/* Two-column grid: about/refund on the left, sticky ticket
              card on the right. Collapses to a single stacked column on
              mobile with the ticket card placed FIRST so the QR is
              above-the-fold on a phone. */}
          <div className="mt-6 grid gap-6 md:mt-8 md:grid-cols-[minmax(0,1fr)_360px] md:items-start">
            {/* TICKET CARD — appears second on desktop (right column),
                first on mobile via order-first. */}
            <aside className="order-first md:order-last md:sticky md:top-6">
              <div className="overflow-hidden rounded-3xl bg-cream text-ink shadow-[0_30px_70px_-25px_rgba(0,0,0,0.7)]">
                {/* Mobile-only event meta block inside the white card —
                    badge + title + date + venue then a dashed divider
                    before the QR. Hidden on desktop because the same
                    fields already render in the hero meta column. */}
                <div className="border-b border-dashed border-border px-5 pb-4 pt-5 text-ink md:hidden">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ring-1 ring-inset ${statusBadge.tone}`}
                  >
                    <Ticket size={12} />
                    {statusBadge.label}
                  </span>
                  {eventSummary?.title ? (
                    <h1 className="mt-2 text-lg font-semibold leading-snug text-ink">
                      {eventSummary.title}
                    </h1>
                  ) : null}
                  {eventWhenLabel ? (
                    <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-muted">
                      <CalendarDays size={13} />
                      {eventWhenLabel}
                    </div>
                  ) : null}
                  {venueLine ? (
                    <div className="mt-1 flex items-start gap-1.5 text-xs text-muted">
                      <MapPin size={13} className="mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{venueLine}</span>
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-col items-center gap-4 px-5 pb-5 pt-6">
                  {confirmed && order.qrCodeData ? (
                    <>
                      <OrderQrCode payload={order.qrCodeData} />
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                        <ShieldCheck size={12} /> Show this at the door
                      </span>
                    </>
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
                </div>

                <div className="border-t border-border px-5 pb-5 pt-4">
                  <div className="flex items-baseline justify-between">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                      Order
                    </div>
                    <div className="font-mono text-base font-bold tracking-[0.18em] text-ink">
                      #{orderShortId}
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
                  <div className="mt-4 flex items-baseline justify-between border-t border-dashed border-border pt-3">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                      Total paid
                    </span>
                    <span className="text-lg font-semibold text-ink">
                      {rupee(order.totalAmount)}
                    </span>
                  </div>
                  <details className="mt-3 text-xs text-muted">
                    <summary className="cursor-pointer list-none font-semibold text-ink/70 hover:text-ink">
                      Fee breakdown
                    </summary>
                    <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
                      <dt>Subtotal</dt>
                      <dd className="text-right text-ink">{rupee(order.subtotal)}</dd>
                      <dt>Convenience fee ({order.applicationFeePercent}%)</dt>
                      <dd className="text-right text-ink">
                        {rupee(order.platformFee)}
                      </dd>
                      <dt>GST on fee</dt>
                      <dd className="text-right text-ink">
                        {rupee(order.platformFeeGst)}
                      </dd>
                      <dt>Taxes ({order.taxesPercent}%)</dt>
                      <dd className="text-right text-ink">{rupee(order.taxes)}</dd>
                    </dl>
                  </details>
                </div>

                {/* Action row — only meaningful once the order is paid. */}
                {confirmed ? (
                  <div className="border-t border-border bg-cream/60 px-3 py-3">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={handleShareTicket}
                        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-white px-3 text-xs font-semibold text-ink transition hover:bg-cream"
                      >
                        <Share2 size={14} />
                        Share
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadInvoice}
                        disabled={invoiceState.busy}
                        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-white px-3 text-xs font-semibold text-ink transition hover:bg-cream disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {invoiceState.busy ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Download size={14} />
                        )}
                        Invoice
                      </button>
                    </div>
                    {shareToast ? (
                      <div className="mt-2 rounded-lg bg-ink/90 px-3 py-2 text-center text-[11px] font-medium text-cream">
                        {shareToast}
                      </div>
                    ) : null}
                    {invoiceState.message ? (
                      <div className="mt-2 rounded-lg border border-border bg-white px-3 py-2 text-[11px] text-muted">
                        {invoiceState.message}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </aside>

            {/* LEFT column: about + refund */}
            <div className="space-y-6">
              {eventDescription ? (
                <section className="rounded-3xl border border-cream/10 bg-cream/[0.04] p-5 text-sm text-cream/90 backdrop-blur-xl md:p-6">
                  <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/60">
                    About the event
                  </div>
                  <p className="mt-3 line-clamp-3 text-cream/80">
                    {eventDescriptionPreview}
                  </p>
                  <button
                    type="button"
                    onClick={() => setDescriptionOpen(true)}
                    className="mt-3 inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-cream/15 bg-cream/[0.04] px-3 text-xs font-semibold text-cream/85 transition hover:bg-cream/10"
                  >
                    Read more
                  </button>
                </section>
              ) : null}

              {confirmed || refundAlreadyRequested ? (
                <section className="rounded-3xl border border-cream/10 bg-cream/[0.04] p-5 text-sm text-cream/90 backdrop-blur-xl md:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/60">
                        <RefreshCcw size={14} />
                        Refund request
                      </div>
                      {/* The policy is rich text from the organiser. We
                          deliberately don't render it inline (it ranges
                          from a sentence to a multi-paragraph essay
                          with bullet points and would clobber the card
                          layout). Surface a single "View refund policy"
                          chip that opens a dedicated modal — same one-
                          concern-per-modal rule as the description. */}
                      <p className="mt-2 text-cream/75">
                        Refunds follow the organiser's policy and Hoizr's
                        platform terms.
                      </p>
                      <button
                        type="button"
                        onClick={() => setRefundPolicyOpen(true)}
                        className="mt-3 inline-flex h-8 items-center justify-center gap-1 rounded-full border border-cream/15 bg-cream/[0.04] px-3 text-xs font-semibold text-cream/80 transition hover:bg-cream/10"
                      >
                        View refund policy
                      </button>
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
                        : order.orderStatus !== "PAYMENT_SUCCESS"
                        ? "Refund requests are available after payment is confirmed."
                        : "This order is not eligible for a self-service refund request."}
                    </div>
                  ) : null}
                </section>
              ) : null}
            </div>
          </div>

          {/* AUDIT-034: SoT §27 disclosure — Hoizr is the ticketing
              platform, the event organiser is responsible for the event
              itself. Must appear on the order surface (in addition to the
              email footer) at point of admission. */}
          <p className="mt-10 text-center text-xs text-cream/55">
            Ticketing by Hoizr. The event itself is run by the organiser —
            Hoizr is not the event organiser.
          </p>
        </div>
      </div>

      {/* Description modal — one concern per modal, per design.
          .h-tw-sheet-* utilities convert it to a bottom sheet on
          mobile while leaving the centred desktop layout untouched. */}
      {descriptionOpen ? (
        <div
          className="h-tw-sheet-overlay fixed inset-0 z-[120] flex items-end justify-center bg-ink/80 px-3 py-4 sm:items-center"
          onClick={() => setDescriptionOpen(false)}
        >
          <div
            className="h-tw-sheet-panel flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-cream/10 bg-ink text-cream shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-cream/10 px-5 py-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/60">
                  About the event
                </div>
                <div className="mt-1 text-base font-semibold text-cream">
                  {eventSummary?.title ?? "Event"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDescriptionOpen(false)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cream/15 text-cream/70 hover:text-cream"
                aria-label="Close description"
              >
                <X size={16} />
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-4 text-sm leading-relaxed text-cream/85">
              {eventDescription ? (
                <div
                  className="h-richtext"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeRichText(eventDescription),
                  }}
                />
              ) : (
                <p>No description provided.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Refund policy modal — sanitised rich text + the deadline that
          used to sit inline on the card. Hidden by default so the card
          stays composed even when the organiser writes a multi-section
          policy. */}
      {refundPolicyOpen ? (
        <div
          className="h-tw-sheet-overlay fixed inset-0 z-[120] flex items-end justify-center bg-ink/80 px-3 py-4 sm:items-center"
          onClick={() => setRefundPolicyOpen(false)}
        >
          <div
            className="h-tw-sheet-panel flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-cream/10 bg-ink text-cream shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-cream/10 px-5 py-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/60">
                  Refund policy
                </div>
                <div className="mt-1 text-base font-semibold text-cream">
                  {eventSummary?.title ?? "Event"}
                </div>
                {refundDeadlineLabel ? (
                  <div className="mt-1 text-xs text-cream/65">
                    Request by {refundDeadlineLabel}
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setRefundPolicyOpen(false)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cream/15 text-cream/70 hover:text-cream"
                aria-label="Close refund policy"
              >
                <X size={16} />
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-4 text-sm leading-relaxed text-cream/85">
              {refundPolicyText ? (
                <div
                  className="h-richtext"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeRichText(refundPolicyText),
                  }}
                />
              ) : (
                <p>
                  This organiser hasn't published a custom policy. The
                  default Hoizr refund window of {REFUND_WINDOW_DAYS}{" "}
                  days after the event still applies.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {refundModalOpen ? (
        <div className="h-tw-sheet-overlay fixed inset-0 z-[120] flex items-end justify-center bg-ink/70 px-4 py-5 sm:items-center">
          <div className="h-tw-sheet-panel is-light w-full max-w-md rounded-2xl bg-cream p-5 text-ink shadow-xl">
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
