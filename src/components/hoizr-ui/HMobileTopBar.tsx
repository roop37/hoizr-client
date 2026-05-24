"use client";

import { HoizrLogo } from "./HoizrLogo";

/**
 * Mobile-only top bar. Visible only ≤1100px (the floating glass
 * sidebar covers the brand on desktop). For now this just anchors the
 * Hoizr wordmark to the top-left so mobile users always know where
 * they are — additional controls (city picker, profile) can land
 * here later.
 */
export const HMobileTopBar = () => {
  return (
    <header className="h-mobile-topbar" aria-label="Hoizr">
      <div className="h-mobile-topbar__inner">
        <HoizrLogo size="small" href="/" />
      </div>
    </header>
  );
};
