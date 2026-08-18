import { notFound } from "next/navigation";
import { DineoutRestaurantDetail } from "@/components/dineout/DineoutRestaurantDetail";

export const dynamic = "force-dynamic";

export default function DineoutRestaurantPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: {
    lat?: string;
    lng?: string;
    name?: string;
    date?: string;
    doorsAt?: string;
  };
}) {
  if (process.env.NEXT_PUBLIC_SWIGGY_DINEOUT_ENABLED !== "true") {
    notFound();
  }
  const lat = Number(searchParams.lat);
  const lng = Number(searchParams.lng);
  // Details + slots require the SAME coordinates used in search; without them
  // we can't call Swiggy, so send the user back to search.
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    notFound();
  }
  const doorsAt = Number(searchParams.doorsAt);
  return (
    <DineoutRestaurantDetail
      restaurantId={decodeURIComponent(params.id)}
      lat={lat}
      lng={lng}
      fallbackName={searchParams.name}
      initialDate={searchParams.date}
      doorsAt={Number.isFinite(doorsAt) ? doorsAt : undefined}
    />
  );
}
