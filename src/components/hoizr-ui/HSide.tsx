"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useUIStore } from "@/store/uiStore";
import type { IndianCityMaster } from "@/types/master";
import { GlassSurface } from "./GlassSurface";
import { HICONS } from "./icons";
import { HoizrLogo } from "./HoizrLogo";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  rightMeta?: string;
};

const CORE_NAV: NavItem[] = [
  // Pre-launch: search hidden until the catalogue grows.
  // { href: "/search", label: "Search", icon: HICONS.search },
  { href: "/", label: "Home", icon: HICONS.home },
  { href: "/events", label: "Events", icon: HICONS.grid },
  // Pre-launch: drop the live-count badge — no real-time count yet.
  { href: "/live", label: "Live now", icon: HICONS.radio },
];

const LIBRARY_NAV: NavItem[] = [
  { href: "/me", label: "Profile", icon: HICONS.user },
  { href: "/orders", label: "My Orders", icon: HICONS.ticket },
  { href: "/artist", label: "Artists", icon: HICONS.mic },
  { href: "/venues", label: "Venues", icon: HICONS.pin },
];

const EXPLORE = [
  { href: "/events?vertical=dont-miss", label: "Don't Miss", color: "#FA2D48" },
  { href: "/events?vertical=club", label: "Club Night", color: "#FF2E8A" },
  { href: "/events?vertical=comedy", label: "Comedy", color: "#C5FF3D" },
  { href: "/events?vertical=sports", label: "Sports", color: "#3FE0FF" },
  { href: "/events?vertical=fest", label: "Festivals", color: "#FF7A3D" },
];

const isActive = (pathname: string | null, href: string) => {
  if (!pathname) return false;
  const base = href.split("?")[0];
  if (base === "/") return pathname === "/";
  return pathname === base || pathname.startsWith(`${base}/`);
};

const CITY_STORAGE_KEY = "hoizr:selected-city";

const cityLabel = (city: IndianCityMaster) => city.value || city.city || "Unknown city";

