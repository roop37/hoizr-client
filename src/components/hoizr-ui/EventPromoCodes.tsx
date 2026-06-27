"use client";

import { gqlRequest } from "@/lib/graphql";
import { VISIBLE_COUPONS_QUERY } from "@/lib/queries";
import { Check, Copy, TicketPercent } from "lucide-react";
import { useEffect, useState } from "react";

type PublicCoupon = {
  code: string;
  description?: string | null;
  discountLabel: string;
  minCartValue?: number | null;
  endDate: string;
};

/**
 * Copyable promo-code cards shown below the event flyer. Renders only the
 * coupons the host marked "show on order page" that are active + in-window
 * and scoped to this event (or host-global). The whole block is hidden when
 * there are none — it only mounts when promos are present.
 */
export const EventPromoCodes = ({ eventId }: { eventId: string }) => {
  const [coupons, setCoupons] = useState<PublicCoupon[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await gqlRequest<{
          visibleCouponsForEvent: PublicCoupon[];
        }>(VISIBLE_COUPONS_QUERY, { eventId });
        if (alive) setCoupons(data.visibleCouponsForEvent ?? []);
      } catch {
        /* promos are a non-critical surface — silently skip on error */
      }
    })();
    return () => {
      alive = false;
    };
  }, [eventId]);

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      window.setTimeout(() => setCopied((c) => (c === code ? null : c)), 1600);
    } catch {
      /* clipboard blocked — the code is still visible to type manually */
    }
  };

  if (coupons.length === 0) return null;

  return (
    <div className="mt-4">
      <div className="mb-2.5 flex items-center gap-2 text-white/70">
        <TicketPercent size={15} className="text-[#c5ff3d]" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">
          Offers &amp; promo codes
        </span>
      </div>
      {/* On-brand coupon "ticket stubs": the discount is the hero, the code sits
          in a tear-off stub on the right, Copy is the accent-filled CTA. Cards
          wrap; a single coupon stays compact. */}
      <div className="flex flex-wrap gap-3">
        {coupons.map((c) => (
          <div
            key={c.code}
            className="relative flex min-w-[260px] max-w-[380px] flex-1 items-stretch overflow-hidden rounded-2xl border border-[#c5ff3d]/25 bg-[#c5ff3d]/[0.06] sm:flex-none"
            style={{
              backgroundImage:
                "radial-gradient(120% 140% at 0% 0%, rgba(197,255,61,0.12), transparent 55%)",
            }}
          >
            {/* Left: the offer */}
            <div className="min-w-0 flex-1 p-4">
              <div className="text-[15px] font-bold leading-tight text-[#c5ff3d]">
                {c.discountLabel}
              </div>
              <div className="mt-1 line-clamp-2 text-xs leading-snug text-white/65">
                {c.description ||
                  (c.minCartValue
                    ? `On orders over ₹${c.minCartValue.toLocaleString("en-IN")}`
                    : "Apply at checkout")}
              </div>
              {c.minCartValue && c.description ? (
                <div className="mt-1.5 inline-flex rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold text-white/55">
                  Min ₹{c.minCartValue.toLocaleString("en-IN")}
                </div>
              ) : null}
            </div>

            {/* Perforated tear line */}
            <div
              className="my-2 w-0 border-l border-dashed border-[#c5ff3d]/30"
              aria-hidden
            />

            {/* Right: the code + copy CTA */}
            <div className="flex shrink-0 flex-col items-center justify-center gap-2 px-4 py-3">
              <span className="font-mono text-sm font-bold tracking-[0.12em] text-white">
                {c.code}
              </span>
              <button
                type="button"
                onClick={() => copy(c.code)}
                aria-label={`Copy promo code ${c.code}`}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  copied === c.code
                    ? "bg-[#c5ff3d]/20 text-[#c5ff3d]"
                    : "bg-[#c5ff3d] text-[#0a0a0e] hover:bg-[#d9ff6e]"
                }`}
              >
                {copied === c.code ? (
                  <>
                    <Check size={13} /> Copied
                  </>
                ) : (
                  <>
                    <Copy size={13} /> Copy
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventPromoCodes;
