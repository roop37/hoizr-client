import { OfflinePaymentClient } from "./OfflinePaymentClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Complete your booking · Hoizr",
};

export default function OfflinePaymentLinkPage({
  params,
}: {
  params: { shortCode: string };
}) {
  return <OfflinePaymentClient shortCode={params.shortCode} />;
}
