"use client";

import {
  fetchOfflinePaymentLink,
  type OfflinePaymentLinkView,
} from "@/lib/offline-link";
import { gqlRequest } from "@/lib/graphql";
import { SET_CART_MUTATION } from "@/lib/queries";
import type { CartResponse } from "@/types/order";
import { useAuthStore } from "@/store/auth";
import { AuthSheet } from "@/components/auth/AuthSheet";
import { HoizrLogo } from "@/components/hoizr-ui/HoizrLogo";
import { CheckCircle2, Loader2, LogIn, ShieldCheck, TicketCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const rupee = (n: number) =>
  `₹${(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

type Phase = "loading" | "ready" | "paying" | "error";

export const OfflinePaymentClient = ({ shortCode }: { shortCode: string }) => {
  const router = useRouter();
  // Guest checkout was removed — paying an offline link requires login like
  // every other order. We seed the cart for the logged-in customer then hand
  // off to the normal authed /checkout (which carries offlineOrderId through
  // createOrder → Razorpay → confirm).
  const profile = useAuthStore((s) => s.profile);
  const hydrated = useAuthStore((s) => s.hydrated);
  const hydrate = useAuthStore((s) => s.hydrate);

  const [link, setLink] = useState<OfflinePaymentLinkView | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);
  // Inline sign-in (prefilled from the link) instead of bouncing to /login —
  // keeps the resolved link mounted (offlineOrderId never at risk) and avoids
  // putting the customer's phone in the URL. After auth we auto-continue to pay.
  const [authOpen, setAuthOpen] = useState(false);
  const [payAfterAuth, setPayAfterAuth] = useState(false);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    fetchOfflinePaymentLink(shortCode)
      .then((l) => {
        setLink(l);
        setPhase("ready");
      })
      .catch((e) => {
        setError(
          e?.response?.errors?.[0]?.message ?? "This link is no longer valid."
        );
        setPhase("error");
      });
  }, [shortCode]);

  const signInToPay = () => {
    // Open the prefilled inline auth sheet (was a /login redirect that dropped
    // the customer's known phone and left the OTP form blank/confusing).
    setAuthOpen(true);
  };

  // After the customer signs in via the inline sheet, re-hydrate the auth store
  // and auto-continue to pay (they clicked "Sign in to pay" — one intent).
  const handleAuthenticated = async () => {
    setAuthOpen(false);
    useAuthStore.setState({ hydrated: false });
    await hydrate();
    setPayAfterAuth(true);
  };

  useEffect(() => {
    if (payAfterAuth && profile && link) {
      setPayAfterAuth(false);
      void pay();
    }
    // pay() reads the latest link/profile from closure; we only want to fire
    // this once profile lands after auth.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payAfterAuth, profile, link]);

  const pay = async () => {
    if (!link) return;
    if (!profile) {
      signInToPay();
      return;
    }
    setError(null);
    setPhase("paying");
    try {
      const tickets = link.lines
        .filter((l) => !l.isExtra)
        .map((l) => ({ ticketId: l.itemId, quantity: l.quantity }));
      const extras = link.lines
        .filter((l) => l.isExtra)
        .map((l) => ({ extraId: l.itemId, quantity: l.quantity }));

      // Seed the logged-in customer's cart with the host-locked lines, then
      // hand off to the authed checkout carrying the offlineOrderId so the
      // order links back to this payment link.
      await gqlRequest<{ setCart: CartResponse }>(SET_CART_MUTATION, {
        input: { eventId: link.eventId, tickets, extras },
      });
      router.push(
        `/checkout?eventId=${link.eventId}&offlineOrderId=${link.offlineOrderId}`
      );
    } catch (e: any) {
      const message =
        e?.response?.errors?.[0]?.message ??
        e?.message ??
        "Something went wrong. Please try again.";
      setError(message);
      setPhase("ready");
    }
  };

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-4 py-8">
      <div className="mb-5 flex items-center justify-between">
        <HoizrLogo size="small" href="/" />
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-white/45">
          <ShieldCheck size={13} className="text-[var(--h-accent)]" />
          Secure checkout
        </span>
      </div>
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

            {error ? (
              <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {error}
              </p>
            ) : null}

            {!hydrated ? (
              <div className="mt-4 flex h-12 items-center justify-center">
                <Loader2 size={16} className="animate-spin text-white/50" />
              </div>
            ) : profile ? (
              <button
                type="button"
                disabled={phase === "paying"}
                onClick={pay}
                className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--h-accent)] text-sm font-semibold text-[#0a0a0e] disabled:opacity-50"
              >
                {phase === "paying" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <TicketCheck size={16} />
                )}
                Continue to pay {rupee(link.amountTotal)}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={signInToPay}
                  className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--h-accent)] text-sm font-semibold text-[#0a0a0e]"
                >
                  <LogIn size={16} />
                  Sign in to pay {rupee(link.amountTotal)}
                </button>
                <p className="mt-2 text-center text-[11px] text-white/45">
                  Sign in with your phone to pay securely and get your ticket.
                </p>
              </>
            )}
            <p className="mt-2 text-center text-[11px] text-white/40">
              Secured by Razorpay.
            </p>
          </div>
        </div>
      ) : null}

      <AuthSheet
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthenticated={handleAuthenticated}
        headline="Sign in to get your ticket"
        subheadline="We've prefilled the number this link was sent to — edit it if you'd rather use another."
        initialPhone={link?.customerPhone ?? undefined}
        initialFirstName={link?.customerFirstName ?? undefined}
        initialLastName={link?.customerLastName ?? undefined}
        initialEmail={link?.customerEmail ?? undefined}
      />
    </main>
  );
};

export default OfflinePaymentClient;
