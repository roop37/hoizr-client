"use client";

import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  Clock,
  CreditCard,
  Download,
  Info,
  LifeBuoy,
  Loader2,
  MapPin,
  Share2,
  ShieldCheck,
  Ticket,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import { useEffect, useMemo, useRef, useState } from "react";
import { rupee } from "@/lib/format";
import { gqlRequest } from "@/lib/graphql";
import { mapsSearchHref } from "@/lib/maps";
import { sanitizeRichText } from "@/lib/sanitize";
import {
  ACTIVE_LANGUAGES_QUERY,
  ACTIVE_PROHIBITED_ITEMS_QUERY,
  GENERATE_MY_ORDER_INVOICE_MUTATION,
  MY_ORDER_BY_ID_QUERY,
  MY_ORDER_INVOICE_QUERY,
  PUBLIC_EVENT_PEOPLE_QUERY,
  PUBLIC_EVENT_SUMMARY_BY_ID_QUERY,
} from "@/lib/queries";
import { useAuthStore } from "@/store/auth";
import type { CustomerOrderView } from "@/types/order";
import type {
  PublicEvent,
  PublicEventPeopleResponse,
  PublicLanguageMaster,
  PublicProhibitedItemMaster,
} from "@/types/event";
import { CenteredLoader, ErrorState } from "@/components/ui/feedback";
import { OrderFeedbackCard } from "@/components/hoizr-ui/OrderFeedbackCard";
import { EventInstagramAttendees } from "@/components/hoizr-ui/EventInstagramAttendees";
import { TicketShareModal } from "@/components/hoizr-ui/TicketShareModal";

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
  | "eventGuide"
  | "eventInstructions"
  | "prohibitedItems"
>;

const enumLabels: Record<string, string> = {
  ALL_AGES: "All ages",
  AGE_13_PLUS: "13+ entry",
  AGE_16_PLUS: "16+ entry",
  AGE_18_PLUS: "18+ entry",
  AGE_21_PLUS: "21+ entry",
  AGE_25_PLUS: "25+ entry",
  INDOOR: "Indoor venue",
  OUTDOOR: "Outdoor venue",
  MIXED: "Indoor + outdoor",
  SEATED: "Seated",
  STANDING: "Standing",
  SEATED_AND_STANDING: "Seated + standing",
  KIDS_WELCOME: "Kids welcome",
  KIDS_NOT_ALLOWED: "Kids not allowed",
  KIDS_WITH_GUARDIAN: "Kids with guardian",
  PETS_WELCOME: "Pets welcome",
  PETS_NOT_ALLOWED: "Pets not allowed",
  SERVICE_ANIMALS_ONLY: "Service animals only",
};

