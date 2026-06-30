import type { PublicEvent, PublicTicket } from "@/types/event";
import { minTicketPrice } from "./format";
import { coordToLatLng } from "./geo";

export type DisplayEvent = {
  id: string;
  slug: string;
  title: string;
  image: string | null;
  horizontalImage: string | null;
  portraitImage: string | null;
  videoSneakPeek: string | null;
  gallery: PublicEvent["gallery"];
  imageStyle: string;
  city: string;
  // All distinct cities this event runs in (multi-city events list every day's
  // city; single-city = just [city]). Used by the browse filter so a multi-city
  // event surfaces under ANY of its cities.
  cities: string[];
  cityId?: string;
  // Per-day venues for a multi-city event — ONLY fully populated on the detail
  // page (GetPublicEventBySlug fetches dayId/start/end/location). The browse/
  // search query under-fetches days (title + location.city only) purely to
  // build `cities`; don't read dayId/startDate off `days` from a browse-sourced
  // DisplayEvent. Detail page reads it; cards read only `cities`.
  days?: PublicEvent["days"];
  multiCity?: boolean;
  /** Geocoded venue position when the host saved a Google Place. */
  coordinate?: { lat: number; lng: number };
  genreTagIds: string[];
  venueShort: string;
  venueLong: string;
  date: string;
  dateLong: string;
  // Raw ISO start date — preserved so the events page can do date-range
  // filtering (Tonight, This weekend, Next 7 days) without re-parsing
  // the formatted `date` string.
  startDateISO?: string;
  startTime: string;
  endTime: string;
  fromPrice: number | null;
  // True when the event has visible tickets and EVERY one is a GUESTLIST
  // ticket — the card shows "RSVP" instead of "Free".
  isRsvpOnly: boolean;
  badge: string;
  series: string;
  sub: string;
  about: string;
  tickets: PublicTicket[];
  ticketingEnabled: boolean;
  isHighDemand: boolean;
  isComingSoon: boolean;
  ticketingTerms?: string;
  refundPolicy?: string;
  cancellationPolicy?: string;
  eventGuide?: PublicEvent["eventGuide"];
  faqs: NonNullable<PublicEvent["faqs"]>;
  eventInstructions: string[];
  prohibitedItems: string[];
};

const PLACEHOLDER_GRADIENTS = [
  "linear-gradient(135deg, #FA2D48 0%, #7A1FFF 100%)",
  "linear-gradient(135deg, #FF2E8A 0%, #FFB347 100%)",
  "linear-gradient(135deg, #3FE0FF 0%, #1F62E8 100%)",
  "linear-gradient(135deg, #C5FF3D 0%, #1F8A5B 100%)",
  "linear-gradient(135deg, #2A3550 0%, #060616 100%)",
  "linear-gradient(135deg, #FF7A3D 0%, #C04A0A 100%)",
];

const hashString = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
};

const formatTime = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
};

const formatDateShort = (iso?: string) => {
  if (!iso) return "Date TBA";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Date TBA";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(d);
};

const formatDateLong = (iso?: string) => {
  if (!iso) return "Date pending";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Date pending";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
};

const pickBadge = (e: PublicEvent) => {
  if (e.isHighDemand) return "HIGH DEMAND";
  if (e.isComingSoon) return "COMING SOON";
  if (e.eventType && e.eventType.length > 0) {
    const type = e.eventType.find(
      (t) => t && t.toUpperCase() !== "EXCLUSIVE"
    );
    // "Free" events are RSVP-entry; surface them as "RSVP" to customers
    // (the host app labels this the same — enum value stays "Free").
    if (type) return type.toUpperCase() === "FREE" ? "RSVP" : type.toUpperCase();
  }
  if (e.ticketingEnabled === false) return "RSVP";
  return "NEW";
};

export const toDisplayEvent = (e: PublicEvent): DisplayEvent => {
  // Prefer the Google Place display name (the venue search name the host
  // picked during onboarding). Fall back to the address line so we never
  // show the long, comma-heavy formattedAddress that includes pincode +
  // state + country.
  const placeName = e.location?.place?.displayName;
  const cityName = e.city || e.location?.city;
  const venueShort = placeName || e.location?.addressLine1 || cityName || "Venue TBA";
  const venueLong = [placeName || e.location?.addressLine1, cityName]
    .filter(Boolean)
    .join(" · ");
  const seriesType = (e.eventType ?? []).find(
    (t) => t && t.toUpperCase() !== "EXCLUSIVE"
  );
  const series = seriesType
    ? seriesType.toUpperCase() === "FREE"
      ? "RSVP"
      : seriesType.toUpperCase()
    : "HOIZR";
  return {
    id: e._id,
    slug: e.slug ?? e._id,
    title: e.title ?? "Untitled event",
    image: e.horizontalFlyer ?? e.eventFlyer ?? null,
    horizontalImage: e.horizontalFlyer ?? null,
    portraitImage: e.eventFlyer ?? null,
    videoSneakPeek: e.videoSneakPeek ?? null,
    gallery: e.gallery ?? [],
    imageStyle: PLACEHOLDER_GRADIENTS[hashString(e._id) % PLACEHOLDER_GRADIENTS.length],
    city: e.city ?? "India",
    cities: (() => {
      // Event's own city + every per-day city (multi-city), distinct + trimmed.
      const all = [
        e.city,
        e.location?.city,
        ...(e.days ?? []).map((d) => d.location?.city),
      ].filter((c): c is string => !!c && !!c.trim());
      const seen = new Set<string>();
      const out: string[] = [];
      for (const c of all) {
        const key = c.trim().toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          out.push(c.trim());
        }
      }
      return out.length ? out : [e.city ?? "India"];
    })(),
    multiCity: !!e.multiCity,
    days: e.days,
    cityId: e.cityId,
    coordinate: coordToLatLng(e.location?.coordinate) ?? undefined,
    genreTagIds: e.genreTagIds ?? [],
    venueShort,
    venueLong: venueLong || venueShort,
    date: formatDateShort(e.startDate),
    dateLong: formatDateLong(e.startDate),
    startDateISO: e.startDate,
    startTime: formatTime(e.startDate),
    endTime: formatTime(e.endDate),
    fromPrice: minTicketPrice(e.tickets ?? []),
    isRsvpOnly: (() => {
      const visible = (e.tickets ?? []).filter((t) => t.ticketVisible !== false);
      return (
        visible.length > 0 &&
        visible.every(
          (t) => String(t.ticketCategory ?? "").toUpperCase() === "GUESTLIST"
        )
      );
    })(),
    badge: pickBadge(e),
    series,
    sub: e.description ? e.description.slice(0, 160) : `Live in ${e.city ?? "India"}`,
    about: e.description ?? "",
    tickets: (e.tickets ?? []).filter((t) => t.ticketVisible !== false),
    ticketingEnabled: e.ticketingEnabled ?? false,
    isHighDemand: !!e.isHighDemand,
    isComingSoon: !!e.isComingSoon,
    ticketingTerms: (e as any).ticketingTerms,
    refundPolicy: e.refundPolicy,
    cancellationPolicy: e.cancellationPolicy,
    eventGuide: e.eventGuide,
    faqs: (e.faqs ?? []).filter((faq) => faq.question && faq.answer),
    eventInstructions: e.eventInstructions ?? [],
    prohibitedItems: e.prohibitedItems ?? [],
  };
};

export const formatPrice = (n: number | null): string => {
  if (n === null) return "RSVP";
  if (n === 0) return "Free";
  return `₹${n.toLocaleString("en-IN")}`;
};
