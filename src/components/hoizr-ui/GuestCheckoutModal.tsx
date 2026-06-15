"use client";

import {
  createGuestOrder,
  loadRazorpay,
  type GuestCheckoutInput,
} from "@/lib/guestCheckout";
import { clearActiveCart } from "@/lib/active-cart";
import { gqlRequest } from "@/lib/graphql";
import {
  PREVIEW_COUPON_QUERY,
  REQUEST_OTP_MUTATION,
  VERIFY_OTP_MUTATION,
} from "@/lib/queries";
import type { CouponPreview } from "@/types/order";
import { rupee } from "@/lib/format";
import type { RazorpayPaymentResponse } from "@/types/razorpay";
import { CheckCircle2, Loader2, ShieldCheck, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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

type Phase = "form" | "otp-pending" | "verified" | "submitting" | "paid";

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
  const [promoInput, setPromoInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponPreview | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [resultMeta, setResultMeta] = useState<{
    loggedIn: boolean;
    accountFound: boolean;
    orderId: string;
  } | null>(null);

  // OTP state
  const [otpId, setOtpId] = useState("");
  const [otpDigits, setOtpDigits] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase !== "submitting") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, phase, onClose]);

  // Auto-focus OTP input when entering OTP phase
  useEffect(() => {
    if (phase === "otp-pending") {
      setTimeout(() => otpInputRef.current?.focus(), 100);
    }
  }, [phase]);

  if (!open || !mounted) return null;

  const formValid =
    firstName.trim() &&
    lastName.trim() &&
    /\S+@\S+\.\S+/.test(email.trim()) &&
    /^\d{10}$/.test(phone.trim());

  const finishPaid = (emailTo: string) => {
    setPaidEmail(emailTo);
    setPhase("paid");
  };

  const applyPromo = async () => {
    const code = promoInput.trim();
    if (!code) return;
    setCouponBusy(true);
    setCouponError(null);
    try {
      const data = await gqlRequest<{ previewCoupon: CouponPreview }>(
        PREVIEW_COUPON_QUERY,
        { input: { eventId, couponCode: code, tickets } }
      );
      const preview = data.previewCoupon;
      if (!preview.ok) {
        setAppliedCoupon(null);
        setCouponError(preview.reason ?? "That promo code can't be applied.");
        return;
      }
      setAppliedCoupon(preview);
      setPromoInput(preview.code);
    } catch (err: any) {
      setAppliedCoupon(null);
      setCouponError(
        err?.response?.errors?.[0]?.message ?? "Unable to check this code."
      );
    } finally {
      setCouponBusy(false);
    }
  };

  const sendOtp = async () => {
    if (!formValid || otpBusy) return;
    setOtpError(null);
    setOtpBusy(true);
    try {
      const data = await gqlRequest<{
        customerRequestOtp: { otpId: string; profileRequired: boolean };
      }>(REQUEST_OTP_MUTATION, { input: { phone: `+91${phone.trim()}` } });
      setOtpId(data.customerRequestOtp.otpId);
      setOtpDigits("");
      setPhase("otp-pending");
    } catch (err: any) {
      setOtpError(
        err?.response?.errors?.[0]?.message ?? "Unable to send OTP. Please try again."
      );
    } finally {
      setOtpBusy(false);
    }
  };

  const verifyOtp = async (digits: string) => {
    if (otpBusy || digits.length < 6) return;
    setOtpError(null);
    setOtpBusy(true);
    try {
      await gqlRequest(VERIFY_OTP_MUTATION, {
        input: {
          phone: `+91${phone.trim()}`,
          otpId,
          otp: digits,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
        },
      });
      setPhase("verified");
    } catch (err: any) {
      setOtpError(
        err?.response?.errors?.[0]?.message ?? "Invalid OTP. Please try again."
      );
      setOtpDigits("");
    } finally {
      setOtpBusy(false);
    }
  };

  const handleOtpChange = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 6);
    setOtpDigits(digits);
    if (digits.length === 6) verifyOtp(digits);
  };

  const submit = async () => {
    if (phase === "submitting") return;
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
        couponCode: appliedCoupon?.ok ? appliedCoupon.code : undefined,
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

      if (!res.checkout) {
        // Free guest order — finalized server-side (emits `orderPlaced`).
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
          handler: (_response: RazorpayPaymentResponse) => {
            // Conversion is recorded server-side as `orderPlaced`.
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
        setPhase("verified");
        return;
      }
      setError(message);
      setPhase("verified");
    }
  };

  return createPortal(
    <div
      className="h-auth-sheet-overlay"
      role="dialog"
      aria-modal="true"
      onClick={phase === "submitting" ? undefined : onClose}
    >
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
          {/* ── Success ── */}
          {phase === "paid" ? (
            <div className="flex flex-col items-center py-4 text-center">
              <CheckCircle2 size={44} className="text-[#34d399]" />
              <h2 className="mt-3 text-lg font-semibold text-white">
                Payment received
              </h2>
              <p className="mt-1 text-sm text-white/60">
                Your ticket for <span className="text-white/80">{eventTitle}</span>{" "}
                is on its way to <span className="text-white/80">{paidEmail}</span>.
                {resultMeta?.accountFound
                  ? " We found your account and signed you in."
                  : " You're signed in — find it anytime under My tickets."}
              </p>
              {resultMeta?.orderId ? (
                <button
                  type="button"
                  onClick={() =>
                    window.location.assign(
                      `/orders/${resultMeta.orderId}?just_paid=1`
                    )
                  }
                  className="mt-5 h-11 w-full rounded-xl bg-[var(--h-accent)] text-sm font-semibold text-[#0a0a0e]"
                >
                  View my ticket
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
          ) : phase === "otp-pending" ? (
            /* ── OTP entry ── */
            <>
              <h2 className="text-lg font-semibold text-white">Verify your number</h2>
              <p className="mt-0.5 text-sm text-white/55">
                6-digit OTP sent to +91 {phone.trim()}
              </p>

              <div className="mt-4">
                <input
                  ref={otpInputRef}
                  inputMode="numeric"
                  maxLength={6}
                  value={otpDigits}
                  onChange={(e) => handleOtpChange(e.target.value)}
                  disabled={otpBusy}
                  placeholder="_ _ _ _ _ _"
                  className="h-14 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-center text-2xl tracking-[0.5em] text-white outline-none transition focus:border-[var(--h-accent)]/60 disabled:opacity-50 placeholder:text-white/20"
                />
              </div>

              {otpBusy ? (
                <div className="mt-3 flex items-center justify-center gap-2 text-sm text-white/50">
                  <Loader2 size={14} className="animate-spin" />
                  Verifying…
                </div>
              ) : null}

              {otpError ? (
                <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {otpError}
                </p>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  setOtpDigits("");
                  setOtpError(null);
                  setPhase("form");
                }}
                className="mt-3 text-xs font-semibold text-[var(--h-accent)] underline"
              >
                Change number
              </button>
            </>
          ) : (
            /* ── Form / Verified ── */
            <>
              {phase === "verified" ? (
                /* Verified identity strip */
                <div className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-[var(--h-accent)]/30 bg-[var(--h-accent)]/[0.08] px-3.5 py-3">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck
                      size={18}
                      className="mt-0.5 shrink-0 text-[var(--h-accent)]"
                    />
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {firstName.trim()} {lastName.trim()}
                      </p>
                      <p className="mt-0.5 text-xs text-white/55">
                        +91 {phone.trim()} · {email.trim()}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPhase("form");
                      setOtpDigits("");
                      setOtpError(null);
                    }}
                    className="shrink-0 text-xs font-semibold text-white/55 underline"
                  >
                    Edit
                  </button>
                </div>
              ) : (
                /* Contact details form */
                <>
                  <h2 className="text-lg font-semibold text-white">Your details</h2>
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
                    <Input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={setEmail}
                    />
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

                  {otpError ? (
                    <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                      {otpError}
                    </p>
                  ) : null}
                </>
              )}

              {/* Promo code — shown in both form and verified phases */}
              {appliedCoupon?.ok ? (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-[#9CCB3B]/30 bg-[#9CCB3B]/10 px-3 py-2 text-xs">
                  <span className="text-white/85">
                    <span className="font-semibold text-[#9CCB3B]">
                      {appliedCoupon.code}
                    </span>{" "}
                    applied — you save {rupee(appliedCoupon.discountAmount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedCoupon(null);
                      setPromoInput("");
                      setCouponError(null);
                    }}
                    className="font-medium text-white/60 underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="mt-3">
                  <div className="flex items-center gap-2">
                    <input
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          applyPromo();
                        }
                      }}
                      placeholder="Promo code"
                      disabled={couponBusy || phase === "submitting"}
                      className="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm uppercase tracking-wide text-white outline-none transition focus:border-[var(--h-accent)]/60 placeholder:normal-case placeholder:tracking-normal placeholder:text-white/40"
                    />
                    <button
                      type="button"
                      onClick={applyPromo}
                      disabled={couponBusy || phase === "submitting" || !promoInput.trim()}
                      className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.06] px-4 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {couponBusy ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        "Apply"
                      )}
                    </button>
                  </div>
                  {couponError ? (
                    <p className="mt-1.5 text-xs text-red-300">{couponError}</p>
                  ) : null}
                </div>
              )}

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

              {phase === "verified" ? (
                <button
                  type="button"
                  onClick={submit}
                  className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--h-accent)] text-sm font-semibold text-[#0a0a0e]"
                >
                  Continue to payment
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!formValid || otpBusy}
                  onClick={sendOtp}
                  className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--h-accent)] text-sm font-semibold text-[#0a0a0e] disabled:opacity-50"
                >
                  {otpBusy ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : null}
                  Verify phone number
                </button>
              )}
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
