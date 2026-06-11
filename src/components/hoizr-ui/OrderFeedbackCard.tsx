"use client";

import { submitCustomerFeedback } from "@/lib/feedback";
import { CheckCircle2, Star } from "lucide-react";
import { useState } from "react";

/**
 * Small inline feedback card on the order page. Before the event it asks how
 * the Hoizr experience was (platform sentiment); after the event it asks how
 * the event was (→ the host's Feedbacks tab). One card, intent picked by
 * whether the event has ended.
 */
export const OrderFeedbackCard = ({
  orderId,
  eventEnded,
}: {
  orderId: string;
  eventEnded: boolean;
}) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = eventEnded
    ? "How was the event?"
    : "How's your Hoizr experience?";
  const sub = eventEnded
    ? "Your review helps the organiser and other fans."
    : "We constantly upgrade Hoizr — tell us how we're doing.";

  const submit = async () => {
    if (!rating && !comment.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitCustomerFeedback({
        orderId,
        kind: eventEnded ? "EVENT" : "HOIZR_PLATFORM",
        context: eventEnded ? "CUSTOMER_POST_EVENT" : "CUSTOMER_POST_PURCHASE",
        rating: rating || undefined,
        comment: comment.trim() || undefined,
      });
      setDone(true);
    } catch (e: any) {
      setError(
        e?.response?.errors?.[0]?.message ?? "Couldn't submit — please retry."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/70">
        <CheckCircle2 size={18} className="text-[#34d399]" />
        Thanks for the feedback!
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-0.5 text-xs text-white/55">{sub}</p>

      <div className="mt-3 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => setRating(i)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${i} star`}
          >
            <Star
              size={26}
              className={
                i <= (hover || rating)
                  ? "fill-amber-400 text-amber-400"
                  : "text-white/25"
              }
            />
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Add a note (optional)"
        rows={2}
        className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none transition focus:border-[var(--h-accent)]/60 placeholder:text-white/40"
      />

      {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}

      <button
        type="button"
        disabled={submitting || (!rating && !comment.trim())}
        onClick={submit}
        className="mt-3 h-10 w-full rounded-xl bg-[var(--h-accent)] text-sm font-semibold text-[#0a0a0e] disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit feedback"}
      </button>
    </div>
  );
};

export default OrderFeedbackCard;
