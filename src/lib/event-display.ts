import type { PublicEvent, PublicTicket } from "@/types/event";
import { minTicketPrice } from "./format";

export type DisplayEvent = {
  id: string;
  slug: string;
  title: string;
  image: string | null;
  horizontalImage: string | null;
  imageStyle: string;
  city: string;
  cityId?: string;
  genreTagIds: string[];
  venueShort: string;
  venueLong: string;
  date: string;
  dateLong: string;
  startTime: string;
  endTime: string;
  fromPrice: number | null;
  badge: string;
  series: string;
  sub: string;
  about: string;
  tickets: PublicTicket[];
  ticketingEnabled: boolean;
  isHighDemand: boolean;
  isComingSoon: boolean;
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
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
};

const pickBadge = (e: PublicEvent) => {
  if (e.isHighDemand) return "HIGH DEMAND";
  if (e.isComingSoon) return "COMING SOON";
  if (e.eventType && e.eventType.length > 0) return e.eventType[0].toUpperCase();
  if (e.ticketingEnabled === false) return "GUESTLIST";
  return "NEW";
};

export const toDisplayEvent = (e: PublicEvent): DisplayEvent => {
  const venueLong = [e.location?.formattedAddress, e.location?.addressLine1, e.city]
    .filter(Boolean)
    .join(" · ");
  const venueShort = e.location?.addressLine1 ?? e.city ?? "Venue TBA";
  const series = (e.eventType ?? [])[0]?.toUpperCase() ?? "HOIZR";
  return {
    id: e._id,
    slug: e.slug ?? e._id,
    title: e.title ?? "Untitled event",
    image: e.eventFlyer ?? null,
    horizontalImage: e.horizontalFlyer ?? null,
    imageStyle: PLACEHOLDER_GRADIENTS[hashString(e._id) % PLACEHOLDER_GRADIENTS.length],
    city: e.city ?? "India",
    cityId: e.cityId,
    genreTagIds: e.genreTagIds ?? [],
    venueShort,
    venueLong: venueLong || venueShort,
    date: formatDateShort(e.startDate),
    dateLong: formatDateLong(e.startDate),
    startTime: formatTime(e.startDate),
    endTime: formatTime(e.endDate),
    fromPrice: minTicketPrice(e.tickets ?? []),
    badge: pickBadge(e),
    series,
    sub: e.description ? e.description.slice(0, 160) : `Live in ${e.city ?? "India"}`,
    about: e.description ?? "",
    tickets: (e.tickets ?? []).filter((t) => t.ticketVisible !== false),
    ticketingEnabled: e.ticketingEnabled ?? false,
    isHighDemand: !!e.isHighDemand,
    isComingSoon: !!e.isComingSoon,
  };
};

export const formatPrice = (n: number | null): string => {
  if (n === null) return "Guestlist";
  if (n === 0) return "Free";
  return `₹${n.toLocaleString("en-IN")}`;
};