const labelForEnum = (value?: string) => {
  if (!value) return "";
  if (enumLabels[value]) return enumLabels[value];
  return value
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const titleFromSlug = (value: string) =>
  value
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const objectIdPattern = /^[a-f0-9]{24}$/i;

const formatGatesLeadTime = (hours?: number, minutes?: number) => {
  const h = Number(hours ?? 0);
  const m = Number(minutes ?? 0);
  const parts = [h > 0 ? `${h}h` : "", m > 0 ? `${m}m` : ""].filter(Boolean);
  return parts.length
    ? `Gates open ${parts.join(" ")} before event`
    : "Gates open before event";
};

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
const OrderQrCode = ({
  payload,
  size = 232,
}: {
  payload: string;
  size?: number;
}) => {
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
      width: size,
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
        className="block rounded-lg"
        style={{ width: size, height: size }}
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
  const [people, setPeople] = useState<PublicEventPeopleResponse | null>(null);
  const [languages, setLanguages] = useState<PublicLanguageMaster[]>([]);
  const [prohibitedItemsMaster, setProhibitedItemsMaster] = useState<
    PublicProhibitedItemMaster[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [polls, setPolls] = useState(0);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [thingsToKnowOpen, setThingsToKnowOpen] = useState(false);
  const [qrFull, setQrFull] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
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
  // The fetch now also pulls lineup + things-to-know data so the order
  // page surfaces the same context the customer had when booking, not
  // just the title — they shouldn't have to bounce back to the event
  // page to remember which artist or what door policy they bought into.
  useEffect(() => {
    if (!order?.eventId) return;
    let mounted = true;
    Promise.all([
      gqlRequest<{ getPublicEventById: OrderEventSummary | null }>(
        PUBLIC_EVENT_SUMMARY_BY_ID_QUERY,
        { id: order.eventId }
      ),
      gqlRequest<{ getPublicEventPeople: PublicEventPeopleResponse }>(
        PUBLIC_EVENT_PEOPLE_QUERY,
        { eventId: order.eventId }
      ).catch(() => ({
        getPublicEventPeople: { artists: [], organizers: [] },
      })),
      gqlRequest<{ getActiveLanguages: PublicLanguageMaster[] }>(
        ACTIVE_LANGUAGES_QUERY
      ).catch(() => ({ getActiveLanguages: [] })),
      gqlRequest<{
        getActiveProhibitedItems: PublicProhibitedItemMaster[];
      }>(ACTIVE_PROHIBITED_ITEMS_QUERY).catch(() => ({
        getActiveProhibitedItems: [],
      })),
    ])
      .then(([summaryData, peopleData, langsData, prohibitedData]) => {
        if (!mounted) return;
        if (summaryData.getPublicEventById)
          setEventSummary(summaryData.getPublicEventById);
        setPeople(
          peopleData.getPublicEventPeople ?? {
            artists: [],
            organizers: [],
          }
        );
        setLanguages(langsData.getActiveLanguages ?? []);
        setProhibitedItemsMaster(
          prohibitedData.getActiveProhibitedItems ?? []
        );
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
        timeZone: "Asia/Kolkata",
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

  // Portrait flyer first on the order/ticket page (desktop + mobile) so
  // the artwork shows the same way whether or not the host also uploaded
  // a landscape image. Landscape is only a fallback when no portrait
  // flyer exists. (Previously desktop preferred the landscape crop, which
  // looked inconsistent next to events that only had a portrait flyer.)
  const heroFlyer = useMemo(
    () => eventSummary?.eventFlyer || eventSummary?.horizontalFlyer || "",
    [eventSummary?.eventFlyer, eventSummary?.horizontalFlyer]
  );

  // Mobile ticket card shows the full portrait flyer (3:4) — the
  // landscape crop hides too much of the artwork on a phone-width
  // surface. Portrait first, landscape only as a fallback when a host
  // didn't upload a portrait yet.
  const mobileTicketFlyer = useMemo(
    () => eventSummary?.eventFlyer || eventSummary?.horizontalFlyer || "",
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

  const languageById = useMemo(() => {
    const map = new Map<string, string>();
    for (const language of languages) {
      map.set(language._id, language.value);
    }
    return map;
  }, [languages]);

  const prohibitedByKey = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of prohibitedItemsMaster) {
      map.set(item._id, item.value);
      map.set(item.slug, item.value);
    }
    return map;
  }, [prohibitedItemsMaster]);

  const languageLabels = useMemo(
    () =>
      (eventSummary?.eventGuide?.languageIds ?? [])
        .map((id) => languageById.get(id))
        .filter((value): value is string => Boolean(value)),
    [eventSummary?.eventGuide?.languageIds, languageById]
  );

  const prohibitedLabels = useMemo(
    () =>
      (eventSummary?.prohibitedItems ?? [])
        .map((item) => {
          const known = prohibitedByKey.get(item);
          if (known) return known;
          if (objectIdPattern.test(item)) return "";
          return titleFromSlug(item);
        })
        .filter(Boolean),
    [eventSummary?.prohibitedItems, prohibitedByKey]
  );

  type ThingRow = { key: string; text: string };
  const thingsToKnow = useMemo<ThingRow[]>(() => {
    const guide = eventSummary?.eventGuide;
    const rows: ThingRow[] = [];
    if (languageLabels.length)
      rows.push({
        key: "languages",
        text: `Languages: ${languageLabels.join(", ")}`,
      });
    if (guide?.minimumEntryAge)
      rows.push({
        key: "minimum-age",
        text: labelForEnum(guide.minimumEntryAge),
      });
    if (guide?.paidEntryAge)
      rows.push({
        key: "paid-age",
        text: `Paid entry from ${labelForEnum(guide.paidEntryAge).replace(" entry", "")}`,
      });
    if (guide?.venueLayout)
      rows.push({ key: "layout", text: labelForEnum(guide.venueLayout) });
    if (guide?.seatingArrangement)
      rows.push({
        key: "seating",
        text: labelForEnum(guide.seatingArrangement),
      });
    if (guide?.kidFriendly)
      rows.push({ key: "kids", text: labelForEnum(guide.kidFriendly) });
    if (guide?.petFriendly)
      rows.push({ key: "pets", text: labelForEnum(guide.petFriendly) });
    if (guide?.gatesOpenBeforeEvent)
      rows.push({
        key: "gates",
        text: formatGatesLeadTime(
          guide.gatesOpenLeadHours,
          guide.gatesOpenLeadMinutes
        ),
      });
    return rows;
  }, [eventSummary?.eventGuide, languageLabels]);

  const handleShareTicket = async () => {
    if (!order) return;
    const orderShortId = order._id.slice(-6).toUpperCase();
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = buildShareText(
      eventSummary?.title,
      eventSummary?.startDate
        ? new Date(eventSummary.startDate).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
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

    type InvoiceResult = {
      invoiceNumber: string;
      pdfUrl: string;
      expiresAt: string;
    } | null;

    const openInvoice = (invoice: { invoiceNumber: string; pdfUrl: string }) => {
      // Open in a new tab so the customer keeps the order page open while the
      // PDF downloads. Cloudinary's private_download_url uses attachment
      // disposition, so most browsers save instead of rendering inline.
      window.open(invoice.pdfUrl, "_blank", "noopener,noreferrer");
      setInvoiceState({
        busy: false,
        message: `Invoice ${invoice.invoiceNumber} opened in a new tab.`,
      });
    };

    const fetchInvoice = async (): Promise<InvoiceResult> => {
      const data = await gqlRequest<{ getMyOrderInvoice: InvoiceResult }>(
        MY_ORDER_INVOICE_QUERY,
        { orderId: order._id }
      );
      return data.getMyOrderInvoice;
    };

    try {
      // 1) Fast path — the invoice already exists, just open it.
      const existing = await fetchInvoice();
      if (existing) {
        openInvoice(existing);
        return;
      }

      // 2) Nothing on file yet — ask the server to get-or-generate it.
      const gen = await gqlRequest<{
        generateMyOrderInvoice: {
          status: "READY" | "GENERATING" | "NO_INVOICE_FREE_ORDER";
          invoice: InvoiceResult;
        };
      }>(GENERATE_MY_ORDER_INVOICE_MUTATION, { orderId: order._id });
      const { status, invoice } = gen.generateMyOrderInvoice;

      if (status === "NO_INVOICE_FREE_ORDER") {
        setInvoiceState({
          busy: false,
          message: "No tax invoice for a free booking.",
        });
        return;
      }

      if (status === "READY" && invoice) {
        openInvoice(invoice);
        return;
      }

      // 3) GENERATING — a worker is producing the PDF. Poll getMyOrderInvoice
      // on the same cadence/cap as the payment-confirmation poll until it
      // lands, then open it; otherwise tell the customer to try again shortly.
      for (let attempt = 0; attempt < PAYMENT_CONFIRMATION_MAX_POLLS; attempt++) {
        await new Promise((resolve) =>
          setTimeout(resolve, PAYMENT_CONFIRMATION_POLL_INTERVAL_MS)
        );
        const ready = await fetchInvoice();
        if (ready) {
          openInvoice(ready);
          return;
        }
      }

      setInvoiceState({
        busy: false,
        message:
          "Your invoice is being generated — try again shortly, or check your order confirmation email.",
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
  const orderShortId = order._id.slice(-6).toUpperCase();
  // A free booking has no platform fee, so there's no tax invoice to fetch —
  // hide the Invoice action entirely (and let the action row collapse to a
  // single column so the lone Share button isn't left half-width).
  const isFreeOrder = (order.totalAmount ?? 0) <= 0;
  const ticketCount = order.tickets.reduce(
    (sum, t) => sum + Number(t.quantity ?? 0),
    0
  );

  // Two tones per status: `tone` reads on the dark ink background
  // (hero meta column on desktop), `whiteTone` reads on the cream
  // ticket card. The mobile-only meta block lives INSIDE the white
  // card now — emerald-200 / amber-200 dissolved into the cream and
  // looked unreadable, so we swap to the ink-on-light variant per
  // the mobile redesign request.
  const statusBadge = (() => {
    switch (order.orderStatus) {
      case "PAYMENT_SUCCESS":
        return {
          label: "Booking confirmed",
          tone: "bg-emerald-400/15 text-emerald-200 ring-emerald-400/40",
          whiteTone:
            "bg-emerald-50 text-emerald-800 ring-emerald-200",
        };
      case "CHECKED_IN":
        return {
          label: "Checked in",
          tone: "bg-sky-400/15 text-sky-200 ring-sky-400/40",
          whiteTone: "bg-sky-50 text-sky-800 ring-sky-200",
        };
      case "PAYMENT_PENDING":
        return {
          label: "Pending payment",
          tone: "bg-amber-400/15 text-amber-200 ring-amber-400/40",
          whiteTone: "bg-amber-50 text-amber-800 ring-amber-200",
        };
      case "PAYMENT_FAILED":
        return {
          label: "Payment failed",
          tone: "bg-rose-400/15 text-rose-200 ring-rose-400/40",
          whiteTone: "bg-rose-50 text-rose-800 ring-rose-200",
        };
      case "SUPERSEDED":
        return {
          label: "Replaced by newer order",
          tone: "bg-slate-400/15 text-slate-200 ring-slate-400/40",
          whiteTone: "bg-slate-100 text-slate-800 ring-slate-200",
        };
      default:
        return {
          label: order.orderStatus,
          tone: "bg-cream/10 text-cream/80 ring-cream/30",
          whiteTone: "bg-cream text-ink ring-border",
        };
    }
  })();

  const eventInstructions = eventSummary?.eventInstructions ?? [];
  const lineupArtists = people?.artists ?? [];
  const organizers = people?.organizers ?? [];
  const hasThingsToKnowDetails =
    eventInstructions.length > 0 || prohibitedLabels.length > 0;

  const eventStartLong = eventSummary?.startDate
    ? new Date(eventSummary.startDate).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  const eventEndLong = eventSummary?.endDate
    ? new Date(eventSummary.endDate).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  const venueFullAddress =
    eventSummary?.location?.formattedAddress ??
    [
      eventSummary?.location?.addressLine1,
      eventSummary?.location?.addressLine2,
      eventSummary?.location?.city ?? eventSummary?.city,
      eventSummary?.location?.state,
      eventSummary?.location?.pincode,
    ]
      .filter(Boolean)
      .join(", ");
  // Deep-link the venue to Google Maps, mirroring the event-detail
  // convention: free-text address query + an exact place_id pin when the
  // host saved a Google Place. Null when there's no address to search.
  const venueMapsHref = mapsSearchHref(
    venueFullAddress,
    eventSummary?.location?.place?.placeId
  );

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
    <>
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

          {/* Desktop hero — compact event header with the portrait event
              flyer on the left and title/badge column on the right. Hidden on
              mobile (md:hidden block below) because the redesigned
              mobile card composes the flyer + badge + meta INSIDE the
              white ticket card so everything sits under one surface and
              the badge reads on white. */}
          <section className="mt-4 hidden md:mt-6 md:block">
            <div className="flex flex-col items-center gap-4 md:flex-row md:items-stretch md:gap-6">
              <div className="relative overflow-hidden rounded-3xl bg-ink/40 ring-1 ring-cream/10 shadow-[0_24px_60px_-25px_rgba(0,0,0,0.7)]">
                {heroFlyer ? (
                  <img
                    src={heroFlyer}
                    alt={eventSummary?.title ?? "Event flyer"}
                    className="block h-[220px] w-auto max-w-[300px] object-cover"
                  />
                ) : (
                  <div className="h-[220px] w-[180px] bg-gradient-to-br from-emerald-700/40 via-ink to-ink" />
                )}
              </div>
              <div className="flex flex-1 flex-col items-start justify-center text-left">
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
                className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#c5ff3d] px-4 text-sm font-semibold text-[#0a0a0e] transition hover:bg-[#d9ff6e]"
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
                {/* Mobile-only event meta block inside the white card.
                    Order per redesign request: status badge (ink text
                    on cream) → flyer → title → date → venue, then a
                    dashed divider before the QR. Hidden on desktop
                    because the same fields render in the hero column.
                    The badge uses `whiteTone` so "Booking confirmed"
                    reads in ink, not the dark-bg emerald-200 that
                    disappeared into the cream surface. */}
                <div className="border-b border-dashed border-border px-5 pb-4 pt-5 text-ink md:hidden">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ring-1 ring-inset ${statusBadge.whiteTone}`}
                  >
                    <Ticket size={12} />
                    {statusBadge.label}
                  </span>
                  {mobileTicketFlyer ? (
                    <div className="mt-3 flex items-center justify-center overflow-hidden rounded-2xl bg-ink/5 ring-1 ring-border">
                      <img
                        src={mobileTicketFlyer}
                        alt={eventSummary?.title ?? "Event flyer"}
                        className="block max-h-[480px] w-full object-contain"
                      />
                    </div>
                  ) : null}
                  {eventSummary?.title ? (
                    <h1 className="mt-3 text-lg font-semibold leading-snug text-ink">
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
                      <button
                        type="button"
                        onClick={() => setQrFull(true)}
                        aria-label="Show ticket QR full screen"
                        className="rounded-2xl outline-none transition focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        <OrderQrCode payload={order.qrCodeData} />
                      </button>
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                        <ShieldCheck size={12} /> Tap to enlarge · show at the door
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
                    <div
                      className={`grid gap-2 ${
                        isFreeOrder ? "grid-cols-1" : "grid-cols-2"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setShareModalOpen(true)}
                        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-white px-3 text-xs font-semibold text-ink transition hover:bg-cream"
                      >
                        <Share2 size={14} />
                        Share
                      </button>
                      {!isFreeOrder ? (
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
                      ) : null}
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

            {/* LEFT column: about + lineup + when & where + things to
                know + refund. Sections render in the order a customer
                scans them — what is it? → who's on? → when/where? →
                door rules → refund — so a returning ticket-holder gets
                everything they need without bouncing back to the event
                page. */}
            <div className="space-y-6">
              {eventDescription ? (
                <section
                  className="cursor-pointer rounded-3xl border border-cream/10 bg-cream/[0.04] p-5 text-sm text-cream/90 backdrop-blur-xl transition hover:bg-cream/[0.06] md:p-6"
                  role="button"
                  tabIndex={0}
                  onClick={() => setDescriptionOpen(true)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setDescriptionOpen(true);
                    }
                  }}
                >
                  <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/60">
                    About the event
                  </div>
                  <p className="mt-3 line-clamp-3 text-cream/80">
                    {eventDescriptionPreview}
                  </p>
                  <span
                    className="mt-3 inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-cream/15 bg-cream/[0.04] px-3 text-xs font-semibold text-cream/85"
                  >
                    Read more
                  </span>
                </section>
              ) : null}

              {lineupArtists.length > 0 ? (
                <section className="rounded-3xl border border-cream/10 bg-cream/[0.04] p-5 text-sm text-cream/90 backdrop-blur-xl md:p-6">
                  <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/60">
                    <Users size={14} />
                    Lineup
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-3">
                    {lineupArtists.map((artist, idx) => (
                      <div
                        key={`${artist._id ?? artist.name}-${idx}`}
                        className="flex items-center gap-2.5"
                      >
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-cream/10 ring-1 ring-cream/15"
                          style={
                            artist.picture
                              ? {
                                  backgroundImage: `url(${artist.picture})`,
                                  backgroundSize: "cover",
                                  backgroundPosition: "center",
                                }
                              : undefined
                          }
                          aria-hidden
                        >
                          {!artist.picture ? (
                            <span className="text-sm font-semibold text-cream/80">
                              {artist.name.charAt(0).toUpperCase()}
                            </span>
                          ) : null}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-cream">
                            {artist.name}
                          </div>
                          {artist.tagline ? (
                            <div className="truncate text-[11px] text-cream/60">
                              {artist.tagline}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {organizers.length > 0 ? (
                <section className="rounded-3xl border border-cream/10 bg-cream/[0.04] p-5 text-sm text-cream/90 backdrop-blur-xl md:p-6">
                  <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/60">
                    <Users size={14} />
                    Organisers
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-3">
                    {organizers.map((org, idx) => (
                      <div
                        key={`${org._id ?? org.name}-${idx}`}
                        className="flex items-center gap-2.5"
                      >
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-cream/10 ring-1 ring-cream/15"
                          style={
                            org.logo
                              ? {
                                  backgroundImage: `url(${org.logo})`,
                                  backgroundSize: "cover",
                                  backgroundPosition: "center",
                                }
                              : undefined
                          }
                          aria-hidden
                        >
                          {!org.logo ? (
                            <span className="text-sm font-semibold text-cream/80">
                              {org.name.charAt(0).toUpperCase()}
                            </span>
                          ) : null}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-cream">
                            {org.name}
                          </div>
                          {org.city ? (
                            <div className="truncate text-[11px] text-cream/60">
                              {org.city}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {/* Who's coming — same Instagram attendees card as the event
                  page: signed-in-but-not-connected → "Connect Instagram"
                  (returns here after connect); connected → other attendees'
                  faces for this event. Hide entirely if < 10 attendees. */}
              {order.eventId ? (
                <EventInstagramAttendees
                  eventId={order.eventId}
                  flyerUrl={
                    eventSummary?.eventFlyer || eventSummary?.horizontalFlyer
                  }
                  minAttendees={10}
                />
              ) : null}

              {eventStartLong || venueFullAddress ? (
                <section className="rounded-3xl border border-cream/10 bg-cream/[0.04] p-5 text-sm text-cream/90 backdrop-blur-xl md:p-6">
                  <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/60">
                    <Clock size={14} />
                    When &amp; where
                  </div>
                  <div className="mt-3 space-y-2 text-cream/85">
                    {eventStartLong ? (
                      <div className="flex items-start gap-2">
                        <CalendarDays
                          size={14}
                          className="mt-0.5 shrink-0 text-cream/60"
                        />
                        <div>
                          <div>{eventStartLong}</div>
                          {eventEndLong && eventEndLong !== eventStartLong ? (
                            <div className="text-xs text-cream/60">
                              Ends {eventEndLong}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                    {venueFullAddress ? (
                      <div className="flex items-start gap-2">
                        <MapPin
                          size={14}
                          className="mt-0.5 shrink-0 text-cream/60"
                        />
                        {venueMapsHref ? (
                          <a
                            href={venueMapsHref}
                            target="_blank"
                            rel="noreferrer"
                            title="Open in Google Maps"
                            className="underline-offset-2 transition hover:text-cream hover:underline"
                          >
                            {venueFullAddress}
                          </a>
                        ) : (
                          <span>{venueFullAddress}</span>
                        )}
                      </div>
                    ) : null}
                  </div>
                </section>
              ) : null}

              {thingsToKnow.length > 0 || hasThingsToKnowDetails ? (
                <section className="rounded-3xl border border-cream/10 bg-cream/[0.04] p-5 text-sm text-cream/90 backdrop-blur-xl md:p-6">
                  <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/60">
                    <Info size={14} />
                    Things to know
                  </div>
                  {thingsToKnow.length > 0 ? (
                    <ul className="mt-3 grid gap-1.5 text-cream/85">
                      {thingsToKnow.map((row) => (
                        <li
                          key={row.key}
                          className="flex items-start gap-2"
                        >
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-cream/40" />
                          <span>{row.text}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {hasThingsToKnowDetails ? (
                    <button
                      type="button"
                      onClick={() => setThingsToKnowOpen(true)}
                      className="mt-3 inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-cream/15 bg-cream/[0.04] px-3 text-xs font-semibold text-cream/85 transition hover:bg-cream/10"
                    >
                      More details
                    </button>
                  ) : null}
                </section>
              ) : null}

              {/* Support card — replaces the previous self-service
                  refund flow. Refunds aren't yet automated end-to-end,
                  so a free-form support ticket is the right pressure
                  valve: customer describes the issue (lost ticket,
                  refund ask, wrong event, etc.) and the Hoizr team
                  routes it. The /support page prefills the orderId
                  so the ticket is already linked to this booking. */}
              <section className="rounded-3xl border border-cream/10 bg-cream/[0.04] p-5 text-sm text-cream/90 backdrop-blur-xl md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/60">
                      <LifeBuoy size={14} />
                      Need help with this order?
                    </div>
                    <p className="mt-2 text-cream/75">
                      Lost your QR, want a refund, or have an entry
                      question? Open a support ticket — the Hoizr team
                      usually replies within one business day.
                    </p>
                  </div>
                  <Link
                    href={`/support?orderId=${encodeURIComponent(
                      order._id
                    )}&category=ORDER_ISSUE`}
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#c5ff3d] px-4 text-sm font-semibold text-[#0a0a0e] transition hover:bg-[#d9ff6e]"
                  >
                    <LifeBuoy size={16} />
                    Contact support
                  </Link>
                </div>
              </section>
            </div>
          </div>

          {/* Feedback prompt — at the bottom of the order, only on confirmed
              orders. Asks about the event once it has ended, otherwise about
              the Hoizr experience. */}
          {confirmed && order ? (
            <div className="mt-10">
              <OrderFeedbackCard
                orderId={order._id}
                eventEnded={
                  !!eventSummary?.endDate &&
                  new Date(eventSummary.endDate).getTime() < Date.now()
                }
              />
            </div>
          ) : null}

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

      {/* Things-to-know modal — surfaces eventInstructions and the
          prohibited-items list that don't fit in the inline card. Same
          bottom-sheet-on-mobile pattern as the description modal so
          the order page stays single-concern-per-overlay. */}
      {thingsToKnowOpen ? (
        <div
          className="h-tw-sheet-overlay fixed inset-0 z-[120] flex items-end justify-center bg-ink/80 px-3 py-4 sm:items-center"
          onClick={() => setThingsToKnowOpen(false)}
        >
          <div
            className="h-tw-sheet-panel flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-cream/10 bg-ink text-cream shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-cream/10 px-5 py-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/60">
                  Things to know
                </div>
                <div className="mt-1 text-base font-semibold text-cream">
                  {eventSummary?.title ?? "Event"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setThingsToKnowOpen(false)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cream/15 text-cream/70 hover:text-cream"
                aria-label="Close things to know"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-5 overflow-y-auto px-5 py-4 text-sm leading-relaxed text-cream/85">
              {thingsToKnow.length > 0 ? (
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/60">
                    Door policy
                  </div>
                  <ul className="mt-2 grid gap-1.5">
                    {thingsToKnow.map((row) => (
                      <li
                        key={row.key}
                        className="flex items-start gap-2"
                      >
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-cream/40" />
                        <span>{row.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {eventInstructions.length > 0 ? (
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/60">
                    Event instructions
                  </div>
                  <ul className="mt-2 grid gap-1.5">
                    {eventInstructions.map((instruction, idx) => (
                      <li
                        key={`instruction-${idx}`}
                        className="flex items-start gap-2"
                      >
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-cream/40" />
                        <span>{instruction}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {prohibitedLabels.length > 0 ? (
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/60">
                    Prohibited items
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {prohibitedLabels.map((label) => (
                      <span
                        key={label}
                        className="inline-flex items-center rounded-full border border-cream/15 bg-cream/[0.04] px-2.5 py-1 text-xs"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Full-screen QR — tap the ticket QR to open a big, door-scannable
          view. The white QR card carries the event name + venue at its top
          and stays sticky so it keeps floating while the recap below
          scrolls. */}
      {qrFull && confirmed && order.qrCodeData ? (
        <div className="fixed inset-0 z-[130] overflow-y-auto bg-cream text-ink">
          <button
            type="button"
            onClick={() => setQrFull(false)}
            aria-label="Close full-screen ticket"
            className="fixed right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-ink shadow-sm"
          >
            <X size={18} />
          </button>
          <div className="mx-auto flex w-full max-w-md flex-col px-5 py-6">
            <div className="sticky top-4 z-[1] rounded-3xl bg-white p-5 text-center shadow-[0_24px_60px_-25px_rgba(0,0,0,0.5)] ring-1 ring-border">
              {eventSummary?.title ? (
                <div className="text-lg font-semibold leading-snug text-ink">
                  {eventSummary.title}
                </div>
              ) : null}
              {venueLine ? (
                <div className="mt-1 inline-flex items-center gap-1 text-xs text-muted">
                  <MapPin size={12} className="shrink-0" />
                  <span className="line-clamp-2">{venueLine}</span>
                </div>
              ) : null}
              <div className="mt-4 flex justify-center">
                <OrderQrCode payload={order.qrCodeData} size={288} />
              </div>
              <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                <ShieldCheck size={12} /> Show at the door · #{orderShortId}
              </div>
            </div>

            <div className="mt-5 space-y-1.5 rounded-3xl bg-white/70 p-5 text-sm text-ink ring-1 ring-border">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                Your tickets
              </div>
              {order.tickets.map((t) => (
                <div
                  key={t.ticketTypeId}
                  className="flex items-baseline justify-between gap-2"
                >
                  <span className="truncate">
                    <span className="font-semibold">{t.quantity}×</span>{" "}
                    {t.ticketName}
                  </span>
                  <span className="font-semibold">{rupee(t.totalPrice)}</span>
                </div>
              ))}
              {order.extras?.map((e) => (
                <div
                  key={e.extraId}
                  className="flex items-baseline justify-between gap-2 text-muted"
                >
                  <span className="truncate">
                    {e.quantity}× {e.extraName}
                  </span>
                  <span>{rupee(e.totalPrice)}</span>
                </div>
              ))}
              <div className="mt-2 flex items-baseline justify-between border-t border-dashed border-border pt-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                  Total paid
                </span>
                <span className="font-semibold">{rupee(order.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

    </div>

    {order && shareModalOpen ? (
      <TicketShareModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        eventTitle={eventSummary?.title}
        eventDate={eventSummary?.startDate}
        orderShortId={order._id.slice(-6).toUpperCase()}
        qrPayload={order.qrCodeData ?? null}
        pageUrl={typeof window !== "undefined" ? window.location.href : ""}
      />
    ) : null}
    </>
  );
};
