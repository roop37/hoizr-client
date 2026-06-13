import type { Metadata } from "next";
import { BreadcrumbJsonLd } from "@/components/hoizr-ui/seo/JsonLd";
import VenueDetailClient from "@/components/hoizr-ui/VenueDetailClient";

export const metadata: Metadata = {
  title: "Venue on Hoizr",
  description:
    "Discover this venue on Hoizr — its upcoming nights, location, and gallery.",
  robots: { index: true, follow: true },
};

export const dynamic = "force-dynamic";

export default function VenuePage({ params }: { params: { id: string } }) {
  return (
    <div className="h-page">
      <BreadcrumbJsonLd
        items={[
          { name: "Hoizr", href: "/" },
          { name: "Venues", href: "/venues" },
        ]}
      />
      <VenueDetailClient id={params.id} />
    </div>
  );
}
