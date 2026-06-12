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
    <div className="h-glass-card mt-4 p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2 text-white/85">
        <TicketPercent size={16} className="text-[#9CCB3B]" />
        <span className="text-sm font-semibold">Offers & promo codes</span>
      </div>
      <div className="flex flex-col gap-2.5">
        {coupons.map((c) => (
          <div
            key={c.code}
            className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.04] px-4 py-3"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-bold tracking-wider text-white">
                  {c.code}
                </span>
                <span className="rounded-full bg-[#9CCB3B]/15 px-2 py-0.5 text-[11px] font-semibold text-[#9CCB3B]">
                  {c.discountLabel}
                </span>
              </div>
              <div className="mt-0.5 truncate text-xs text-white/55">
                {c.description ||
                  (c.minCartValue
                    ? `On orders over ₹${c.minCartValue}`
                    : "Apply at checkout")}
              </div>
            </div>
            <button
              type="button"
              onClick={() => copy(c.code)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/[0.1]"
            >
              {copied === c.code ? (
                <>
                  <Check size={13} className="text-[#9CCB3B]" /> Copied
                </>
              ) : (
                <>
                  <Copy size={13} /> Copy
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventPromoCodes;
