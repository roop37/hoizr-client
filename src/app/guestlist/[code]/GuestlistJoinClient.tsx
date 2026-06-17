"use client";

import { GoldenTicket } from "@/components/hoizr-ui/GoldenTicket";
import {
  fetchGuestlistByCode,
  fetchMyGuestlistTickets,
  joinGuestlist,
  type GuestlistJoinView,
  type GuestlistTicketView,
} from "@/lib/guestlist";
import { useAuthStore } from "@/store/auth";
import { useUIStore } from "@/store/uiStore";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const errMsg = (e: any): string =>
  e?.response?.errors?.[0]?.message ??
  e?.message ??
  "Something went wrong — please try again.";

const formatDate = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
};

export default function GuestlistJoinClient({ code }: { code: string }) {
  const profile = useAuthStore((s) => s.profile);
  const hydrated = useAuthStore((s) => s.hydrated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const openSignIn = useUIStore((s) => s.openSignIn);

  const [view, setView] = useState<GuestlistJoinView | null>(null);
  const [ticket, setTicket] = useState<GuestlistTicketView | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  const load = useCallback(async () => {
    setLoading(true);
    const v = await fetchGuestlistByCode(code);
    setView(v);
    if (v && profile && v.alreadyJoined) {
      const mine = await fetchMyGuestlistTickets();
      setTicket(mine.find((x) => x.eventId === v.eventId) ?? null);
    }
    setLoading(false);
  }, [code, profile]);

  useEffect(() => {
    if (hydrated) load();
  }, [hydrated, load]);

  const onJoin = async () => {
    setJoining(true);
    setError(null);
    try {
      const t = await joinGuestlist(code);
      setTicket(t);
      setView((v) =>
        v ? { ...v, alreadyJoined: true, myEntryStatus: t.status } : v
      );
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setJoining(false);
    }
  };

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-4 py-10 text-white">
      {children}
    </div>
  );

  if (!hydrated || loading) {
    return (
      <Shell>
        <Loader2 className="animate-spin text-white/60" size={22} />
      </Shell>
    );
  }

  if (!view) {
    return (
      <Shell>
        <p className="text-center text-sm text-white/70">
          This guestlist link is no longer active.
        </p>
      </Shell>
    );
  }

  // Already on the list (or just joined) → show the golden ticket / status.
  if (ticket) {
    return (
      <Shell>
        <GoldenTicket ticket={ticket} />
      </Shell>
    );
  }

  const PreviewCard = (
    <div className="w-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
      {view.eventFlyer ? (
        <img
          src={view.eventFlyer}
          alt={view.eventTitle ?? "Event"}
          className="aspect-[3/4] w-full object-cover"
        />
      ) : null}
      <div className="p-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--h-accent)]">
          You're invited
        </div>
        <h1 className="mt-1 text-xl font-bold">{view.eventTitle ?? "Event"}</h1>
        <p className="mt-1 text-sm text-white/70">
          {formatDate(view.eventDate)}
          {view.city ? ` · ${view.city}` : ""}
        </p>
        {view.contributorName ? (
          <p className="mt-0.5 text-xs text-white/55">
            Guestlist by {view.contributorName}
          </p>
        ) : null}
      </div>
    </div>
  );

  return (
    <Shell>
      {PreviewCard}
      <div className="mt-5 w-full">
        {error ? (
          <p className="mb-3 rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">
            {error}
          </p>
        ) : null}

        {!profile ? (
          <button
            type="button"
            onClick={() => openSignIn()}
            className="h-btn h-btn-accent w-full justify-center"
          >
            Sign in to join the guestlist
          </button>
        ) : view.myEntryStatus === "REVOKED" ? (
          <p className="text-center text-sm text-white/70">
            Your guestlist access was revoked.
          </p>
        ) : view.isFull ? (
          <p className="text-center text-sm text-white/70">
            This guestlist is full.
          </p>
        ) : (
          <button
            type="button"
            disabled={joining}
            onClick={onJoin}
            className="h-btn h-btn-accent w-full justify-center disabled:opacity-60"
          >
            {joining ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              "Join the guestlist"
            )}
          </button>
        )}
      </div>
    </Shell>
  );
}
