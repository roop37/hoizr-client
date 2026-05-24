"use client";

import { Loader2 } from "lucide-react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { gqlRequest } from "@/lib/graphql";
import { useAuthStore } from "@/store/auth";

const CREATE_MERCH_ORDER = `
  mutation CreateArtistMerchOrder($input: CreateArtistMerchOrderInput!) {
    createArtistMerchOrder(input: $input) {
      order { _id totalAmount currency }
      checkout {
        razorpayOrderId
        razorpayKeyId
        amount
        currency
        orderId
      }
    }
  }
`;

const CONFIRM_MERCH_PAYMENT = `
  mutation ConfirmArtistMerchPayment($input: ConfirmArtistMerchPaymentInput!) {
    confirmArtistMerchPayment(input: $input) {
      _id
      status
    }
  }
`;

type RzpResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type Props = {
  merchId: string;
  itemName: string;
  price: number;
  currency: string;
  outOfStock?: boolean;
};

export const MerchBuyButton = ({
  merchId,
  itemName,
  price,
  currency,
  outOfStock,
}: Props) => {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const hydrated = useAuthStore((s) => s.hydrated);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buy = async () => {
    if (!profile) {
      router.push(
        `/login?next=${encodeURIComponent(window.location.pathname)}`
      );
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const data = await gqlRequest<{
        createArtistMerchOrder: {
          checkout: {
            razorpayOrderId: string;
            razorpayKeyId: string;
            amount: number;
            currency: string;
            orderId: string;
          };
        };
      }>(CREATE_MERCH_ORDER, {
        input: { merchId, quantity: 1 },
      });
      const co = data.createArtistMerchOrder.checkout;

      if (!window.Razorpay) {
        throw new Error("Razorpay SDK not loaded yet — retry in a second");
      }
      const rzp = new window.Razorpay({
        key: co.razorpayKeyId,
        order_id: co.razorpayOrderId,
        amount: Math.round(co.amount * 100),
        currency: co.currency,
        name: "Hoizr",
        description: itemName,
        handler: async (resp: RzpResponse) => {
          try {
            await gqlRequest(CONFIRM_MERCH_PAYMENT, {
              input: {
                razorpayOrderId: resp.razorpay_order_id,
                razorpayPaymentId: resp.razorpay_payment_id,
                razorpaySignature: resp.razorpay_signature,
              },
            });
            router.push("/orders");
          } catch (err: any) {
            setError(
              err?.response?.errors?.[0]?.message ??
                "Payment confirmation failed"
            );
          }
        },
        prefill: {
          name: `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim(),
          email: profile.email ?? "",
          contact: profile.phone ?? "",
        },
      });
      rzp.open();
    } catch (err: any) {
      setError(err?.response?.errors?.[0]?.message ?? err?.message ?? "Could not start checkout");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <button
        type="button"
        disabled={busy || !hydrated || outOfStock}
        onClick={buy}
        className="mt-2 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-dark text-xs font-semibold text-cream transition hover:opacity-95 disabled:opacity-50"
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : null}
        {outOfStock
          ? "Sold out"
          : `Buy · ${new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency,
              maximumFractionDigits: 0,
            }).format(price)}`}
      </button>
      {error ? (
        <p className="mt-1 text-[11px] text-red-600">{error}</p>
      ) : null}
    </>
  );
};
