"use client";

import {
  createGuestOrder,
  fetchOfflinePaymentLink,
  loadRazorpay,
  type OfflinePaymentLinkView,
} from "@/lib/guestCheckout";
import type { RazorpayPaymentResponse } from "@/types/razorpay";
import { CheckCircle2, Loader2, TicketCheck } from "lucide-react";
import { useEffect, useState } from "react";

const rupee = (n: number) =>
  `₹${(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

type Phase = "loading" | "ready" | "paying" | "paid" | "error";

export const OfflinePaymentClient = ({ shortCode }: { shortCode: string }) => {
  const [link, setLink] = useState<OfflinePaymentLinkView | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);

  // Prefilled, editable contact fields.
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    fetchOfflinePaymentLink(shortCode)
      .then((l) => {
        setLink(l);
        setFirstName(l.customerFirstName ?? "");
        setLastName(l.customerLastName ?? "");
        setEmail(l.customerEmail ?? "");
        setPhone(l.customerPhone ?? "");
        setPhase("ready");
      })
      .catch((e) => {
        setError(
          e?.response?.errors?.[0]?.message ?? "This link is no longer valid."
        );
        setPhase("error");
      });
  }, [shortCode]);

  const pay = async () => {
    if (!link) return;
    setError(null);
    setPhase("paying");
    try {
      const tickets = link.lines
        .filter((l) => !l.isExtra)
        .map((l) => ({ ticketId: l.itemId, quantity: l.quantity }));
      const extras = link.lines
        .filter((l) => l.isExtra)
        .map((l) => ({ extraId: l.itemId, quantity: l.quantity }));

      const res = await createGuestOrder({
        eventId: link.eventId,
        tickets,
        extras,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        notifyMe: true,
        offlineOrderId: link.offlineOrderId,
      });

      if (!res.checkout) {
        setPhase("paid");
        return;
      }
      const ready = await loadRazorpay();
      if (!ready || !window.Razorpay) {
        throw new Error("Couldn't load the payment window — please retry.");
      }
      const checkout = res.checkout;
      await new Promise<void>((resolve, reject) => {
        const rp = new window.Razorpay!({
          key: checkout.razorpayKeyId,
          amount: Math.round(checkout.amount * 100),
          currency: checkout.currency,
          name: "Hoizr",
          description: link.eventTitle ?? "Event ticket",
          order_id: checkout.razorpayOrderId,
          prefill: {
            name: `${firstName} ${lastName}`.trim(),
            email: email.trim(),
            contact: phone.trim(),
          },
          theme: { color: "#0F8842" },
          handler: (_r: RazorpayPaymentResponse) => {
            setPhase("paid");
            resolve();
          },
          modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
        });
        rp.open();
      });
    } catch (e: any) {
      const message =
        e?.response?.errors?.[0]?.message ??
        e?.message ??
        "Something went wrong. Please try again.";
      if (message === "Payment cancelled") {
        setPhase("ready");
        return;
      }
      setError(message);
      setPhase("ready");
    }
  };

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-4 py-8">
      {phase === "loading" ? (
        <div className="flex flex-col items-center gap-3 text-white/60">
          <Loader2 className="animate-spin" />
          <p className="text-sm">Loading your ticket…</p>
        </div>
      ) : phase === "error" ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
          <p className="text-base font-semibold text-white">Link unavailable</p>
          <p className="mt-1 text-sm text-white/55">{error}</p>
        </div>
      ) : phase === "paid" ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
          <CheckCircle2 size={44} className="mx-auto text-[#34d399]" />
          <h1 className="mt-3 text-lg font-semibold text-white">
            Payment received
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Your ticket for{" "}
            <span className="text-white/80">{link?.eventTitle}</span> is on its
            way to <span className="text-white/80">{email}</span>.
          </p>
        </div>
      ) : link?.alreadyPaid ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
          <CheckCircle2 size={40} className="mx-auto text-[#34d399]" />
          <p className="mt-3 text-base font-semibold text-white">
            This link is already paid
          </p>
          <p className="mt-1 text-sm text-white/55">
            Your ticket has been emailed. Log in with your number to view it.
          </p>
        </div>
      ) : link?.expired ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
          <p className="text-base font-semibold text-white">Link expired</p>
          <p className="mt-1 text-sm text-white/55">
            Ask the organiser to send a fresh payment link.
          </p>
        </div>
      ) : link ? (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          {link.eventFlyer ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={link.eventFlyer}
              alt={link.eventTitle ?? "Event"}
              className="h-40 w-full object-cover"
            />
          ) : null}
          <div className="p-5">
            <div className="flex items-center gap-2 text-[var(--h-accent)]">
              <TicketCheck size={16} />
              <span className="text-xs font-semibold uppercase tracking-wide">
                Complete your booking
              </span>
            </div>
            <h1 className="mt-1 text-lg font-semibold text-white">
              {link.eventTitle}
            </h1>

            <div className="mt-4 space-y-1.5">
              {link.lines.map((l) => (
                <div
                  key={l.itemId}
                  className="flex justify-between text-sm text-white/70"
                >
                  <span>
                    {l.name} × {l.quantity}
                  </span>
                  <span>{rupee(l.unitPrice * l.quantity)}</span>
                </div>
              ))}
              <div className="mt-2 flex justify-between border-t border-white/10 pt-2 text-sm font-semibold text-white">
                <span>Total</span>
                <span>{rupee(link.amountTotal)}</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <Input value={firstName} onChange={setFirstName} placeholder="First name" />
              <Input value={lastName} onChange={setLastName} placeholder="Last name" />
            </div>
            <div className="mt-2.5">
              <Input value={email} onChange={setEmail} placeholder="Email" type="email" />
            </div>
            <div className="mt-2.5">
              <Input value={phone} onChange={setPhone} placeholder="Phone" type="tel" />
            </div>

            {error ? (
              <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {error}
              </p>
            ) : null}

            <button
              type="button"
              disabled={phase === "paying" || phone.trim().length < 8}
              onClick={pay}
              className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--h-accent)] text-sm font-semibold text-[#0a0a0e] disabled:opacity-50"
            >
              {phase === "paying" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : null}
              Pay {rupee(link.amountTotal)}
            </button>
            <p className="mt-2 text-center text-[11px] text-white/40">
              Secured by Razorpay.
            </p>
          </div>
        </div>
      ) : null}
    </main>
  );
};

const Input = ({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) => (
  <input
    type={type}
    value={value}
    placeholder={placeholder}
    onChange={(e) => onChange(e.target.value)}
    className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none transition focus:border-[var(--h-accent)]/60 placeholder:text-white/40"
  />
);

export default OfflinePaymentClient;
