import type { Metadata } from "next";
import { OrdersClient } from "./OrdersClient";

export const metadata: Metadata = {
  title: "My orders",
  description: "Tickets and merch you've ordered through Hoizr.",
  robots: { index: false, follow: true },
};

export const dynamic = "force-dynamic";

export default function OrdersPage() {
  return <OrdersClient />;
}
