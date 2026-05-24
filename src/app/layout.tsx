import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { PostHogAnalytics } from "@/components/analytics/PostHogProvider";
import { WebPushPrompt } from "@/components/notifications/WebPushPrompt";
import { GlassFilter } from "@/components/hoizr-ui/GlassFilter";
import { HSide } from "@/components/hoizr-ui/HSide";
// Pre-launch: floating auth chip + sign-in modal hidden until accounts
// reopen. The cart bar stays — checkout is gated separately.
// import { HFloatingAuth } from "@/components/hoizr-ui/HFloatingAuth";
import { HCartBar } from "@/components/hoizr-ui/HCartBar";
// import { SignInModal } from "@/components/hoizr-ui/SignInModal";
import { HFooter } from "@/components/hoizr-ui/HFooter";
import { HMobileTabs } from "@/components/hoizr-ui/HMobileTabs";
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
    default: "Hoizr — Find the night. Concerts, festivals & club nights in India",
    template: "%s · Hoizr",
  },
  description:
    "Discover and book tickets for concerts, festivals, club nights, comedy, and live music across India. Instant QR tickets. Pay with UPI.",
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
    title: "Hoizr — Find the night.",
    description:
      "Concerts, festivals, club nights, comedy and live music across India. Tickets in 60 seconds.",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    site: "@hoizr",
    creator: "@hoizr",
    title: "Hoizr — Find the night.",
    description: "Live music & event tickets across India.",
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
          <div className="h-shell">
            <HSide cities={masters.cities} />
            <div className="h-content">
              <div className="h-content-grow">{children}</div>
              <HFooter />
            </div>
          </div>
          {/* Pre-launch: floating auth + sign-in modal hidden.
          <HFloatingAuth />
          <SignInModal />
          */}
          <HCartBar />
          <HMobileTabs />
          <WebPushPrompt />
        </PostHogAnalytics>
      </body>
    </html>
  );
}
