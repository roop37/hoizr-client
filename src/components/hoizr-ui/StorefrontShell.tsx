"use client";

import { usePathname } from "next/navigation";
import type { IndianCityMaster } from "@/types/master";
import { HSide } from "./HSide";
import { HFooter } from "./HFooter";
import { HMobileTopBar } from "./HMobileTopBar";
import { HMobileTabs } from "./HMobileTabs";
import { HCartBar } from "./HCartBar";
import { SignInModal } from "./SignInModal";
import { CityInitializer } from "./CityInitializer";
import { CityPickerModal } from "./CityPickerModal";
import { WebPushPrompt } from "@/components/notifications/WebPushPrompt";

/**
 * Routes that are STANDALONE flows opened from an external link (e.g. a WhatsApp
 * offline-payment link `/t/<code>`). They must NOT carry the storefront chrome
 * (sidebar, footer, mobile tabs, cart bar) — the recipient is there to do one
 * thing. Everything else gets the full storefront shell.
 */
const isStandaloneRoute = (pathname: string | null): boolean =>
  !!pathname && pathname.startsWith("/t/");

export function StorefrontShell({
  cities,
  children,
}: {
  cities: IndianCityMaster[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (isStandaloneRoute(pathname)) {
    // Clean, full-screen page on the dark app background — no nav chrome.
    // (The page itself renders the <main>.)
    return <div className="min-h-[100dvh]">{children}</div>;
  }

  return (
    <>
      <HMobileTopBar />
      <div className="h-shell">
        <HSide cities={cities} />
        <div className="h-content">
          <div className="h-content-grow">{children}</div>
          <HFooter />
        </div>
      </div>
      <SignInModal />
      <HCartBar />
      <HMobileTabs />
      <WebPushPrompt />
      <CityInitializer cities={cities} />
      <CityPickerModal cities={cities} />
    </>
  );
}

export default StorefrontShell;
