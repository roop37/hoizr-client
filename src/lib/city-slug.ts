import type { IndianCityMaster } from "@/types/master";
import { FALLBACK_INDIAN_CITIES } from "./city-fallbacks";

/** URL-safe slug for a city name: "Delhi NCR" → "delhi-ncr". */
export const citySlug = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const titleCase = (slug: string): string =>
  slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

/**
 * Resolve a URL slug to a display city name. Prefers a known master city (so
 * `delhi-ncr` → "Delhi NCR") but falls back to title-casing the slug so
 * long-tail cities not in the masters (e.g. `thane`) still render a valid
 * SEO landing page rather than 404'ing.
 */
export const resolveCityFromSlug = (
  slug: string,
  cities: IndianCityMaster[]
): { name: string; matched: boolean } => {
  const all = cities.length ? cities : FALLBACK_INDIAN_CITIES;
  const hit = all.find(
    (c) =>
      (c.cityId && c.cityId === slug) ||
      citySlug(c.city ?? c.value ?? "") === slug
  );
  if (hit) {
    return { name: hit.city ?? hit.value ?? titleCase(slug), matched: true };
  }
  return { name: titleCase(slug), matched: false };
};

/**
 * Curated city set for footer links + sitemap. Covers the user-requested
 * cities plus the major metros so the location pages get crawled and linked.
 */
export const SEO_CITIES: string[] = [
  "Mumbai",
  "Delhi",
  "Bengaluru",
  "Pune",
  "Goa",
  "Hyderabad",
  "Kolkata",
  "Chennai",
  "Surat",
  "Ahmedabad",
  "Jaipur",
  "Chandigarh",
];

/**
 * Curated nightlife/event neighbourhoods per city (keyed by city slug). Powers
 * neighbourhood SEO pages (`/events-in/[city]/[area]`) + internal links from the
 * city page + sitemap. Events store addresses as free text (no structured
 * locality field), so neighbourhood filtering is a text-contains match against
 * the event's address fields — use full names that actually appear in addresses
 * (e.g. "Koregaon Park", not "KP").
 */
export const CITY_AREAS: Record<string, string[]> = {
  mumbai: ["Bandra", "Andheri", "Lower Parel", "Colaba", "Juhu"],
  pune: ["Koregaon Park", "Viman Nagar", "Baner", "Kalyani Nagar"],
  bengaluru: ["Indiranagar", "Koramangala", "MG Road", "Whitefield"],
  delhi: ["Hauz Khas", "Connaught Place", "Aerocity"],
  goa: ["Anjuna", "Baga", "Calangute"],
  hyderabad: ["Jubilee Hills", "Gachibowli", "Banjara Hills"],
};

/**
 * Resolve an area slug (within a city) to a display name. Prefers a curated
 * area for the city; otherwise title-cases the slug so any neighbourhood still
 * renders an on-demand page.
 */
export const resolveAreaFromSlug = (
  citySlugValue: string,
  areaSlugValue: string
): string => {
  const areas = CITY_AREAS[citySlugValue] ?? [];
  const hit = areas.find((a) => citySlug(a) === areaSlugValue);
  if (hit) return hit;
  return areaSlugValue
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

/**
 * True if an event's combined address text plausibly falls within `areaName`.
 * Text-contains (case-insensitive) — events have no structured locality field.
 */
export const addressMatchesArea = (
  addressText: string,
  areaName: string
): boolean => addressText.toLowerCase().includes(areaName.toLowerCase());
