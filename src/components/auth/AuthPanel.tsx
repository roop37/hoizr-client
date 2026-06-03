"use client";

import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { ArrowLeft, ArrowRight, Loader2, Phone, ShieldCheck } from "lucide-react";
import { useCallback, useState } from "react";
import { sdk } from "@/lib/sdk";
import { CustomerAuthErrorCode } from "@/types/auth";
import type {
  CustomerGoogleStartResponse,
  CustomerPendingSignupVerifyResponse,
} from "@/types/auth";
import {
  CollisionModal,
  type CollisionModalKind,
} from "./CollisionModal";

type Step = "choose" | "phone" | "phone-otp" | "pending-phone" | "pending-otp";

type AuthPanelProps = {
  onAuthenticated: () => void | Promise<void>;
  // Optional eyebrow / contextual heading rendered above the panel.
  // The /checkout modal passes "Sign in to complete your booking"; the
  // /login page leaves it default.
  headline?: string;
  subheadline?: string;
};

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID ?? "";

const sanitisePhone = (value: string) => {
  let trimmed = value.replace(/\s+/g, "").replace(/-/g, "");
  if (!trimmed) return "";
  if (!trimmed.startsWith("+")) {
    if (trimmed.length === 10) trimmed = `+91${trimmed}`;
    else trimmed = `+${trimmed.replace(/^\+/, "")}`;
  }
  return trimmed;
};

const errorCodeFrom = (err: unknown): string | undefined => {
  const props = (err as { response?: { errors?: Array<{ extensions?: { code?: string }; code?: string }> } })
    ?.response?.errors?.[0];
  // Mercurius surfaces ErrorWithProps' extras at the top level alongside
  // `message`, not under `extensions` — try both for resilience.
  return (
    (props as { extensions?: { code?: string } } | undefined)?.extensions
      ?.code ??
    (props as { code?: string } | undefined)?.code
  );
};

const errorMessageFrom = (err: unknown, fallback: string): string => {
  const props = (err as { response?: { errors?: Array<{ message?: string }> } })
    ?.response?.errors?.[0];
  return props?.message ?? (err as Error)?.message ?? fallback;
};

