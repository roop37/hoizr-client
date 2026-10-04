"use client";

import { CheckCircle2, Loader2, RotateCw, Unplug } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { sdk } from "@/lib/sdk";
import { resetSwiggyConnectedCache } from "@/lib/use-swiggy-connected";
import { ConnectSwiggyButton } from "./ConnectSwiggyButton";
import {
  getSwiggyConnectionView,
  type SwiggyConnectionSnapshot,
} from "./swiggy-connection-state";

const SWIGGY_DINEOUT_ENABLED =
  process.env.NEXT_PUBLIC_SWIGGY_DINEOUT_ENABLED === "true";

export function SwiggyConnectCard() {
  return SWIGGY_DINEOUT_ENABLED ? <SwiggyConnectCardInner /> : null;
}

function SwiggyConnectCardInner() {
  const [snapshot, setSnapshot] = useState<SwiggyConnectionSnapshot | null>(
    null
  );
  const [statusFailed, setStatusFailed] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setSnapshot(null);
    setStatusFailed(false);
    setActionError(null);
    try {
      const result = await sdk.SwiggyDineoutStatus();
      setSnapshot({
        connected: Boolean(result.swiggyDineoutStatus?.connected),
        status: result.swiggyDineoutStatus?.status ?? null,
      });
    } catch {
      setStatusFailed(true);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const disconnect = async () => {
    setDisconnecting(true);
    setActionError(null);
    try {
      await sdk.DisconnectSwiggy();
      resetSwiggyConnectedCache();
      setSnapshot({ connected: false, status: null });
    } catch {
      setActionError(
        "Couldn't disconnect your account. Your connection is still active."
      );
    } finally {
      setDisconnecting(false);
    }
  };

  const view = getSwiggyConnectionView(snapshot, statusFailed);

  if (view === "loading") {
    return (
      <section
        aria-label="Checking Swiggy connection"
        aria-live="polite"
        className="mt-4 rounded-3xl border border-cream/10 bg-cream/[0.04] p-5 text-cream md:p-6"
      >
        <div className="flex items-center gap-3 text-xs text-cream/45">
          <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          Checking your Dineout connection…
        </div>
      </section>
    );
  }

  return (
    <section className="mt-4 rounded-3xl border border-cream/10 bg-cream/[0.04] p-5 text-cream md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {/* Supplied brand lockup, kept at its original aspect ratio. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brands/swiggy.svg"
            alt="Swiggy"
            width={159}
            height={49}
            className="h-7 w-auto max-w-full object-contain"
          />
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-cream/70">
            Connect once to discover restaurants and reserve a table for your
            night out through Dineout.
          </p>
        </div>

        {view === "connected" ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-200 ring-1 ring-inset ring-emerald-400/40">
            <CheckCircle2 size={12} aria-hidden="true" />
            Connected
          </span>
        ) : null}
      </div>

      {view === "error" ? (
        <div className="mt-4 rounded-2xl border border-amber-400/25 bg-amber-500/[0.07] p-3">
          <p className="text-sm text-amber-100">
            We couldn&apos;t check your connection. Your account wasn&apos;t
            changed.
          </p>
          <button
            type="button"
            onClick={() => void loadStatus()}
            className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-amber-300/35 px-4 text-sm font-semibold text-amber-100 transition hover:bg-amber-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            <RotateCw size={15} aria-hidden="true" />
            Retry
          </button>
        </div>
      ) : view === "connected" ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/dineout"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#c5ff3d] px-4 text-sm font-semibold text-ink transition hover:bg-[#d9ff6e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c5ff3d] focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            Explore Dineout
          </Link>
          <button
            type="button"
            disabled={disconnecting}
            onClick={() => void disconnect()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-cream/15 px-4 text-sm font-semibold text-cream/70 transition hover:border-cream/30 hover:bg-cream/[0.05] hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink disabled:opacity-60"
          >
            {disconnecting ? (
              <Loader2 size={15} className="animate-spin" aria-hidden="true" />
            ) : (
              <Unplug size={15} aria-hidden="true" />
            )}
            Disconnect
          </button>
        </div>
      ) : (
        <div className="mt-4">
          {view === "reconnect" ? (
            <p className="mb-3 text-xs leading-relaxed text-cream/55">
              Your connection needs a quick refresh before you can use
              Dineout again.
            </p>
          ) : null}
          <ConnectSwiggyButton reconnect={view === "reconnect"} />
        </div>
      )}

      {actionError ? (
        <p
          role="alert"
          className="mt-3 rounded-xl border border-rose-400/30 bg-rose-500/[0.08] px-3 py-2 text-sm text-rose-200"
        >
          {actionError}
        </p>
      ) : null}
    </section>
  );
}
