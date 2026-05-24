import type { Metadata } from "next";
import { OrderDetailClient } from "./OrderDetailClient";

export const metadata: Metadata = {
  title: "Order details",
};

export const dynamic = "force-dynamic";

export default function OrderDetailPage({
  params,
}: {
  params: { orderId: string };
}) {
  return <OrderDetailClient orderId={params.orderId} />;
}
