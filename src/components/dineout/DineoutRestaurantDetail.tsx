"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { sdk } from "@/lib/sdk";
import { useAuthStore } from "@/store/auth";
import { useUIStore } from "@/store/uiStore";
import type {
  DineoutRestaurantFieldsFragment,
  DineoutAvailableSlotsQuery,
} from "@/generated/graphql";
import { PoweredBySwiggy } from "./PoweredBySwiggy";
import { ConnectSwiggyButton } from "./ConnectSwiggyButton";
import { formatIST, fitsBeforeDoors } from "@/lib/dineout";

type SlotGroup = NonNullable<
  DineoutAvailableSlotsQuery["dineoutAvailableSlots"]["slotGroups"]
>[number];
type Slot = SlotGroup["slots"][number];

// A slot always carries at least one free deal (server filters to free-only).
type Pending = { slot: Slot; deal: Slot["deals"][number] };

// The next 7 days in IST (Swiggy's slot window) for the date-chip row.
const buildDateChips = (): { value: string; label: string }[] => {
  const fmtValue = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" });
  const fmtLabel = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
    return {
      value: fmtValue.format(d),
      label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : fmtLabel.format(d),
    };
  });
};

export function DineoutRestaurantDetail({
  restaurantId,
  lat,
  lng,
  fallbackName,
  initialDate,
  doorsAt,
}: {
  restaurantId: string;
  lat: number;
  lng: number;
  fallbackName?: string;
  /** Seed the date chip from a Dinner-before-doors / DineNearbyLink deep-link. */
  initialDate?: string;
  /** Event doors-open time (epoch seconds) — badges slots that fit before it. */
  doorsAt?: number;
}) {
  const profile = useAuthStore((s) => s.profile);
  const hydrated = useAuthStore((s) => s.hydrated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const openSignIn = useUIStore((s) => s.openSignIn);

  const dateChips = useMemo(buildDateChips, []);
  const [selectedDate, setSelectedDate] = useState(() =>
    initialDate && dateChips.some((d) => d.value === initialDate)
      ? initialDate
      : dateChips[0].value
  );

  // The doors badge is only meaningful on the EVENT'S OWN date. doorsAt is the
  // event start; its IST calendar day is the only day where "ends before
  // doors" makes sense — on any other selected date a slot is trivially
  // hours/days before doors and would be misleadingly badged.
  const eventDate = useMemo(
    () =>
      doorsAt
        ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(
            new Date(doorsAt * 1000)
          )
        : undefined,
    [doorsAt]
  );
  const showDoorsBadge = !!doorsAt && selectedDate === eventDate;

  const [restaurant, setRestaurant] = useState<DineoutRestaurantFieldsFragment | null>(null);
  const [slotGroups, setSlotGroups] = useState<SlotGroup[] | null>(null);
  const [guestCount, setGuestCount] = useState(2);
  const [pending, setPending] = useState<Pending | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingMsg, setConfirmingMsg] = useState<string | null>(null);
  const [booked, setBooked] = useState<{ orderId: string } | null>(null);
  const [booking, setBooking] = useState(false);
  const [reportLink, setReportLink] = useState<string | null>(null);
  // Bumped by "Try again" so the slots effect refires for the SAME date.
  const [retryTick, setRetryTick] = useState(0);

  // Support path for a stuck/ambiguous booking (spec §7.3): wraps Swiggy's
  // report_error, which returns a pre-filled mailto: link.
  const reportProblem = async () => {
    try {
      const r = await sdk.ReportDineoutError({
        input: {
          tool: "book_table",
          errorMessage: "Ambiguous booking outcome (timeout/5xx) — customer could not confirm",
          flowDescription: `restaurantId=${restaurantId} while booking from Hoizr dineout`,
        },
      });
      setReportLink(r.reportDineoutError.reportLink ?? null);
    } catch {
      /* keep the confirming banner as-is */
    }
  };

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  // Details load once per restaurant.
  useEffect(() => {
    if (!hydrated || !profile) return;
    sdk
      .DineoutRestaurantDetails({
        input: { restaurantId, latitude: lat, longitude: lng },
      })
      .then((d) => {
        if (d.dineoutRestaurantDetails.needsSwiggyAuth) return setNeedsAuth(true);
        setRestaurant(d.dineoutRestaurantDetails.restaurant ?? null);
      })
      .catch(() => setError("Couldn't load this restaurant. Please try again."));
  }, [hydrated, profile, restaurantId, lat, lng]);

  // Slots reload whenever the selected date changes (or Try again is tapped).
  useEffect(() => {
    if (!hydrated || !profile) return;
    setSlotGroups(null);
    setError(null);
    sdk
      .DineoutAvailableSlots({
        input: { restaurantId, date: selectedDate, latitude: lat, longitude: lng },
      })
      .then((s) => {
        if (s.dineoutAvailableSlots.needsSwiggyAuth) return setNeedsAuth(true);
        setSlotGroups(s.dineoutAvailableSlots.slotGroups);
        if (s.dineoutAvailableSlots.error) setError(s.dineoutAvailableSlots.error);
      })
      .catch(() => setError("Couldn't load tables. Please try again."));
  }, [hydrated, profile, restaurantId, lat, lng, selectedDate, retryTick]);

  const confirmBooking = async () => {
    if (!pending) return;
    // book_table requires itemId + reservationTime (verified Swiggy table);
    // if the slot payload lacked them, fail soft instead of sending garbage.
    const itemId = pending.deal.itemId ?? pending.slot.itemId;
    if (!itemId || !pending.slot.reservationTime) {
      setError("This slot can't be booked right now — please pick another.");
      setPending(null);
      return;
    }
    setBooking(true);
    setError(null);
    try {
      const r = await sdk.BookDineoutTable({
        input: {
          restaurantId,
          // Live API: slotId lives on the deal; slot-level is a fallback.
          slotId: pending.deal.slotId ?? pending.slot.slotId,
          itemId,
          reservationTime: pending.slot.reservationTime,
          guestCount,
          latitude: lat,
          longitude: lng,
          restaurantName: restaurant?.name ?? fallbackName,
          restaurantAddress: restaurant?.address ?? undefined,
        },
      });
      const res = r.bookDineoutTable;
      if (res.needsSwiggyAuth) return setNeedsAuth(true);
      if (res.error) {
        setError(res.error);
        setPending(null);
        return;
      }
      if (res.confirming) {
        setConfirmingMsg(
          "We're confirming your reservation. Check My reservations in a moment — please don't rebook."
        );
        setPending(null);
        return;
      }
      if (res.booking) setBooked({ orderId: res.booking.orderId });
    } catch {
      setError("Booking failed. Please try again.");
    } finally {
      setBooking(false);
    }
  };

  const name = restaurant?.name ?? fallbackName ?? "Restaurant";
  const cover = restaurant?.mastheadImages?.[0] ?? restaurant?.imageUrl ?? null;
  const gallery = (restaurant?.mastheadImages ?? []).slice(1, 7);

  return (
    <div className="h-page h-detail">
      <div className="flex items-center justify-between">
        <Link href="/dineout" className="h-detail-back">
          <span className="h-back-icon">←</span> Dineout
        </Link>
        <PoweredBySwiggy />
      </div>

      {hydrated && !profile && (
        <div className="h-glass-card mt-6 space-y-3 p-5">
          <p className="text-sm text-[var(--h-ink-2)]">
            Sign in to Hoizr to see tables and book.
          </p>
          <button
            type="button"
            onClick={() => openSignIn()}
            className="h-btn h-btn-accent"
          >
            Sign in to continue
          </button>
        </div>
      )}

      {profile && needsAuth && (
        <div className="h-glass-card mt-6 space-y-3 p-5">
          <p className="text-sm text-[var(--h-ink-2)]">
            Reconnect your Swiggy account to continue.
          </p>
          <ConnectSwiggyButton />
        </div>
      )}

      {profile && !needsAuth && (
        <>
          {/* Hero — the event-detail treatment, fed by Swiggy's masthead. */}
          <div className="h-event-hero h-event-hero--landscape mt-3">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="h-event-hero-landscape" src={cover} alt={name} />
            ) : (
              <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-white/10 to-white/[0.02] text-6xl font-bold text-white/20">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="h-detail-heading">
            <div>
              <h1 className="h-detail-title">{name}</h1>
              <div className="h-detail-line">
                {restaurant?.rating != null && (
                  <span className="date">★ {restaurant.rating}</span>
                )}
                {restaurant?.cuisines?.length ? (
                  <>
                    <span className="sep">•</span>
                    <span>{restaurant.cuisines.join(", ")}</span>
                  </>
                ) : null}
                {restaurant?.costForTwo && (
                  <>
                    <span className="sep">•</span>
                    <span>{restaurant.costForTwo}</span>
                  </>
                )}
              </div>
              {restaurant?.address && (
                <p className="text-[13px] text-white/55">{restaurant.address}</p>
              )}
            </div>
          </div>

          {restaurant?.highlights && restaurant.highlights.length > 0 && (
            <div className="h-chip-row mt-3">
              {restaurant.highlights.slice(0, 8).map((h) => (
                <span key={h}>{h}</span>
              ))}
            </div>
          )}

          {gallery.length > 0 && (
            <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1">
              {gallery.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={src}
                  alt={`${name} photo ${i + 2}`}
                  loading="lazy"
                  className="h-24 w-36 flex-none rounded-xl border border-white/10 object-cover"
                />
              ))}
            </div>
          )}

          {/* ── Reservation ── */}
          <div className="h-detail-body-card h-detail-section mt-6">
            <h2>Reserve a table</h2>
            {showDoorsBadge ? (
              <p className="mt-1 text-[13px] text-[var(--h-ink-3)]">
                <span style={{ color: "var(--h-accent)" }}>✓</span> = ends comfortably
                before doors (
                {new Intl.DateTimeFormat("en-IN", {
                  timeZone: "Asia/Kolkata",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                }).format(new Date(doorsAt * 1000))}
                )
              </p>
            ) : null}

            {booked && (
              <div className="mt-3 rounded-2xl border border-[#c5ff3d]/40 bg-[#c5ff3d]/10 p-3 text-sm text-white">
                <p className="font-semibold text-[var(--h-accent)]">Table reserved!</p>
                <p>Confirmation: {booked.orderId}</p>
                <Link href="/dineout/bookings" className="underline text-[var(--h-accent)]">
                  View My reservations
                </Link>
              </div>
            )}

            {confirmingMsg && (
              <div className="mt-3 space-y-2 rounded-2xl border border-amber-400/40 bg-amber-400/10 p-3 text-sm text-amber-200">
                <p>{confirmingMsg}</p>
                <div className="flex items-center gap-3">
                  <Link href="/dineout/bookings" className="underline">
                    Check my reservations
                  </Link>
                  {reportLink ? (
                    <a href={reportLink} className="underline">
                      Email the report
                    </a>
                  ) : (
                    <button onClick={reportProblem} className="underline">
                      Report a problem
                    </button>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => setRetryTick((t) => t + 1)}
                  className="h-chip flex-none"
                >
                  Try again
                </button>
              </div>
            )}

            {!booked && (
              <>
                {/* Date chips — Swiggy's 7-day booking window (IST). */}
                <div className="h-chip-row -mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
                  {dateChips.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setSelectedDate(d.value)}
                      className={`h-chip flex-none ${selectedDate === d.value ? "active" : ""}`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>

                <div className="mt-4">
                  <div className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-white/45">
                    Guests
                  </div>
                  <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1">
                    {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setGuestCount(n)}
                        className={`h-chip flex-none ${guestCount === n ? "active" : ""}`}
                      >
                        {n}
                      </button>
                    ))}
                    <select
                      aria-label="More guests"
                      value={guestCount > 8 ? guestCount : ""}
                      onChange={(e) => e.target.value && setGuestCount(Number(e.target.value))}
                      className={`h-chip flex-none appearance-none bg-transparent ${guestCount > 8 ? "active" : ""}`}
                    >
                      <option value="" disabled>
                        9+
                      </option>
                      {Array.from({ length: 12 }, (_, i) => i + 9).map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {slotGroups === null && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-9 w-20 animate-pulse rounded-full border border-white/5 bg-white/5"
                      />
                    ))}
                  </div>
                )}
                {slotGroups && slotGroups.length === 0 && (
                  <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
                    <p className="text-sm font-semibold text-white">
                      No free tables this day
                    </p>
                    <p className="mt-1 text-[13px] text-white/55">
                      Hop to another date — most spots open up through the week.
                    </p>
                  </div>
                )}

                {slotGroups?.map((g) => (
                  <div key={g.name} className="mt-5 space-y-2">
                    <div className="text-[12px] font-semibold uppercase tracking-wider text-white/45">
                      {g.name}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {g.slots.map((slot) => {
                        const freeDeal = slot.deals.find((d) => d.isFree);
                        const isPicked =
                          pending?.slot.slotId === slot.slotId &&
                          pending?.slot.reservationTime === slot.reservationTime;
                        const fits =
                          showDoorsBadge &&
                          fitsBeforeDoors(slot.reservationTime, doorsAt);
                        return (
                          <button
                            key={`${slot.slotId}-${slot.reservationTime}`}
                            onClick={() => freeDeal && setPending({ slot, deal: freeDeal })}
                            className={`h-chip ${isPicked ? "active" : ""}`}
                            title={fits ? "Ends comfortably before doors" : undefined}
                          >
                            {slot.displayTime ?? formatIST(slot.reservationTime)}
                            {fits ? (
                              <span className="text-[var(--h-accent)]">✓</span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </>
      )}

      {/* Explicit confirmation before mutating (spec §7.3). */}
      {pending && !booked && (
        <div
          className="h-scrim"
          role="dialog"
          aria-modal="true"
          onClick={() => !booking && setPending(null)}
        >
          <div className="h-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="h-modal-close"
              onClick={() => setPending(null)}
              disabled={booking}
              aria-label="Close"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <h2>Confirm your table</h2>
            <div className="space-y-1 text-sm text-[var(--h-ink-2)]">
              <p className="font-medium text-[var(--h-ink)]">{name}</p>
              <p>
                {dateChips.find((d) => d.value === selectedDate)?.label} ·{" "}
                {pending.slot.displayTime ?? formatIST(pending.slot.reservationTime)}
              </p>
              <p>
                {guestCount} {guestCount === 1 ? "guest" : "guests"}
              </p>
              {pending.deal.title && (
                <p style={{ color: "var(--h-accent)" }}>{pending.deal.title}</p>
              )}
              {pending.slot.deals.filter((d) => !d.isFree).length > 0 && (
                <p className="text-xs text-[var(--h-ink-4)]">
                  Paid deals at this table (bookable on Swiggy):{" "}
                  {pending.slot.deals
                    .filter((d) => !d.isFree)
                    .map((d) => d.title)
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </div>
            <div className="mt-5 flex items-center justify-between gap-3">
              <PoweredBySwiggy />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPending(null)}
                  disabled={booking}
                  className="h-btn h-btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmBooking}
                  disabled={booking}
                  className="h-btn h-btn-accent"
                >
                  {booking ? "Confirming…" : "Confirm booking"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