const distanceKm = (
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
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

const nearestSupportedCity = (
  latitude: number,
  longitude: number,
  cities: IndianCityMaster[],
) => {
  const withCoords = cities.filter(
    (city) =>
      typeof city.latitude === "number" && typeof city.longitude === "number",
  );
  if (!withCoords.length) return null;

  const nearest = withCoords
    .map((city) => ({
      city,
      distance: distanceKm(
        { latitude, longitude },
        { latitude: city.latitude as number, longitude: city.longitude as number },
      ),
    }))
    .sort((a, b) => a.distance - b.distance)[0];

  return nearest && nearest.distance <= 250 ? nearest.city : null;
};

type Props = {
  cities: IndianCityMaster[];
};

export const HSide = ({ cities }: Props) => {
  const pathname = usePathname();
  const user = useUIStore((s) => s.user);
  const city = useUIStore((s) => s.city);
  const setCity = useUIStore((s) => s.setCity);
  const openSignIn = useUIStore((s) => s.openSignIn);
  const mobileSidebarOpen = useUIStore((s) => s.mobileSidebarOpen);
  const closeMobileSidebar = useUIStore((s) => s.closeMobileSidebar);
  const [cityMenuOpen, setCityMenuOpen] = useState(false);
  const cityMenuRef = useRef<HTMLDivElement | null>(null);

  const sortedCities = useMemo(
    () =>
      [...cities].sort((a, b) =>
        cityLabel(a).localeCompare(cityLabel(b), "en-IN", {
          sensitivity: "base",
        }),
      ),
    [cities],
  );

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!cityMenuRef.current?.contains(event.target as Node)) {
        setCityMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    closeMobileSidebar();
  }, [closeMobileSidebar, pathname]);

  useEffect(() => {
    if (!mobileSidebarOpen) return;

    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMobileSidebar();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [closeMobileSidebar, mobileSidebarOpen]);

  useEffect(() => {
    // Pre-launch: city picker is disabled, so we skip persisted-city
    // restore + geolocation auto-detect entirely. Restore the original
    // body below (and remove this early return) when cities reopen.
    /*
    if (!sortedCities.length) return;

    const saved = window.localStorage.getItem(CITY_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { city?: string; cityId?: string };
        const match = sortedCities.find(
          (item) =>
            item._id === parsed.cityId ||
            item.cityId === parsed.cityId ||
            cityLabel(item).toLowerCase() === parsed.city?.toLowerCase(),
        );
        if (match) {
          setCity(cityLabel(match), match._id);
          return;
        }
      } catch {
        window.localStorage.removeItem(CITY_STORAGE_KEY);
      }
    }

    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const match = nearestSupportedCity(
          position.coords.latitude,
          position.coords.longitude,
          sortedCities,
        );
        if (!match) return;
        const label = cityLabel(match);
        setCity(label, match._id);
        window.localStorage.setItem(
          CITY_STORAGE_KEY,
          JSON.stringify({ city: label, cityId: match._id }),
        );
      },
      () => undefined,
      { enableHighAccuracy: false, maximumAge: 60 * 60 * 1000, timeout: 6000 },
    );
    */
  }, [setCity, sortedCities]);

  const selectCity = (nextCity?: IndianCityMaster) => {
    if (!nextCity) {
      setCity("All cities", undefined);
      window.localStorage.removeItem(CITY_STORAGE_KEY);
      setCityMenuOpen(false);
      return;
    }

    const label = cityLabel(nextCity);
    setCity(label, nextCity._id);
    window.localStorage.setItem(
      CITY_STORAGE_KEY,
      JSON.stringify({ city: label, cityId: nextCity._id }),
    );
    setCityMenuOpen(false);
  };

  return (
    <>
      {mobileSidebarOpen ? (
        <button
          type="button"
          className="h-side-mobile-backdrop"
          aria-label="Close menu"
          onClick={closeMobileSidebar}
        />
      ) : null}
      <aside
        id="hoizr-sidebar"
        className={`h-side-wrap${mobileSidebarOpen ? " is-mobile-open" : ""}`}
        aria-label="Sidebar navigation"
      >
      <GlassSurface
        width="100%"
        height="100%"
        borderRadius={22}
        backgroundOpacity={0.42}
        saturation={1.5}
        blur={22}
        opacity={0.92}
        brightness={38}
        className="h-side-glass"
      >
        <div className="h-side">
          <div className="h-side-header">
            <HoizrLogo size="small" href="/" />
            <button
              type="button"
              className="h-side-close"
              aria-label="Close menu"
              onClick={closeMobileSidebar}
            >
              {HICONS.close}
            </button>
            {/* Pre-launch: city picker hidden entirely. Restore the
                block below when cities reopen.
            <div className="h-city-picker" ref={cityMenuRef}>
              <button
                type="button"
                className="city"
                title="Change city"
                onClick={() => setCityMenuOpen((open) => !open)}
                aria-expanded={cityMenuOpen}
              >
                {city} <span style={{ display: "inline-flex" }}>{HICONS.chevDown}</span>
              </button>
              {cityMenuOpen ? (
                <div className="h-city-menu">
                  <button
                    type="button"
                    className={city === "All cities" ? "active" : ""}
                    onClick={() => selectCity()}
                  >
                    All cities
                  </button>
                  {sortedCities.map((item) => {
                    const label = cityLabel(item);
                    return (
                      <button
                        key={item._id}
                        type="button"
                        className={city === label ? "active" : ""}
                        onClick={() => selectCity(item)}
                      >
                        <span>{label}</span>
                        {item.state ? <small>{item.state}</small> : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
            */}
          </div>

          <div className="h-side-scroll">
            <div className="h-side-group">
              {CORE_NAV.map((n) => (
                <Link key={n.href} href={n.href} className={`h-side-item ${isActive(pathname, n.href) ? "active" : ""}`}>
                  <span className="ic">{n.icon}</span>
                  <span>{n.label}</span>
                  {n.rightMeta ? <span className="right-meta">{n.rightMeta}</span> : null}
                </Link>
              ))}
            </div>

            {user.signedIn ? (
              <div className="h-side-group">
                <h4>Your Library</h4>
                {LIBRARY_NAV.map((n) => (
                  <Link key={n.href} href={n.href} className={`h-side-item ${isActive(pathname, n.href) ? "active" : ""}`}>
                    <span className="ic">{n.icon}</span>
                    <span>{n.label}</span>
                  </Link>
                ))}
                <button type="button" className="h-side-item" disabled style={{ opacity: 0.55 }}>
                  <span className="ic">{HICONS.globe}</span>
                  <span>Hoizr Local</span>
                  <span className="right-meta">SOON</span>
                </button>
              </div>
            ) : null}

            {/* Pre-launch: Explore vertical chips hidden until verticals
                are wired to real data. Restore by un-commenting.
            <div className="h-side-group">
              <h4>Explore</h4>
              {EXPLORE.map((e) => (
                <Link key={e.label} href={e.href} className="h-side-item">
                  <span className="pip" style={{ background: e.color }} />
                  <span>{e.label}</span>
                </Link>
              ))}
            </div>
            */}
          </div>

          {/* Bottom rail: business resources sit right above the sign-in
              button so hosts can jump to business.hoizr.com from anywhere. */}
          <div className="h-side-biz h-side-biz--foot">
            <h5>BUSINESS RESOURCES</h5>
            <a href="https://business.hoizr.com" target="_blank" rel="noreferrer">
              List An Event ↗
            </a>
            <a href="https://business.hoizr.com" target="_blank" rel="noreferrer">
              Marketing Tools ↗
            </a>
            <a href="https://business.hoizr.com" target="_blank" rel="noreferrer">
              Products ↗
            </a>
            <a href="https://business.hoizr.com/resources#stickers" target="_blank" rel="noreferrer">
              Sticker Downloads ↗
            </a>
            <a href="https://business.hoizr.com/legal/privacy" target="_blank" rel="noreferrer">
              Privacy Policy ↗
            </a>
            <a href="https://business.hoizr.com/legal/terms" target="_blank" rel="noreferrer">
              Terms &amp; Conditions ↗
            </a>
          </div>

          {/* Pre-launch: sign-in entry hidden until accounts reopen.
          {!user.signedIn ? (
            <div className="h-side-foot">
              <button
                type="button"
                className="h-btn h-btn-outline"
                style={{ width: "100%", justifyContent: "center", padding: "9px 14px" }}
                onClick={openSignIn}
              >
                Sign in
              </button>
            </div>
          ) : (
            <div className="h-side-foot">
              <div className="avatar">{user.initials}</div>
              <div className="who">{user.name}</div>
            </div>
          )}
          */}
          <div className="h-side-foot">
            <button
              type="button"
              className="h-btn h-btn-outline"
              style={{ width: "100%", justifyContent: "center", padding: "9px 14px", opacity: 0.65, cursor: "not-allowed" }}
              disabled
              aria-label="Sign-in coming soon"
            >
              Sign in · coming soon
            </button>
          </div>
        </div>
      </GlassSurface>
      </aside>
    </>
  );
};
