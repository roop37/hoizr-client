"use client";

import { CheckCircle2, AlertCircle, Phone as PhoneIcon } from "lucide-react";
import type { ReactNode } from "react";

export type CollisionModalKind =
  | "linked-existing-by-email"
  | "linked-as-secondary"
  | "phone-account-full"
  | "email-used-elsewhere";

type CollisionModalProps = {
  kind: CollisionModalKind;
  primaryEmailMasked?: string;
  secondaryEmail?: string;
  onClose: () => void;
};

const COPY: Record<
  CollisionModalKind,
  {
    icon: ReactNode;
    tone: "info" | "warn";
    title: string;
    body: (ctx: { primaryEmailMasked?: string; secondaryEmail?: string }) =>
      ReactNode;
    cta: string;
  }
> = {
  "linked-existing-by-email": {
    icon: <CheckCircle2 className="text-emerald-600" size={28} />,
    tone: "info",
    title: "Welcome back",
    body: () => (
      <p className="text-sm leading-6 text-muted">
        Your Google email is already linked to a Hoizr account, so we connected
        this sign-in to it. You can keep signing in with Google or phone OTP —
        either lands you in the same account.
      </p>
    ),
    cta: "Continue",
  },
  "linked-as-secondary": {
    icon: <CheckCircle2 className="text-emerald-600" size={28} />,
    tone: "info",
    title: "Phone already in use — we linked this sign-in",
    body: ({ primaryEmailMasked, secondaryEmail }) => (
      <div className="space-y-2 text-sm leading-6 text-muted">
        <p>
          This phone number already belongs to a Hoizr account
          {primaryEmailMasked ? (
            <>
              {" "}
              registered with <strong>{primaryEmailMasked}</strong>
            </>
          ) : null}
          . We saved your Google email
          {secondaryEmail ? (
            <>
              {" "}
              (<strong>{secondaryEmail}</strong>)
            </>
          ) : null}{" "}
          as a secondary contact on that account and signed you in.
        </p>
        <p>
          You can now sign in with either Google or phone OTP — both lead to the
          same account.
        </p>
      </div>
    ),
    cta: "Continue",
  },
  "phone-account-full": {
    icon: <PhoneIcon className="text-amber-600" size={28} />,
    tone: "warn",
    title: "This phone is already linked to a full account",
    body: () => (
      <div className="space-y-2 text-sm leading-6 text-muted">
        <p>
          The phone number you entered is already linked to a Hoizr account that
          has both a primary and a secondary email on file. We can't add a
          third sign-in method without overwriting one.
        </p>
        <p>
          If this is your number, sign in with phone OTP to reach that account.
          Otherwise, use a different phone number to continue with Google.
        </p>
      </div>
    ),
    cta: "Got it",
  },
  "email-used-elsewhere": {
    icon: <AlertCircle className="text-amber-600" size={28} />,
    tone: "warn",
    title: "This email belongs to another Hoizr account",
    body: () => (
      <p className="text-sm leading-6 text-muted">
        Your sign-in email is already attached to a different Hoizr account
        (different phone number). Please sign in to that account directly, or
        use a different email.
      </p>
    ),
    cta: "Try again",
  },
};

export const CollisionModal = ({
  kind,
  primaryEmailMasked,
  secondaryEmail,
  onClose,
}: CollisionModalProps) => {
  const copy = COPY[kind];
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="collision-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-cream p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="shrink-0">{copy.icon}</div>
          <div className="flex-1">
            <h2
              id="collision-modal-title"
              className="text-base font-semibold text-ink"
            >
              {copy.title}
            </h2>
            <div className="mt-2">
              {copy.body({ primaryEmailMasked, secondaryEmail })}
            </div>
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-xl bg-dark px-5 text-sm font-semibold text-cream transition hover:opacity-95"
          >
            {copy.cta}
          </button>
        </div>
      </div>
    </div>
  );
};
