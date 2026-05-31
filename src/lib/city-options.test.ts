import assert from "node:assert/strict";
import test from "node:test";
import { FALLBACK_INDIAN_CITIES } from "./city-fallbacks.ts";
import {
  isFallbackCityList,
  shouldRefreshCitiesForSearch,
  sortCitiesForPicker,
} from "./city-options.ts";
import type { IndianCityMaster } from "@/types/master";

const asansol: IndianCityMaster = {
  _id: "665000000000000000000001",
  value: "Asansol",
  city: "Asansol",
  cityId: "asansol",
  district: "Paschim Bardhaman",
  state: "West Bengal",
};

const city = (
  value: string,
  overrides: Partial<IndianCityMaster> = {}
): IndianCityMaster => ({
  _id: value.toLowerCase().replace(/\s+/g, "-"),
  value,
  city: value,
  ...overrides,
});

test("isFallbackCityList detects the bundled hardcoded city options", () => {
  assert.equal(isFallbackCityList(FALLBACK_INDIAN_CITIES), true);
  assert.equal(isFallbackCityList([asansol]), false);
});

test("shouldRefreshCitiesForSearch refreshes when searching against fallback cities", () => {
  assert.equal(
    shouldRefreshCitiesForSearch({
      options: FALLBACK_INDIAN_CITIES,
      search: "asansol",
      loading: false,
      refreshAttempted: false,
    }),
    true
  );

  assert.equal(
    shouldRefreshCitiesForSearch({
      options: [asansol],
      search: "asansol",
      loading: false,
      refreshAttempted: false,
    }),
    false
  );
});

test("shouldRefreshCitiesForSearch avoids duplicate or blank refreshes", () => {
  assert.equal(
    shouldRefreshCitiesForSearch({
      options: FALLBACK_INDIAN_CITIES,
      search: "",
      loading: false,
      refreshAttempted: false,
    }),
    false
  );
  assert.equal(
    shouldRefreshCitiesForSearch({
      options: FALLBACK_INDIAN_CITIES,
      search: "asansol",
      loading: true,
      refreshAttempted: false,
    }),
    false
  );
  assert.equal(
    shouldRefreshCitiesForSearch({
      options: FALLBACK_INDIAN_CITIES,
      search: "asansol",
      loading: false,
      refreshAttempted: true,
    }),
    false
  );
});

test("sortCitiesForPicker places popular cities first and sorts the rest alphabetically", () => {
  const sorted = sortCitiesForPicker([
    city("Asansol"),
    city("Agra"),
    city("Kolkata"),
    city("Delhi NCR", { city: "Delhi", cityId: "delhi-ncr" }),
    city("Goa"),
    city("Mumbai"),
    city("Pune"),
  ]);

  assert.deepEqual(
    sorted.map((option) => option.value),
    ["Mumbai", "Delhi NCR", "Goa", "Pune", "Kolkata", "Agra", "Asansol"]
  );
});
