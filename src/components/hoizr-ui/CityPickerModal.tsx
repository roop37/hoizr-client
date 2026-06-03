"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/auth";
import { sdk } from "@/lib/sdk";
import { FALLBACK_INDIAN_CITIES } from "@/lib/city-fallbacks";
import {
  isFallbackCityList,
  shouldRefreshCitiesForSearch,
  sortCitiesForPicker,
} from "@/lib/city-options";
import type { IndianCityMaster } from "@/types/master";
import { HICONS } from "./icons";

export const CITY_STORAGE_KEY = "hoizr:selected-city";

const cityLabel = (c: IndianCityMaster) =>
  c.value || c.city || "Unknown city";

const distanceKm = (
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
) => {
  const toRad = (n: number) => (n * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

export const nearestSupportedCity = (
  latitude: number,
  longitude: number,
  cities: IndianCityMaster[]
) => {
  const withCoords = cities.filter(
    (c) =>
      typeof c.latitude === "number" && typeof c.longitude === "number"
  );
  if (!withCoords.length) return null;
  const nearest = withCoords
    .map((c) => ({
      city: c,
      distance: distanceKm(
        { latitude, longitude },
        { latitude: c.latitude as number, longitude: c.longitude as number }
      ),
    }))
    .sort((a, b) => a.distance - b.distance)[0];
  return nearest && nearest.distance <= 250 ? nearest.city : null;
};

export const persistSelectedCity = (
  city: string,
  cityId?: string
) => {
  try {
    window.localStorage.setItem(
      CITY_STORAGE_KEY,
      JSON.stringify({ city, cityId, ts: Date.now() })
    );
  } catch {
    // ignore quota / privacy errors
  }
};

type Props = {
  cities: IndianCityMaster[];
};

export const CityPickerModal = ({ cities }: Props) => {
  const open = useUIStore((s) => s.cityPickerOpen);
  const close = useUIStore((s) => s.closeCityPicker);
  const setCity = useUIStore((s) => s.setCity);
  const currentCityId = useUIStore((s) => s.cityId);
  const profile = useAuthStore((s) => s.profile);
  const [search, setSearch] = useState("");
  const [locating, setLocating] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [cityOptions, setCityOptions] = useState<IndianCityMaster[]>(cities);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const searchRefreshAttemptedRef = useRef(false);

  useEffect(() => {
    if (cities.length) setCityOptions(cities);
  }, [cities]);

  const loadCities = useCallback(
    async (force = false): Promise<IndianCityMaster[]> => {
      if (!force && cityOptions.length && !isFallbackCityList(cityOptions)) {
        return cityOptions;
      }

      setLoadingCities(true);
      try {
        const data = await sdk.ActiveCitiesWithCoords();
        const next =
          data.getActiveIndianCities?.length
            ? (data.getActiveIndianCities as IndianCityMaster[])
            : cityOptions.length
              ? cityOptions
              : FALLBACK_INDIAN_CITIES;
        setCityOptions(next);
        return next;
      } catch {
        try {
          const data = await sdk.ActiveCities();
          const next =
            data.getActiveIndianCities?.length
              ? (data.getActiveIndianCities as IndianCityMaster[])
              : cityOptions.length
                ? cityOptions
                : FALLBACK_INDIAN_CITIES;
          setCityOptions(next);
          return next;
        } catch {
          const next = cityOptions.length ? cityOptions : FALLBACK_INDIAN_CITIES;
          setCityOptions(next);
          return next;
        }
      } finally {
        setLoadingCities(false);
      }
    },
    [cityOptions]
  );

  const sortedCities = useMemo(
    () => sortCitiesForPicker(cityOptions),
    [cityOptions]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sortedCities;
    return sortedCities.filter((c) => {
      // Match against every readable string the city record carries so
      // typos and short prefixes (e.g. "mum" → Mumbai) always surface.
      const haystack = [
        c.value,
        c.city,
        c.district,
        c.state,
        c.cityId,
      ]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase())
        .join(" ");
      return haystack.includes(q);
    });
  }, [sortedCities, search]);

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setLocateError(null);
    searchRefreshAttemptedRef.current = false;
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    if (!cityOptions.length) void loadCities();
  }, [open, cityOptions.length, loadCities]);

  useEffect(() => {
    if (!open) return;
    if (
      !shouldRefreshCitiesForSearch({
        options: cityOptions,
        search,
        loading: loadingCities,
        refreshAttempted: searchRefreshAttemptedRef.current,
      })
    ) {
      return;
    }

    const t = window.setTimeout(() => {
      searchRefreshAttemptedRef.current = true;
      void loadCities(true);
    }, 200);

    return () => clearTimeout(t);
  }, [cityOptions, loadCities, loadingCities, open, search]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const pickCity = async (next: IndianCityMaster) => {
    const label = cityLabel(next);
    setCity(label, next._id);
    persistSelectedCity(label, next._id);
    close();
    if (profile) {
      try {
        await sdk.UpdateMyProfile({
          input: { city: label },
        });
      } catch {
        // Non-blocking — localStorage already persisted.
      }
    }
  };

  const useMyLocation = async () => {
    const options =
      cityOptions.length && !isFallbackCityList(cityOptions)
        ? cityOptions
        : await loadCities(true);
    if (!options.length) {
      setLocateError("No supported cities are loaded yet. Try searching again.");
      return;
    }
    if (!navigator.geolocation) {
      setLocateError("Geolocation not available in this browser.");
      return;
    }
    setLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const match = nearestSupportedCity(
          pos.coords.latitude,
          pos.coords.longitude,
          options
        );
        setLocating(false);
        if (!match) {
          setLocateError("No supported city near you yet.");
          return;
        }
        void pickCity(match);
      },
      (err) => {
        setLocating(false);
        setLocateError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Pick a city below."
            : "Couldn't read your location. Pick a city below."
        );
      },
      { enableHighAccuracy: false, maximumAge: 60 * 60 * 1000, timeout: 8000 }
    );
  };

  return (
    <div
      className="h-city-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Choose your city"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="h-city-modal h-glass-card text-white">
        <div className="h-city-modal-head">
          <div>
            <h2>Where are you?</h2>
            <p>Pick a city to see events near you.</p>
          </div>
          <button
            type="button"
            className="h-city-close"
            onClick={close}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <button
          type="button"
          className="h-city-locate"
          onClick={useMyLocation}
          disabled={locating}
        >
          <span className="h-city-locate-ic">{HICONS.pin}</span>
          <span>
            {locating ? "Locating…" : "Use my current location"}
          </span>
        </button>
        {locateError ? (
          <p className="h-city-locate-error">{locateError}</p>
        ) : null}

        <div className="h-city-search">
          <input
            ref={inputRef}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cities…"
            aria-label="Search cities"
          />
        </div>

        <div className="h-city-list">
          {filtered.length === 0 ? (
            <div className="h-city-empty">
              {loadingCities ? "Loading cities…" : `No cities match “${search}”.`}
            </div>
          ) : (
            filtered.map((c) => {
              const label = cityLabel(c);
              const selected = c._id === currentCityId;
              return (
                <button
                  key={c._id}
                  type="button"
                  className={`h-city-item${selected ? " h-city-item--selected" : ""}`}
                  onClick={() => void pickCity(c)}
                >
                  <span className="h-city-item-name">{label}</span>
                  {c.state ? (
                    <span className="h-city-item-state">{c.state}</span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
