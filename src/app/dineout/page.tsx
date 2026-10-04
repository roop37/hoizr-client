import { Suspense } from "react";
import { notFound } from "next/navigation";
import { DineoutClient } from "@/components/dineout/DineoutClient";

export const dynamic = "force-dynamic";

export default function DineoutPage() {
  // Dev-only until Swiggy production access is granted. Flip
  // NEXT_PUBLIC_SWIGGY_DINEOUT_ENABLED on only then (spec §11).
  if (process.env.NEXT_PUBLIC_SWIGGY_DINEOUT_ENABLED !== "true") {
    notFound();
  }
  // DineoutClient reads useSearchParams (?swiggy=… / ?lat=&lng=) — must sit
  // under a Suspense boundary or `next build` fails (repo convention, cf.
  // checkout/page.tsx).
  return (
    <Suspense fallback={null}>
      <DineoutClient />
    </Suspense>
  );
}
