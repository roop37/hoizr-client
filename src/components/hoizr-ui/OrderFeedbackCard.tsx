"use client";

import { submitCustomerFeedback } from "@/lib/feedback";
import { Loader2, Star } from "lucide-react";
import { useState } from "react";

/**
 * Full-width horizontal feedback card on the order page. Before the event it
 * asks how the Hoizr experience was (platform sentiment); after the event it
 * asks how the event was (→ the host's Feedbacks tab). One card, intent picked
 * by whether the event has ended.
 *
 * Layout: prompt/copy on the LEFT, star rating on the RIGHT (stacks on
 * mobile). Picking a rating reveals an optional remarks field + Submit. After
 * a successful submit the card unmounts entirely.
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
  const [dismissed, setDismissed] = useState(false);
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

  if (done && dismissed) return null;

  if (done) {
    const thankYou =
      rating <= 2
        ? "Thanks for the honest feedback — we'll use it to improve."
        : rating === 3
          ? "Thanks for sharing — means a lot."
          : "Glad you loved it! See you at the next one.";
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-white/80">{thankYou}</p>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="shrink-0 text-xs text-white/40 transition hover:text-white/70"
            aria-label="Dismiss"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  const showRemarks = rating > 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
        {/* LEFT — prompt */}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="mt-0.5 text-xs text-white/55">{sub}</p>
        </div>

        {/* RIGHT — star rating */}
        <div className="flex shrink-0 items-center gap-1">
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
      </div>

      {/* Revealed once a rating is picked — optional remarks + submit, inline
          on desktop, stacked on mobile. */}
      {showRemarks ? (
        <div className="mt-4 flex flex-col gap-2.5 border-t border-white/8 pt-4 md:flex-row md:items-end">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a note (optional)"
            rows={2}
            className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none transition focus:border-[var(--h-accent)]/60 placeholder:text-white/40 md:flex-1"
          />
          <button
            type="button"
            disabled={submitting}
            onClick={submit}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--h-accent)] px-5 text-sm font-semibold text-[#0a0a0e] disabled:opacity-50 md:w-auto"
          >
            {submitting ? <Loader2 size={15} className="animate-spin" /> : null}
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </div>
      ) : null}

      {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
    </div>
  );
};

export default OrderFeedbackCard;
