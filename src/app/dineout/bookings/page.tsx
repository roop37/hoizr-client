import { notFound } from "next/navigation";
import { DineoutBookings } from "@/components/dineout/DineoutBookings";

export const dynamic = "force-dynamic";

export default function DineoutBookingsPage() {
  if (process.env.NEXT_PUBLIC_SWIGGY_DINEOUT_ENABLED !== "true") {
    notFound();
  }
  return <DineoutBookings />;
}
