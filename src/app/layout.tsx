import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { PostHogAnalytics } from "@/components/analytics/PostHogProvider";
import { WebPushPrompt } from "@/components/notifications/WebPushPrompt";
import { GlassFilter } from "@/components/hoizr-ui/GlassFilter";
import { HSide } from "@/components/hoizr-ui/HSide";
import { CityPickerModal } from "@/components/hoizr-ui/CityPickerModal";
import { CityInitializer } from "@/components/hoizr-ui/CityInitializer";
// Pre-launch: floating auth chip hidden; sidebar sign-in opens the real modal.
// import { HFloatingAuth } from "@/components/hoizr-ui/HFloatingAuth";
import { HCartBar } from "@/components/hoizr-ui/HCartBar";
import { SignInModal } from "@/components/hoizr-ui/SignInModal";
import { HFooter } from "@/components/hoizr-ui/HFooter";
import { HMobileTabs } from "@/components/hoizr-ui/HMobileTabs";
import { HMobileTopBar } from "@/components/hoizr-ui/HMobileTopBar";
import Noise from "@/components/hoizr-ui/Noise";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/hoizr-ui/seo/JsonLd";
import { fetchCustomerMasters } from "@/lib/home-data";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hoizr.com";

export const viewport: Viewport = {
  themeColor: "#0a0a0e",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "Hoizr — Concerts, festivals, club nights & comedy across India",
    template: "%s · Hoizr",
  },
  description:
    "Discover and book tickets for concerts, festivals, club nights, comedy, and live music across India. Instant QR tickets, UPI checkout, and the artists you should be hearing.",
  applicationName: "Hoizr",
  keywords: [
    "concert tickets India",
    "club night tickets",
    "festival tickets India",
    "live music India",
    "comedy show tickets",
    "events in Mumbai",
    "events in Delhi",
    "events in Bengaluru",
    "buy event tickets online India",
    "hoizr",
  ],
  authors: [{ name: "Hoizr", url: SITE_URL }],
  creator: "Hoizr",
  publisher: "Hoizr Technologies Pvt. Ltd.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
  alternates: {
    canonical: "/",
    languages: {
      "en-IN": "/",
      "x-default": "/",
    },
    types: {
      "application/rss+xml": "/rss.xml",
    },
  },
  formatDetection: {
    email: false,
    telephone: false,
    address: false,
  },
  openGraph: {
    type: "website",
    siteName: "Hoizr",
    locale: "en_IN",
    title: "Hoizr",
    description:
      "Concerts, festivals, club nights, comedy and live music across India. Tickets in 60 seconds.",
    url: SITE_URL,
    images: [
      {
        url: "/opengraph-image.webp",
        width: 1200,
        height: 630,
        alt: "Hoizr — discover concerts, festivals, comedy and club nights in India",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1,
    },
  },
  category: "events",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const masters = await fetchCustomerMasters();

  return (
    <html lang="en">
      <body>
        <PostHogAnalytics>
          <OrganizationJsonLd />
          <WebSiteJsonLd />
          <GlassFilter />
          <Noise
            patternSize={250}
            patternScaleX={2}
            patternScaleY={2}
            patternRefreshInterval={2}
            patternAlpha={16}
          />
          <Suspense fallback={null}>
            <PageViewTracker />
          </Suspense>
          <HMobileTopBar />
          <div className="h-shell">
            <HSide cities={masters.cities} />
            <div className="h-content">
              <div className="h-content-grow">{children}</div>
              <HFooter />
            </div>
          </div>
          {/* Pre-launch: floating auth hidden.
          <HFloatingAuth />
          */}
          <SignInModal />
          <HCartBar />
          <HMobileTabs />
          <WebPushPrompt />
          <CityInitializer cities={masters.cities} />
          <CityPickerModal cities={masters.cities} />
        </PostHogAnalytics>
      </body>
    </html>
  );
}
