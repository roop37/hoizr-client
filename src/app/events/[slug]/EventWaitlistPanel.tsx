"use client";

import { Check, Loader2, Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { gqlRequest } from "@/lib/graphql";
import { JOIN_WAITLIST_MUTATION, MY_WAITLIST_STATUS_QUERY } from "@/lib/queries";
import { useAuthStore } from "@/store/auth";
import type { PublicEvent } from "@/types/event";
import { AuthSheet } from "@/components/auth/AuthSheet";

type WaitlistStatus = "WAITING" | "INVITED" | "CONVERTED" | "DECLINED";

const STATUS_COPY: Record<WaitlistStatus, { title: string; body: string }> = {
  WAITING: {
    title: "You're on the waitlist",
    body: "We'll let you know the moment a spot or tickets open up for you.",
  },
  INVITED: {
    title: "You've been invited!",
    body: "The organizer sent you a payment link — check your WhatsApp/email to grab your spot.",
  },
  CONVERTED: {
    title: "You're in 🎉",
    body: "Your ticket is confirmed. See you there!",
  },
  DECLINED: {
    title: "Waitlist closed for you",
    body: "The organizer wasn't able to offer a spot this time.",
  },
};

/**
 * Customer-facing waitlist join surface. Shown by EventBookingPanel when the
 * event is waitlist-only, in its pre-sale window, or sold out with a waitlist.
 * The join flow reacts to the server's INSTAGRAM_REQUIRED error rather than
 * inspecting the profile — so it works no matter what the client has cached.
 */
export const EventWaitlistPanel = ({ event }: { event: PublicEvent }) => {
  const profile = useAuthStore((s) => s.profile);
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrated = useAuthStore((s) => s.hydrated);

  const [status, setStatus] = useState<WaitlistStatus | null>(null);
  const [partySize, setPartySize] = useState(1);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  // Social-handle sheet (opened only when the server demands Instagram).
  const [showSocials, setShowSocials] = useState(false);
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [x, setX] = useState("");

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    let active = true;
    if (!profile) {
      setStatus(null);
      return;
    }
    gqlRequest<{ myWaitlistStatus: { status: WaitlistStatus } | null }>(
      MY_WAITLIST_STATUS_QUERY,
      { eventId: event._id }
    )
      .then((r) => active && setStatus(r?.myWaitlistStatus?.status ?? null))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [profile, event._id]);

  const join = async (socials?: {
    instagramHandle?: string;
    facebookHandle?: string;
    xHandle?: string;
  }) => {
    setError(null);
    setLoading(true);
    try {
      const res = await gqlRequest<{ joinWaitlist: { status: WaitlistStatus } }>(
        JOIN_WAITLIST_MUTATION,
        {
          input: {
            eventId: event._id,
            partySize,
            note: note.trim() || undefined,
            ...socials,
          },
        }
      );
      setStatus(res.joinWaitlist.status);
      setShowSocials(false);
    } catch (err: any) {
      const gqlErr = err?.response?.errors?.[0];
      const code = gqlErr?.extensions?.code;
      if (code === "INSTAGRAM_REQUIRED" || /instagram/i.test(gqlErr?.message ?? "")) {
        setShowSocials(true);
      } else {
        setError(gqlErr?.message ?? "Couldn't join the waitlist. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const onJoinClick = () => {
    if (!profile) {
      setShowLogin(true);
      return;
    }
    join();
  };

  const onAuthenticated = async () => {
    useAuthStore.setState({ hydrated: false });
    await hydrate();
    setShowLogin(false);
    join();
  };

  const submitSocials = () => {
    if (!instagram.trim()) {
      setError("Instagram handle is required to join.");
      return;
    }
    join({
      instagramHandle: instagram.trim(),
      facebookHandle: facebook.trim() || undefined,
      xHandle: x.trim() || undefined,
    });
  };

  // Already on the list → status card.
  if (status) {
    const copy = STATUS_COPY[status];
    return (
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center text-white backdrop-blur-md">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-accent/20 text-accent">
          <Check className="h-5 w-5" />
        </div>
        <div className="mt-3 text-sm font-semibold">{copy.title}</div>
        <div className="mt-1 text-xs text-white/60">{copy.body}</div>
      </div>
    );
  }

  const expiryLabel = event.waitlistExpiry
    ? new Date(event.waitlistExpiry).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] text-white backdrop-blur-md">
      <div className="border-b border-white/10 px-5 py-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-white/60">
          Waitlist
        </div>
      </div>

      {showSocials ? (
        <div className="space-y-3 px-5 py-5">
          <div className="text-sm font-semibold">Add your socials to join</div>
          <p className="text-xs text-white/60">
            The organizer curates this guest list. Instagram is required; the
            rest are optional. We save these to your profile so you won't be
            asked again.
          </p>
          <label className="block text-xs text-white/70">
            Instagram <span className="text-accent">*</span>
            <input
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="@yourhandle"
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-accent focus:outline-none"
            />
          </label>
          <label className="block text-xs text-white/70">
            Facebook
            <input
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
              placeholder="Profile URL or username"
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-accent focus:outline-none"
            />
          </label>
          <label className="block text-xs text-white/70">
            X (Twitter)
            <input
              value={x}
              onChange={(e) => setX(e.target.value)}
              placeholder="@yourhandle"
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-accent focus:outline-none"
            />
          </label>
          {error ? <div className="text-xs text-red-400">{error}</div> : null}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowSocials(false)}
              className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white/70 hover:text-white"
            >
              Back
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={submitSocials}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-cream disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Join the waitlist
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 px-5 py-5">
          <p className="text-sm text-white/70">
            {event.waitlistOnly
              ? "This event is invite-only. Join the waitlist and the organizer will send you a ticket link if a spot opens."
              : expiryLabel
              ? `Tickets open ${expiryLabel}. Join the waitlist to be first in line.`
              : "Tickets are sold out. Join the waitlist and we'll notify you if more are released."}
          </p>

          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">How many of you?</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPartySize((n) => Math.max(1, n - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-white/80 hover:text-white"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-5 text-center text-sm font-semibold">
                {partySize}
              </span>
              <button
                type="button"
                onClick={() => setPartySize((n) => Math.min(20, n + 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-white/80 hover:text-white"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note to the organizer"
            rows={2}
            className="w-full resize-none rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-accent focus:outline-none"
          />

          {error ? <div className="text-xs text-red-400">{error}</div> : null}

          <button
            type="button"
            disabled={loading}
            onClick={onJoinClick}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-cream disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Join the waitlist
          </button>
        </div>
      )}

      <AuthSheet
        open={showLogin}
        onClose={() => setShowLogin(false)}
        onAuthenticated={onAuthenticated}
        headline="Sign in to join the waitlist"
        subheadline="Verify with a quick phone OTP — you'll join right after."
      />
    </div>
  );
};
