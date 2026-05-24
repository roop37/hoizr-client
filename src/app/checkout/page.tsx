import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutClient } from "./CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Review your tickets and complete payment securely.",
};

export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutClient />
    </Suspense>
  );
}
