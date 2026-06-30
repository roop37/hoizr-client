"use client";

import { Loader2, MapPin, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { gqlRequest } from "@/lib/graphql";
import {
  CUSTOMER_PLACE_DETAILS_QUERY,
  CUSTOMER_PLACES_AUTOCOMPLETE_QUERY,
} from "@/lib/queries";

/**
 * Captured-address shape the parent form persists on save. `coord`
 * is the GeoJSON-compatible representation (`[lng, lat]`) so the
 * payload matches what hoizr-shared expects on the wire. Everything
 * is optional — we only persist a CoordinatePoint when both lat AND
 * lng are present.
 */
export type CapturedAddress = {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  formattedAddress?: string;
  /** [lng, lat] — matches hoizr-shared CoordinatePointInput. */
  coord?: { lng: number; lat: number };
};

type Prediction = { placeId: string; displayName: string };

type Props = {
  value: CapturedAddress | null;
  onChange: (next: CapturedAddress | null) => void;
};

const AUTOCOMPLETE_DEBOUNCE_MS = 220;

/**
 * Address search card for /me/profile. Type → Google place suggestions
 * (via customer-server, rate-limited + auth-gated). Pick a suggestion
 * → resolves to lat/lng + structured components which the parent then
 * sends up as a CoordinatePoint + AddressInfo on save.
 *
 * Once a place is selected, the input is replaced by a chip showing
 * the chosen address with an "x" to clear and search again. We don't
 * surface the raw components — the user picked a place, they don't
 * need to re-edit the line-by-line fields.
 */
export const AddressSearchCard = ({ value, onChange }: Props) => {
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);
  const requestSeqRef = useRef(0);

  // Debounced autocomplete. Each keystroke increments a sequence
  // counter; in-flight requests are ignored once a newer one starts,
  // so an out-of-order response can't overwrite the fresh list.
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (trimmed.length < 2 || value) {
      setPredictions([]);
      setSearching(false);
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      const seq = ++requestSeqRef.current;
      setSearching(true);
      setError(null);
      try {
        const data = await gqlRequest<{
          customerPlacesAutocomplete: Prediction[];
        }>(CUSTOMER_PLACES_AUTOCOMPLETE_QUERY, { input: trimmed });
        if (seq !== requestSeqRef.current) return;
        setPredictions(data.customerPlacesAutocomplete ?? []);
        setOpen(true);
      } catch (err: any) {
        if (seq !== requestSeqRef.current) return;
        const code =
          err?.response?.errors?.[0]?.extensions?.code ??
          err?.response?.errors?.[0]?.code;
        if (code === "PLACES_RATE_LIMITED") {
          setError(
            "You're searching very quickly — give it a minute and try again."
          );
        } else if (code === "PLACES_NOT_CONFIGURED") {
          setError(
            "Address search isn't configured right now. You can still leave the address empty."
          );
        } else {
          setError("Couldn't reach address search. Check your connection.");
        }
        setPredictions([]);
      } finally {
        if (seq === requestSeqRef.current) setSearching(false);
      }
    }, AUTOCOMPLETE_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, value]);

  // Close the suggestion list when the user clicks elsewhere.
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const selectPlace = async (p: Prediction) => {
    setOpen(false);
    setResolving(true);
    setError(null);
    try {
      const data = await gqlRequest<{
        customerPlaceDetails: {
          latitude?: number | null;
          longitude?: number | null;
          addressLine1?: string | null;
          addressLine2?: string | null;
          city?: string | null;
          state?: string | null;
          pincode?: string | null;
          formattedAddress?: string | null;
        } | null;
      }>(CUSTOMER_PLACE_DETAILS_QUERY, { placeId: p.placeId });
      const d = data.customerPlaceDetails;
      if (!d) {
        setError("Couldn't load address details. Try another place.");
        return;
      }
      const coord =
        typeof d.latitude === "number" && typeof d.longitude === "number"
          ? { lng: d.longitude, lat: d.latitude }
          : undefined;
      onChange({
        addressLine1: d.addressLine1 ?? undefined,
        addressLine2: d.addressLine2 ?? undefined,
        city: d.city ?? undefined,
        state: d.state ?? undefined,
        pincode: d.pincode ?? undefined,
        formattedAddress: d.formattedAddress ?? p.displayName,
        coord,
      });
      setQuery("");
      setPredictions([]);
    } catch (err: any) {
      const code =
        err?.response?.errors?.[0]?.extensions?.code ??
        err?.response?.errors?.[0]?.code;
      if (code === "PLACES_RATE_LIMITED") {
        setError("Slow down a bit — try again in a minute.");
      } else {
        setError("Couldn't load that address. Try again.");
      }
    } finally {
      setResolving(false);
    }
  };

  const clear = () => {
    onChange(null);
    setQuery("");
    setPredictions([]);
    setError(null);
  };

  const summaryLine = useMemo(() => {
    if (!value) return null;
    if (value.formattedAddress) return value.formattedAddress;
    const parts = [
      value.addressLine1,
      value.addressLine2,
      value.city,
      value.state,
      value.pincode,
    ].filter((part): part is string => Boolean(part?.trim()));
    return parts.join(", ");
  }, [value]);

  return (
    <div
      ref={wrapperRef}
      className="rounded-3xl border border-cream/10 bg-cream/[0.04] p-5 text-cream md:p-6"
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/60">
        Address
      </div>

      {value ? (
        <div className="mt-3 flex items-start justify-between gap-3 rounded-2xl border border-cream/10 bg-cream/[0.04] px-3 py-2.5">
          <div className="flex min-w-0 items-start gap-2">
            <MapPin
              size={14}
              className="mt-0.5 shrink-0 text-[#c5ff3d]"
              aria-hidden
            />
            <div className="min-w-0 text-sm text-cream/90">
              <div className="truncate font-medium">{summaryLine}</div>
              {value.coord ? (
                <div className="mt-0.5 text-[11px] text-cream/45">
                  Lat {value.coord.lat.toFixed(5)}, Lng{" "}
                  {value.coord.lng.toFixed(5)}
                </div>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={clear}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cream/15 text-cream/70 transition hover:bg-cream/10 hover:text-cream"
            aria-label="Clear saved address"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="relative mt-3">
          <div className="flex h-11 items-center gap-2 rounded-xl border border-cream/10 bg-cream/[0.04] px-3 transition focus-within:border-[#c5ff3d]/60 focus-within:bg-cream/[0.06]">
            <MapPin size={14} className="shrink-0 text-cream/55" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (predictions.length) setOpen(true);
              }}
              placeholder="Search your address…"
              className="h-full w-full bg-transparent text-sm text-cream outline-none placeholder:text-cream/40"
              autoComplete="off"
            />
            {searching || resolving ? (
              <Loader2
                size={14}
                className="shrink-0 animate-spin text-cream/55"
                aria-hidden
              />
            ) : null}
          </div>
          {open && predictions.length > 0 ? (
            <ul
              role="listbox"
              className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 max-h-72 overflow-y-auto rounded-xl border border-cream/10 bg-ink/95 shadow-[0_18px_45px_-18px_rgba(0,0,0,0.7)] backdrop-blur-xl"
            >
              {predictions.map((p) => (
                <li key={p.placeId}>
                  <button
                    type="button"
                    onClick={() => selectPlace(p)}
                    className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm text-cream/90 transition hover:bg-cream/[0.06]"
                  >
                    <MapPin
                      size={13}
                      className="mt-0.5 shrink-0 text-cream/55"
                      aria-hidden
                    />
                    <span className="line-clamp-2">{p.displayName}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}

      {error ? (
        <p className="mt-2 text-xs text-amber-200/85">{error}</p>
      ) : null}
    </div>
  );
};
