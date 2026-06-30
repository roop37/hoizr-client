"use client";

import { useUIStore } from "@/store/uiStore";
import { HICONS } from "./icons";
import { HoizrLogo } from "./HoizrLogo";

export const HMobileTopBar = () => {
  const city = useUIStore((s) => s.city);
  const openCityPicker = useUIStore((s) => s.openCityPicker);

  return (
    <header className="h-mobile-topbar" aria-label="Hoizr">
      <div className="h-mobile-topbar__inner">
        <HoizrLogo size="small" href="/" />
        <button
          type="button"
          className="h-city-pill"
          onClick={openCityPicker}
          aria-label={`Current city: ${city}. Tap to change.`}
        >
          <span className="h-city-pill-ic">{HICONS.pin}</span>
          <span>{city || "Pick city"}</span>
          <span style={{ display: "inline-flex" }}>{HICONS.chevDown}</span>
        </button>
      </div>
    </header>
  );
};