const AuthPanelInner = ({
  onAuthenticated,
  headline,
  subheadline,
}: AuthPanelProps) => {
  const [step, setStep] = useState<Step>("choose");
  const [phoneInput, setPhoneInput] = useState("");
  const [otp, setOtp] = useState("");
  const [otpId, setOtpId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [profileRequired, setProfileRequired] = useState(false);
  const [pendingToken, setPendingToken] = useState<string>("");
  const [pendingPicture, setPendingPicture] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<{
    kind: CollisionModalKind;
    primaryEmailMasked?: string;
    secondaryEmail?: string;
  } | null>(null);

  const phone = sanitisePhone(phoneInput);

  const finishWithModal = useCallback(
    (modalState: typeof modal) => {
      setModal(modalState);
    },
    []
  );

  const handleGoogleCredential = async (credential: string) => {
    setError(null);
    setLoading(true);
    try {
      const data = await sdk.CustomerGoogleStart({ input: { idToken: credential } });
      const res = data.customerGoogleStart as CustomerGoogleStartResponse;

      if (res.outcome === "LOGGED_IN") {
        await onAuthenticated();
        return;
      }

      if (res.outcome === "LINKED_EXISTING_BY_EMAIL") {
        finishWithModal({ kind: "linked-existing-by-email" });
        return;
      }

      // PENDING_PHONE_REQUIRED → switch into the phone step
      setPendingToken(res.pendingToken ?? "");
      setFirstName(res.prefill?.firstName ?? "");
      setLastName(res.prefill?.lastName ?? "");
      setEmail(res.prefill?.email ?? "");
      setPendingPicture(res.prefill?.picture);
      setStep("pending-phone");
    } catch (err) {
      const code = errorCodeFrom(err);
      if (code === CustomerAuthErrorCode.GOOGLE_EMAIL_NOT_VERIFIED) {
        setError(
          "Your Google email isn't verified yet. Verify it with Google and try again."
        );
      } else {
        setError(
          errorMessageFrom(err, "Google sign-in failed. Please try again.")
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const requestPhoneOtp = async () => {
    setError(null);
    if (!/^\+\d{10,14}$/.test(phone)) {
      setError("Enter a valid phone number with country code");
      return;
    }
    setLoading(true);
    try {
      const data = await sdk.CustomerRequestOtp({ input: { phone } });
      setOtpId(data.customerRequestOtp.otpId);
      setProfileRequired(Boolean(data.customerRequestOtp.profileRequired));
      setOtp("");
      if (!data.customerRequestOtp.profileRequired) {
        setFirstName("");
        setLastName("");
        setEmail("");
      }
      setStep("phone-otp");
    } catch (err) {
      setError(errorMessageFrom(err, "Unable to send OTP"));
    } finally {
      setLoading(false);
    }
  };

  const verifyPhoneOtp = async () => {
    setError(null);
    if (otp.length < 4) {
      setError("Enter the 6-digit OTP we just sent you");
      return;
    }
    if (
      profileRequired &&
      (!firstName.trim() || !lastName.trim() || !email.trim())
    ) {
      setError("Please add your name and email to create your account.");
      return;
    }
    setLoading(true);
    try {
      await sdk.CustomerVerifyOtp({
        input: {
          phone,
          otpId,
          otp,
          firstName: profileRequired ? firstName.trim() : undefined,
          lastName: profileRequired ? lastName.trim() : undefined,
          email: profileRequired ? email.trim() : undefined,
        },
      });
      await onAuthenticated();
    } catch (err) {
      const code = errorCodeFrom(err);
      if (code === CustomerAuthErrorCode.EMAIL_USED_ELSEWHERE) {
        finishWithModal({ kind: "email-used-elsewhere" });
        return;
      }
      setError(errorMessageFrom(err, "Invalid OTP"));
    } finally {
      setLoading(false);
    }
  };

  const requestPendingOtp = async () => {
    setError(null);
    if (!/^\+\d{10,14}$/.test(phone)) {
      setError("Enter a valid phone number with country code");
      return;
    }
    setLoading(true);
    try {
      const data = await sdk.CustomerPendingSignupRequestOtp({
        input: { pendingToken, phone },
      });
      setOtpId(data.customerPendingSignupRequestOtp.otpId);
      setStep("pending-otp");
    } catch (err) {
      const code = errorCodeFrom(err);
      if (code === CustomerAuthErrorCode.PENDING_TOKEN_EXPIRED) {
        setError("Your sign-up session expired. Please start again.");
        setStep("choose");
        return;
      }
      setError(errorMessageFrom(err, "Unable to send OTP"));
    } finally {
      setLoading(false);
    }
  };

  const verifyPendingOtp = async () => {
    setError(null);
    if (otp.length < 4) {
      setError("Enter the 6-digit OTP we just sent you");
      return;
    }
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError("Please fill in your name and email");
      return;
    }
    setLoading(true);
    try {
      const data = await sdk.CustomerPendingSignupVerifyOtp({
        input: {
          pendingToken,
          otp,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
        },
      });
      const res = data.customerPendingSignupVerifyOtp as CustomerPendingSignupVerifyResponse;
      if (res.outcome === "NEW_ACCOUNT") {
        await onAuthenticated();
        return;
      }
      finishWithModal({
        kind: "linked-as-secondary",
        primaryEmailMasked: res.primaryEmailMasked,
        secondaryEmail: res.secondaryEmail,
      });
    } catch (err) {
      const code = errorCodeFrom(err);
      if (code === CustomerAuthErrorCode.PHONE_ACCOUNT_FULL) {
        finishWithModal({ kind: "phone-account-full" });
        return;
      }
      if (code === CustomerAuthErrorCode.EMAIL_USED_ELSEWHERE) {
        finishWithModal({ kind: "email-used-elsewhere" });
        return;
      }
      if (code === CustomerAuthErrorCode.PENDING_TOKEN_EXPIRED) {
        setError("Your sign-up session expired. Please start again.");
        setStep("choose");
        return;
      }
      setError(errorMessageFrom(err, "Invalid OTP"));
    } finally {
      setLoading(false);
    }
  };

  const closeModalAndFinish = async () => {
    const wasLinked =
      modal?.kind === "linked-existing-by-email" ||
      modal?.kind === "linked-as-secondary";
    setModal(null);
    if (wasLinked) await onAuthenticated();
  };

  const renderStep = () => {
    if (step === "choose") {
      return (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setStep("phone")}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-black transition hover:bg-accent/90"
          >
            <Phone size={16} /> Continue with phone OTP
          </button>

          {GOOGLE_CLIENT_ID ? (
            <>
              <div className="flex items-center gap-3 py-1">
                <span className="h-px flex-1 bg-white/15" />
                <span className="text-xs font-medium uppercase tracking-wider text-white/45">
                  or
                </span>
                <span className="h-px flex-1 bg-white/15" />
              </div>
              <div className="h-auth-google flex justify-center overflow-hidden rounded-xl">
              <GoogleLogin
                onSuccess={(credentialResponse) => {
                  const credential = credentialResponse.credential;
                  if (credential) {
                    void handleGoogleCredential(credential);
                  } else {
                    setError("Google did not return a credential. Try again.");
                  }
                }}
                onError={() => {
                  const origin =
                    typeof window !== "undefined"
                      ? window.location.origin
                      : "this origin";
                  setError(
                    `Google sign-in is blocked for ${origin}. Use phone OTP, or add this origin to Authorized JavaScript origins in Google Cloud Console.`
                  );
                }}
                useOneTap={false}
                theme="filled_black"
                width="300"
                containerProps={{ className: "h-auth-google__container" }}
              />
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs text-amber-100">
              Google sign-in isn't configured for this environment. Use phone
              OTP below.
            </div>
          )}
        </div>
      );
    }

    if (step === "phone") {
      return (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setStep("choose")}
            className="inline-flex items-center gap-1 text-xs font-semibold text-white/55 hover:text-white"
          >
            <ArrowLeft size={14} /> Back to all options
          </button>
          <label className="block text-sm font-medium text-white/85">
            Phone number
            <input
              autoFocus
              type="tel"
              autoComplete="tel"
              placeholder="+91 9876543210"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-white/12 bg-white/[0.06] px-4 text-sm text-white outline-none focus:border-accent"
            />
          </label>
          <p className="text-xs text-white/50">
            We'll send a 6-digit OTP to verify your number.
          </p>
          <button
            type="button"
            disabled={loading}
            onClick={requestPhoneOtp}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-black transition hover:bg-accent/90 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                Send OTP <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      );
    }

    if (step === "phone-otp") {
      return (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-white/85">
            6-digit OTP sent to {phone}
            <input
              autoFocus
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="mt-1 h-11 w-full rounded-xl border border-white/12 bg-white/[0.06] px-4 text-center text-lg tracking-[0.4em] text-white outline-none focus:border-accent"
            />
          </label>
          <button
            type="button"
            onClick={() => setStep("phone")}
            className="text-xs font-semibold text-accent hover:underline"
          >
            Change number
          </button>

          {profileRequired ? (
            <div className="rounded-xl border border-white/12 bg-white/[0.06] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/55">
                New here? Tell us a bit about yourself
              </p>
              <p className="mt-1 text-[11px] text-white/45">
                Required for first-time accounts. We won't ask again on next sign-in.
              </p>
              <div className="mt-3 grid gap-2">
                <input
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-10 rounded-lg border border-white/12 bg-black/20 px-3 text-sm text-white outline-none focus:border-accent"
                />
                <input
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-10 rounded-lg border border-white/12 bg-black/20 px-3 text-sm text-white outline-none focus:border-accent"
                />
                <input
                  type="email"
                  placeholder="Email (for ticket delivery)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 rounded-lg border border-white/12 bg-black/20 px-3 text-sm text-white outline-none focus:border-accent"
                />
              </div>
            </div>
          ) : null}

          <button
            type="button"
            disabled={loading}
            onClick={verifyPhoneOtp}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-black transition hover:bg-accent/90 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                Verify and continue <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      );
    }

    if (step === "pending-phone") {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-xl border border-white/12 bg-white/[0.06] px-3 py-2">
            {pendingPicture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={pendingPicture}
                alt=""
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : null}
            <div className="text-sm text-white">
              <div className="font-semibold">
                {firstName} {lastName}
              </div>
              <div className="text-xs text-white/50">{email}</div>
            </div>
          </div>
          <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs text-amber-100">
            <ShieldCheck className="inline -mt-0.5 mr-1" size={14} /> Almost
            there — add your phone number so we can deliver tickets and OTPs.
          </div>
          <label className="block text-sm font-medium text-white/85">
            Phone number
            <input
              autoFocus
              type="tel"
              autoComplete="tel"
              placeholder="+91 9876543210"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-white/12 bg-white/[0.06] px-4 text-sm text-white outline-none focus:border-accent"
            />
          </label>
          <button
            type="button"
            disabled={loading}
            onClick={requestPendingOtp}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-black transition hover:bg-accent/90 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                Send OTP <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      );
    }

    // pending-otp
    return (
      <div className="space-y-3">
        <label className="block text-sm font-medium text-white/85">
          6-digit OTP sent to {phone}
          <input
            autoFocus
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            className="mt-1 h-11 w-full rounded-xl border border-white/12 bg-white/[0.06] px-4 text-center text-lg tracking-[0.4em] text-white outline-none focus:border-accent"
          />
        </label>
        <button
          type="button"
          onClick={() => setStep("pending-phone")}
          className="text-xs font-semibold text-accent hover:underline"
        >
          Change number
        </button>

        <div className="grid gap-2">
          <input
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="h-10 rounded-lg border border-white/12 bg-black/20 px-3 text-sm text-white outline-none focus:border-accent"
          />
          <input
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="h-10 rounded-lg border border-white/12 bg-black/20 px-3 text-sm text-white outline-none focus:border-accent"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 rounded-lg border border-white/12 bg-black/20 px-3 text-sm text-white outline-none focus:border-accent"
          />
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={verifyPendingOtp}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-black transition hover:bg-accent/90 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              Verify and create account <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="h-auth-panel space-y-4">
      {headline ? (
        <div>
          <h2 className="text-lg font-semibold text-white">{headline}</h2>
          {subheadline ? (
            <p className="mt-1 text-xs text-white/55">{subheadline}</p>
          ) : null}
        </div>
      ) : null}
      {renderStep()}
      {error ? (
        <div className="rounded-lg border border-red-300/25 bg-red-500/10 px-3 py-2 text-sm text-red-100">
          {error}
        </div>
      ) : null}
      {modal ? (
        <CollisionModal
          kind={modal.kind}
          primaryEmailMasked={modal.primaryEmailMasked}
          secondaryEmail={modal.secondaryEmail}
          onClose={closeModalAndFinish}
        />
      ) : null}
    </div>
  );
};

export const AuthPanel = (props: AuthPanelProps) => {
  // We wrap the Google provider inside the panel so the rest of the app
  // (and SSR for non-auth pages) never has to think about it. The
  // provider is a no-op when GOOGLE_CLIENT_ID is unset — the inner
  // panel renders the "use phone OTP" fallback.
  if (!GOOGLE_CLIENT_ID) {
    return <AuthPanelInner {...props} />;
  }
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthPanelInner {...props} />
    </GoogleOAuthProvider>
  );
};
