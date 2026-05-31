"use client";

import { useEffect, useRef } from "react";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/auth";
import type { IndianCityMaster } from "@/types/master";
import {
  CITY_STORAGE_KEY,
  nearestSupportedCity,
  persistSelectedCity,
} from "./CityPickerModal";

// 180-day TTL — long enough that returning users skip the modal,
// short enough that a stale localStorage entry self-heals.
const CITY_TTL_MS = 1000 * 60 * 60 * 24 * 180;

const cityLabel = (c: IndianCityMaster) =>
  c.value || c.city || "";

type Props = {
  cities: IndianCityMaster[];
};

export const CityInitializer = ({ cities }: Props) => {
  const setCity = useUIStore((s) => s.setCity);
  const setCityHydrated = useUIStore((s) => s.setCityHydrated);
  const cityHydrated = useUIStore((s) => s.cityHydrated);
  const openCityPicker = useUIStore((s) => s.openCityPicker);
  const authHydrated = useAuthStore((s) => s.hydrated);
  const authHydrate = useAuthStore((s) => s.hydrate);
  const profile = useAuthStore((s) => s.profile);
  const ran = useRef(false);

  useEffect(() => {
    if (!authHydrated) {
      void authHydrate();
    }
  }, [authHydrated, authHydrate]);

  useEffect(() => {
    if (ran.current) return;
    if (!authHydrated) return;
    if (!cities.length) {
      ran.current = true;
      setCityHydrated(true);
      openCityPicker();
      return;
    }
    ran.current = true;

    const findMatch = (
      cityValue?: string | null,
      cityId?: string | null
    ): IndianCityMaster | null => {
      if (!cityValue && !cityId) return null;
      return (
        cities.find(
          (c) =>
            (cityId && (c._id === cityId || c.cityId === cityId)) ||
            (cityValue &&
              cityLabel(c).toLowerCase() === cityValue.toLowerCase())
        ) ?? null
      );
    };

    // 1) Logged-in user profile city wins (source of truth for them).
    if (profile?.city) {
      const match = findMatch(profile.city);
      if (match) {
        const label = cityLabel(match);
        setCity(label, match._id);
        persistSelectedCity(label, match._id);
        setCityHydrated(true);
        return;
      }
    }

    // 2) localStorage cache.
    try {
      const raw = window.localStorage.getItem(CITY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          city?: string;
          cityId?: string;
          ts?: number;
        };
        const fresh =
          typeof parsed.ts !== "number" ||
          Date.now() - parsed.ts < CITY_TTL_MS;
        if (fresh) {
          const match = findMatch(parsed.city, parsed.cityId);
          if (match) {
            const label = cityLabel(match);
            setCity(label, match._id);
            setCityHydrated(true);
            return;
          }
        } else {
          window.localStorage.removeItem(CITY_STORAGE_KEY);
        }
      }
    } catch {
      // ignore
    }

    // 3) Try geolocation silently — only auto-picks if user has already
    // granted permission. Browsers won't prompt without a user gesture
    // on most modern versions, so this is best-effort.
    if (navigator.geolocation && navigator.permissions) {
      void navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((status) => {
          if (status.state !== "granted") {
            setCityHydrated(true);
            openCityPicker();
            return;
          }
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const match = nearestSupportedCity(
                pos.coords.latitude,
                pos.coords.longitude,
                cities
              );
              if (match) {
                const label = cityLabel(match);
                setCity(label, match._id);
                persistSelectedCity(label, match._id);
                setCityHydrated(true);
              } else {
                setCityHydrated(true);
                openCityPicker();
              }
            },
            () => {
              setCityHydrated(true);
              openCityPicker();
            },
            {
              enableHighAccuracy: false,
              maximumAge: 60 * 60 * 1000,
              timeout: 6000,
            }
          );
        })
        .catch(() => {
          setCityHydrated(true);
          openCityPicker();
        });
    } else {
      setCityHydrated(true);
      openCityPicker();
    }
  }, [
    authHydrated,
    profile,
    cities,
    setCity,
    setCityHydrated,
    openCityPicker,
  ]);

  // Suppress unused-warning when cityHydrated isn't read directly.
  void cityHydrated;

  return null;
};
