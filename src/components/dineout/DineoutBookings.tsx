"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { sdk } from "@/lib/sdk";
import { useAuthStore } from "@/store/auth";
import { useUIStore } from "@/store/uiStore";
import type { MyDineoutBookingsQuery } from "@/generated/graphql";
import { PoweredBySwiggy } from "./PoweredBySwiggy";
import { formatDateIST } from "@/lib/dineout";

type Booking = MyDineoutBookingsQuery["myDineoutBookings"][number];

export function DineoutBookings() {
  const profile = useAuthStore((s) => s.profile);
  const hydrated = useAuthStore((s) => s.hydrated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const openSignIn = useUIStore((s) => s.openSignIn);

  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [refreshing, setRefreshing] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    if (!hydrated || !profile) return;
    sdk
      .MyDineoutBookings()
      .then((r) => setBookings(r.myDineoutBookings))
      .catch(() => setBookings([]));
  }, [hydrated, profile]);

  // Poll-on-demand only (spec §7.4) — never auto-poll faster than the customer asks.
  const refresh = async (orderId: string) => {
    setRefreshing(orderId);
    try {
      const r = await sdk.DineoutBookingStatus({ orderId });
      const s = r.dineoutBookingStatus.booking?.status;
      if (s) setStatuses((prev) => ({ ...prev, [orderId]: s }));
    } catch {
      /* leave the last-known status */
    } finally {
      setRefreshing(null);
    }
  };

  return (
    <div className="h-page">
      <div className="flex items-center justify-between">
        <Link href="/dineout" className="h-detail-back">
          <span className="h-back-icon">←</span> Dineout
        </Link>
        <PoweredBySwiggy />
      </div>

      <div className="h-page-head">
        <div>
          <div className="label">Dineout</div>
          <h1>My reservations</h1>
        </div>
      </div>

      <div className="max-w-2xl space-y-5">
        {hydrated && !profile && (
          <button
            type="button"
            onClick={() => openSignIn()}
            className="h-btn h-btn-accent"
          >
            Sign in to see your reservations
          </button>
        )}

        {(!hydrated || (profile && bookings === null)) && (
          <p className="text-sm text-[var(--h-ink-3)]">Loading…</p>
        )}
        {profile && bookings && bookings.length === 0 && (
          <div className="h-empty">No reservations yet.</div>
        )}

        <ul className="space-y-3">
          {bookings?.map((b) => (
            <li key={b.swiggyOrderId} className="h-glass-card p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-[var(--h-ink)]">{b.restaurantName}</span>
                <span className="flex-none rounded-full bg-[#c5ff3d]/15 px-2 py-0.5 text-[11px] font-semibold uppercase text-[var(--h-accent)]">
                  {statuses[b.swiggyOrderId] ?? b.status}
                </span>
              </div>
              <div className="mt-1 text-sm text-[var(--h-ink-2)]">
                {formatDateIST(b.reservationTime)} · {b.guestCount}{" "}
                {b.guestCount === 1 ? "guest" : "guests"}
              </div>
              {b.restaurantAddress && (
                <div className="text-xs text-[var(--h-ink-3)]">{b.restaurantAddress}</div>
              )}
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-[var(--h-ink-4)]">#{b.swiggyOrderId}</span>
                <button
                  onClick={() => refresh(b.swiggyOrderId)}
                  disabled={refreshing === b.swiggyOrderId}
                  className="text-xs text-[var(--h-ink-2)] underline decoration-white/30 underline-offset-2 transition hover:text-[var(--h-accent)] disabled:opacity-50"
                >
                  {refreshing === b.swiggyOrderId ? "Refreshing…" : "Refresh status"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
