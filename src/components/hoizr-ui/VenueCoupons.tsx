"use client";

import { useEffect, useState } from "react";
import { gqlRequest } from "@/lib/graphql";
import {
  CLAIM_LOYALTY_REWARD_MUTATION,
  GET_VENUE_COUPONS_QUERY,
  type ClaimRewardResult,
  type VenueCoupon,
  type VenueCoupons as VenueCouponsData,
} from "@/lib/venue-queries";

/**
 * Offers + loyalty rewards on a venue page. Public promos show to everyone;
 * loyalty rewards show ONLY when the signed-in customer qualifies (the server
 * filters by their balance and never returns the number). Claiming spends
 * points and reveals a personal, single-use coupon code to use at checkout.
 */
export function VenueCoupons({ hostId }: { hostId: string }) {
  const [data, setData] = useState<VenueCouponsData | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [claimed, setClaimed] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await gqlRequest<{ venueCoupons: VenueCouponsData }>(
        GET_VENUE_COUPONS_QUERY,
        { hostId }
      );
      setData(res.venueCoupons ?? { public: [], loyalty: [] });
    } catch (err) {
      console.error("Failed to load venue coupons", err);
      setData({ public: [], loyalty: [] });
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostId]);

  const claim = async (rewardId: string) => {
    setError(null);
    setClaiming(rewardId);
    try {
      const res = await gqlRequest<{ claimLoyaltyReward: ClaimRewardResult }>(
        CLAIM_LOYALTY_REWARD_MUTATION,
        { rewardId }
      );
      setClaimed((c) => ({ ...c, [rewardId]: res.claimLoyaltyReward.code }));
      // Refresh so the reward drops off the eligible list if now exhausted.
      load();
    } catch (err: any) {
      const msg: string = err?.response?.errors?.[0]?.message ?? "Couldn't claim this reward";
      if (/sign in|log ?in|authenticat/i.test(msg)) {
        window.location.href = "/login";
        return;
      }
      setError(msg);
    } finally {
      setClaiming(null);
    }
  };

  if (!data) return null;
  const hasAny = data.public.length > 0 || data.loyalty.length > 0;
  if (!hasAny) return null;

  const PublicCard = (c: VenueCoupon) => (
    <div
      key={`pub-${c.code}`}
      className="rounded-2xl border border-white/10 bg-white/5 p-4"
    >
      <p className="text-sm font-semibold text-white">{c.title}</p>
      <p className="mt-1 text-[#D6FF3F]">{c.label}</p>
      {c.code ? (
        <p className="mt-2 font-mono text-xs text-white/70">
          Code: <span className="text-white">{c.code}</span>
        </p>
      ) : null}
    </div>
  );

  const LoyaltyCard = (c: VenueCoupon) => {
    const code = c.rewardId ? claimed[c.rewardId] : undefined;
    return (
      <div
        key={`loy-${c.rewardId}`}
        className="rounded-2xl border border-[#D6FF3F]/30 bg-[#D6FF3F]/5 p-4"
      >
        <p className="text-sm font-semibold text-white">{c.title}</p>
        <p className="mt-1 text-[#D6FF3F]">{c.label}</p>
        {c.description ? (
          <p className="mt-1 text-xs text-white/55">{c.description}</p>
        ) : null}
        {code ? (
          <div className="mt-3 rounded-xl bg-black/40 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-white/50">
              Your code — use it at checkout
            </p>
            <p className="font-mono text-sm text-[#D6FF3F]">{code}</p>
          </div>
        ) : (
          <button
            onClick={() => c.rewardId && claim(c.rewardId)}
            disabled={claiming === c.rewardId}
            className="mt-3 rounded-full bg-[#D6FF3F] px-4 py-1.5 text-sm font-semibold text-black disabled:opacity-60"
          >
            {claiming === c.rewardId ? "Claiming…" : "Claim reward"}
          </button>
        )}
      </div>
    );
  };

  return (
    <section className="mt-8">
      {data.loyalty.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-lg font-semibold text-white">Your rewards</h2>
          <p className="mb-3 text-sm text-white/55">
            Rewards you&rsquo;ve unlocked with this organiser. Claim one to get a
            personal coupon for your next booking.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {data.loyalty.map(LoyaltyCard)}
          </div>
          {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
        </div>
      )}
      {data.public.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-white">Offers</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {data.public.map(PublicCard)}
          </div>
        </div>
      )}
    </section>
  );
}
