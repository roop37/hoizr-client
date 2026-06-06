import type { Metadata } from "next";
import { SupportClient } from "./SupportClient";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Create a support ticket. The Hoizr team replies within one business day.",
};

export const dynamic = "force-dynamic";

export default function SupportPage() {
  return <SupportClient />;
}
