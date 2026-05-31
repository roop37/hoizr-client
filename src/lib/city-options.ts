import { FALLBACK_INDIAN_CITIES } from "./city-fallbacks.ts";
import type { IndianCityMaster } from "@/types/master";

const fallbackCityIds = new Set(FALLBACK_INDIAN_CITIES.map((city) => city._id));
const popularCityKeys = [
  ["mumbai"],
  ["delhi", "delhincr", "newdelhi"],
  ["goa"],
  ["pune"],
  ["kolkata", "calcutta"],
  ["bengaluru", "bangalore"],
  ["hyderabad"],
  ["chennai"],
  ["ahmedabad"],
  ["jaipur"],
].reduce<Map<string, number>>((acc, aliases, index) => {
  aliases.forEach((alias) => acc.set(alias, index));
  return acc;
}, new Map());

const cityLabel = (city: IndianCityMaster) => city.value || city.city || "";

const normalizeCityKey = (value?: string | null) =>
  (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

const popularRank = (city: IndianCityMaster) => {
  const keys = [city.value, city.city, city.cityId].map(normalizeCityKey);
  const ranks = keys
    .map((key) => popularCityKeys.get(key))
    .filter((rank): rank is number => typeof rank === "number");
  return ranks.length ? Math.min(...ranks) : Number.POSITIVE_INFINITY;
};

export const isFallbackCityList = (options: IndianCityMaster[]) =>
  options.length > 0 && options.every((city) => fallbackCityIds.has(city._id));

export const sortCitiesForPicker = (options: IndianCityMaster[]) =>
  [...options].sort((a, b) => {
    const rankA = popularRank(a);
    const rankB = popularRank(b);
    if (rankA !== rankB) return rankA - rankB;
    return cityLabel(a).localeCompare(cityLabel(b), "en-IN", {
      sensitivity: "base",
    });
  });

type CitySearchRefreshInput = {
  options: IndianCityMaster[];
  search: string;
  loading: boolean;
  refreshAttempted: boolean;
};

export const shouldRefreshCitiesForSearch = ({
  options,
  search,
  loading,
  refreshAttempted,
}: CitySearchRefreshInput) =>
  search.trim().length > 0 &&
  !loading &&
  !refreshAttempted &&
  isFallbackCityList(options);
