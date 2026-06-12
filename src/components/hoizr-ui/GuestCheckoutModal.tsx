"use client";

import {
  createGuestOrder,
  loadRazorpay,
  type GuestCheckoutInput,
} from "@/lib/guestCheckout";
import { clearActiveCart } from "@/lib/active-cart";
import { track } from "@/lib/tracker";
import type { RazorpayPaymentResponse } from "@/types/razorpay";
import { CheckCircle2, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  tickets: { ticketId: string; quantity: number }[];
  extras: { extraId: string; quantity: number }[];
  /** Fall back to the login flow (existing checkout page) instead. */
  onLoginInstead: () => void;
};

type Phase = "form" | "submitting" | "paid";

export const GuestCheckoutModal = ({
  open,
  onClose,
  eventId,
  eventTitle,
  tickets,
  extras,
  onLoginInstead,
}: Props) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const notifyMe = true;
  const [phase, setPhase] = useState<Phase>("form");
  const [error, setError] = useState<string | null>(null);
  const [accountNote, setAccountNote] = useState<string | null>(null);
  const [paidEmail, setPaidEmail] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [resultMeta, setResultMeta] = useState<{
    loggedIn: boolean;
    accountFound: boolean;
    orderId: string;
  } | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase !== "submitting") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, phase, onClose]);

  if (!open || !mounted) return null;

  const valid =
    firstName.trim() &&
    lastName.trim() &&
    /\S+@\S+\.\S+/.test(email.trim()) &&
    /^\d{10}$/.test(phone.trim());

  const finishPaid = (emailTo: string) => {
    setPaidEmail(emailTo);
    setPhase("paid");
  };

  const submit = async () => {
    if (!valid || phase === "submitting") return;
    setError(null);
    setAccountNote(null);
    setPhase("submitting");
    try {
      const input: GuestCheckoutInput = {
        eventId,
        tickets,
        extras,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        notifyMe,
      };
      const res = await createGuestOrder(input);
      setResultMeta({
        loggedIn: res.loggedIn,
        accountFound: res.accountFound,
        orderId: res.order._id,
      });

      if (res.accountFound && res.accountEmail) {
        setAccountNote(
          `We found your Hoizr account (${res.accountEmail}). Your receipt goes to both emails.`
        );
      }

      // Free event → no Razorpay leg; order is already confirmed.
      if (!res.checkout) {
        track("checkoutCompleted", {
          eventId,
          orderId: res.order._id,
          metadata: { guest: true, free: true },
        });
        clearActiveCart();
        finishPaid(email.trim());
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
          description: eventTitle,
          order_id: checkout.razorpayOrderId,
          prefill: {
            name: `${firstName} ${lastName}`.trim(),
            email: email.trim(),
            contact: phone.trim(),
          },
          theme: { color: "#0F8842" },
          // Handler firing = payment in flight; the webhook finalises the
          // order + emails the ticket. We never call an authed confirm here
          // (guest has no session) and never block on it — just show success.
          handler: (_response: RazorpayPaymentResponse) => {
            track("checkoutCompleted", {
              eventId,
              orderId: res.order._id,
              metadata: { guest: true },
            });
            clearActiveCart();
            finishPaid(email.trim());
            resolve();
          },
          modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
        });
        rp.open();
      });
    } catch (err: any) {
      const message =
        err?.response?.errors?.[0]?.message ??
        err?.message ??
        "Something went wrong. Please try again.";
      if (message === "Payment cancelled") {
        setPhase("form");
        return;
      }
      setError(message);
      setPhase("form");
    }
  };

  return createPortal(
    <div className="h-auth-sheet-overlay" role="dialog" aria-modal="true" onClick={phase === "submitting" ? undefined : onClose}>
      <div className="h-auth-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="h-auth-sheet-handle" aria-hidden />
        {phase !== "submitting" ? (
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="h-auth-sheet-close"
          >
            <X size={16} strokeWidth={2.2} />
          </button>
        ) : null}
        <div className="h-auth-sheet-body">
          {phase === "paid" ? (
            <div className="flex flex-col items-center py-4 text-center">
              <CheckCircle2 size={44} className="text-[#34d399]" />
              <h2 className="mt-3 text-lg font-semibold text-white">
                Payment received
              </h2>
              <p className="mt-1 text-sm text-white/60">
                Your ticket for <span className="text-white/80">{eventTitle}</span>{" "}
                is on its way to <span className="text-white/80">{paidEmail}</span>.
                {resultMeta?.loggedIn
                  ? " You're signed in — find it anytime under My tickets."
                  : resultMeta?.accountFound
                  ? " This number already has a Hoizr account — log in to see it."
                  : " Log in with this number anytime to see it in the app."}
              </p>
              {resultMeta?.loggedIn && resultMeta.orderId ? (
                <button
                  type="button"
                  onClick={() =>
                    window.location.assign(`/orders/${resultMeta.orderId}`)
                  }
                  className="mt-5 h-11 w-full rounded-xl bg-[var(--h-accent)] text-sm font-semibold text-[#0a0a0e]"
                >
                  View my ticket
                </button>
              ) : resultMeta?.accountFound && resultMeta.orderId ? (
                <button
                  type="button"
                  onClick={() =>
                    window.location.assign(
                      `/login?next=/orders/${resultMeta.orderId}`
                    )
                  }
                  className="mt-5 h-11 w-full rounded-xl bg-[var(--h-accent)] text-sm font-semibold text-[#0a0a0e]"
                >
                  Log in to see ticket
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-5 h-11 w-full rounded-xl bg-[var(--h-accent)] text-sm font-semibold text-[#0a0a0e]"
                >
                  Done
                </button>
              )}
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-white">
                Your details
              </h2>
              <p className="mt-0.5 text-sm text-white/55">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={onLoginInstead}
                  className="font-semibold text-[var(--h-accent)] underline"
                >
                  Log in
                </button>
                .
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <Input placeholder="First name" value={firstName} onChange={setFirstName} />
                <Input placeholder="Last name" value={lastName} onChange={setLastName} />
              </div>
              <div className="mt-2.5">
                <Input type="email" placeholder="Email" value={email} onChange={setEmail} />
              </div>
              <div className="mt-2.5">
                <Input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="Phone (10-digit mobile)"
                  value={phone}
                  onChange={(v) => setPhone(v.replace(/\D/g, "").slice(0, 10))}
                />
              </div>

              <p className="mt-3 text-xs leading-relaxed text-white/50">
                By continuing, you agree to Hoizr&apos;s{" "}
                <a
                  href="https://business.hoizr.com/legal/terms"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-white/75 underline"
                >
                  Terms
                </a>{" "}
                &amp;{" "}
                <a
                  href="https://business.hoizr.com/legal/privacy"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-white/75 underline"
                >
                  Privacy Policy
                </a>{" "}
                — we&apos;ll create your account so your tickets are saved.
              </p>

              {accountNote ? (
                <p className="mt-3 rounded-lg border border-[var(--h-accent)]/30 bg-[var(--h-accent)]/10 px-3 py-2 text-xs text-white/80">
                  {accountNote}
                </p>
              ) : null}
              {error ? (
                <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {error}
                </p>
              ) : null}

              <button
                type="button"
                disabled={!valid || phase === "submitting"}
                onClick={submit}
                className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--h-accent)] text-sm font-semibold text-[#0a0a0e] disabled:opacity-50"
              >
                {phase === "submitting" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : null}
                Continue to payment
              </button>
              <p className="mt-2 text-center text-[11px] text-white/40">
                Secured by Razorpay.
              </p>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

const Input = ({
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  inputMode?: "numeric" | "tel" | "email" | "text";
  maxLength?: number;
}) => (
  <input
    type={type}
    inputMode={inputMode}
    maxLength={maxLength}
    value={value}
    placeholder={placeholder}
    onChange={(e) => onChange(e.target.value)}
    className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none transition focus:border-[var(--h-accent)]/60 placeholder:text-white/40"
  />
);

export default GuestCheckoutModal;
