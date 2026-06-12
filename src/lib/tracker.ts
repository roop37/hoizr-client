"use client";

/**
 * Hoizr tracking SDK — client-side.
 *
 * Sends analytics events to the tracking-server. Keep it tiny + dependency-free
 * (don't pull in segment-style libs). Failures are silently swallowed —
 * tracking must NEVER block a user flow.
 *
 * Event-type names live in `@hoizr-technology/shared` (`AnalyticsEventType`)
 * but we duplicate the literal-string union here so the client bundle
 * doesn't drag in the full shared package on the customer-facing site.
 */

export type AnalyticsEventName =
  // Generic
  | "pageView"
  | "identify"
  | "clickGeneric"
  | "search"
  | "error"
  // Event browsing
  | "eventListView"
  | "eventListFilter"
  | "eventDetailView"
  | "eventShare"
  | "eventFavorite"
  // Ticketing
  | "ticketSelect"
  | "cartCreated"
  | "cartUpdated"
  | "cartExpired"
  | "checkoutStarted"
  | "checkoutPaymentInit"
  | "checkoutPaymentFailed"
  | "checkoutCompleted"
  | "couponApplied"
  // Artist
  | "artistListView"
  | "artistDetailView"
  | "artistFollow"
  | "artistMerchListView"
  | "artistMerchDetailView"
  | "artistMerchPurchased"
  // Host
  | "hostDetailView"
  | "hostFollow"
  // Auth
  | "authOtpRequested"
  | "authOtpVerified"
  | "authSignupCompleted"
  | "authLogin"
  | "authLogout"
  // Campaign attribution
  | "campaignEmailOpened"
  | "campaignEmailClicked";

/** Per-event payload accepted by the SDK. Server enforces the schema. */
export type AnalyticsEventPayload = {
  eventId?: string;
  hostId?: string;
  artistId?: string;
  orderId?: string;
  itemIds?: string[];
  customerId?: string;
  metadata?: Record<string, any>;
};

const ENDPOINT =
  (typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_TRACKING_SERVER_URL) ||
  "";

const TRACK_URL = ENDPOINT ? `${ENDPOINT.replace(/\/$/, "")}/track` : "";
const BATCH_URL = ENDPOINT ? `${ENDPOINT.replace(/\/$/, "")}/track/batch` : "";

const SESSION_KEY = "hoizr:trk:session";
const ATTRIBUTION_KEY = "hoizr:trk:firstTouch";
let fallbackSessionId = "";

const createSessionId = (): string =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

/**
 * Per-tab session id, persisted in sessionStorage. Lets us stitch a
 * single visit's events even if the page reloads. Resets on tab close.
 */
const getSessionId = (): string => {
  if (typeof window === "undefined") return "";
  try {
    let id = window.sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = createSessionId();
      window.sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    if (!fallbackSessionId) {
      fallbackSessionId = createSessionId();
    }
    return fallbackSessionId;
  }
};

/**
 * Read UTM params from the current URL. Cached in localStorage as
 * "first-touch attribution" — every subsequent event in this browser
 * carries the same UTMs so a checkout in week 2 still attributes back
 * to the campaign that brought the user in week 1.
 */
type Attribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  referrer?: string;
  landingUrl?: string;
  capturedAt?: number;
};

const readAttributionFromUrl = (): Attribution => {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get("utm_source") ?? undefined,
    utmMedium: params.get("utm_medium") ?? undefined,
    utmCampaign: params.get("utm_campaign") ?? undefined,
    utmTerm: params.get("utm_term") ?? undefined,
    utmContent: params.get("utm_content") ?? undefined,
  };
};

const getAttribution = (): Attribution => {
  if (typeof window === "undefined") return {};
  const fromUrl = readAttributionFromUrl();
  const hasUtm =
    fromUrl.utmSource ||
    fromUrl.utmMedium ||
    fromUrl.utmCampaign ||
    fromUrl.utmTerm ||
    fromUrl.utmContent;

  // First touch wins — only overwrite stored attribution when the URL
  // brings a new UTM cluster (a marketing campaign click).
  if (hasUtm) {
    const fresh: Attribution = {
      ...fromUrl,
      referrer: document.referrer || undefined,
      landingUrl: window.location.href,
      capturedAt: Date.now(),
    };
    try {
      window.localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(fresh));
    } catch {
      // localStorage can throw in private mode — fall back to in-memory.
    }
    return fresh;
  }

  try {
    const raw = window.localStorage.getItem(ATTRIBUTION_KEY);
    if (raw) return JSON.parse(raw) as Attribution;
  } catch {
    // ignore
  }
  return {};
};

/**
 * Public — pull the current first-touch attribution so we can attach
 * it to server mutations (e.g. order creation) and persist it on the
 * Order doc for downstream reporting.
 */
export const getStoredAttribution = (): Attribution => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ATTRIBUTION_KEY);
    if (raw) return JSON.parse(raw) as Attribution;
  } catch {
    // ignore
  }
  return readAttributionFromUrl();
};

const baseContext = (): Record<string, any> => {
  if (typeof window === "undefined") return {};
  const attribution = getAttribution();
  return {
    sessionId: getSessionId(),
    pageUrl: window.location.href,
    route: window.location.pathname,
    pageTitle: document.title || undefined,
    pageQuery: window.location.search || undefined,
    referrer: document.referrer || undefined,
    utmSource: attribution.utmSource,
    utmMedium: attribution.utmMedium,
    utmCampaign: attribution.utmCampaign,
    utmTerm: attribution.utmTerm,
    utmContent: attribution.utmContent,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    clientTimestamp: new Date().toISOString(),
    app: "hoizr-client",
  };
};

const post = (path: string, body: any) => {
  if (!path) return;
  // Prefer `sendBeacon` for non-blocking, fire-and-forget — survives a
  // pagehide event mid-request. Falls back to fetch with keepalive for
  // browsers that don't support beacon or when payload exceeds the
  // 64KB beacon cap.
  try {
    const json = JSON.stringify(body);
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.sendBeacon === "function" &&
      json.length < 60_000
    ) {
      const blob = new Blob([json], { type: "application/json" });
      navigator.sendBeacon(path, blob);
      return;
    }
    fetch(path, {
      method: "POST",
      body: json,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Tracking must NEVER throw at the caller.
  }
};

/**
 * Fire a single tracked event. Awaiting is unnecessary — the SDK
 * returns immediately and posts in the background.
 *
 * Example:
 *   track("eventDetailView", { eventId: "e_123", hostId: "h_456" });
 */
export const track = (
  eventType: AnalyticsEventName,
  payload?: AnalyticsEventPayload
): void => {
  if (typeof window === "undefined") return;
  try {
    const body = {
      eventType,
      ...baseContext(),
      ...(payload || {}),
    };
    post(TRACK_URL, body);
  } catch {
    // Tracking must NEVER throw at the caller.
  }
};

/**
 * Batch-send a queue of events at once. Useful from a custom flush
 * routine — most callers should just use `track()` for each event.
 */
export const trackBatch = (
  events: Array<{ eventType: AnalyticsEventName } & AnalyticsEventPayload>
): void => {
  if (typeof window === "undefined" || events.length === 0) return;
  try {
    const base = baseContext();
    const payload = {
      events: events.map((ev) => ({ ...base, ...ev })),
    };
    post(BATCH_URL, payload);
  } catch {
    // Tracking must NEVER throw at the caller.
  }
};

/**
 * Fire a `pageView` event for the current URL. Call from the App
 * Router's root `usePathname()` effect so SPA navigations get tracked.
 */
export const trackPageView = (extra?: AnalyticsEventPayload): void => {
  track("pageView", extra);
};

/**
 * Identify the current user — call after a successful OTP verify.
 * Server stores customerId on subsequent events from this session.
 */
export const trackIdentify = (customerId: string): void => {
  track("identify", { customerId });
};
