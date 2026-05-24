"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Shared "no data" / "loading" / "something broke" surfaces for the
 * customer-facing screens. Centralised so the Orders, Checkout, and
 * Browse pages all read like the same product — and so a future
 * design tweak (radius, padding, copy tone) is a one-file change.
 *
 * No external dependencies beyond lucide-react and next/link, both of
 * which the rest of hoizr-client already uses.
 */

type SkeletonProps = {
  className?: string;
};

/**
 * Animated placeholder block. Use plain Tailwind classes for size + radius;
 * the shimmer comes from `animate-pulse` on the bg colour.
 */
export const Skeleton = ({ className = "" }: SkeletonProps) => (
  <div
    className={`animate-pulse rounded-md bg-border/60 ${className}`}
    aria-hidden="true"
  />
);

type CardSkeletonProps = {
  lines?: number;
};

/**
 * Generic card-shaped skeleton with a title bar, body lines, and an
 * action stub. Good for ticket cards, event cards, order rows.
 */
export const CardSkeleton = ({ lines = 3 }: CardSkeletonProps) => (
  <div className="rounded-xl border border-border bg-cream p-5 shadow-sm">
    <Skeleton className="mb-3 h-5 w-1/3" />
    {Array.from({ length: lines }).map((_, idx) => (
      <Skeleton
        key={idx}
        className={`mt-2 h-4 ${idx === lines - 1 ? "w-2/3" : "w-full"}`}
      />
    ))}
    <Skeleton className="mt-4 h-9 w-32" />
  </div>
);

type CenteredLoaderProps = {
  label?: string;
  small?: boolean;
};

/**
 * Centered spinner with optional caption. Replaces the inline
 * `<Loader2 className="animate-spin">` blocks scattered across the app
 * so spinner sizing + colour stays consistent.
 */
export const CenteredLoader = ({
  label = "Loading…",
  small = false,
}: CenteredLoaderProps) => (
  <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-sm text-muted">
    <Loader2
      className={`animate-spin text-accent ${small ? "h-5 w-5" : "h-8 w-8"}`}
    />
    <span>{label}</span>
  </div>
);

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
};

/**
 * "Nothing here yet" panel. Always wrap the empty surface in a card so
 * the page never collapses to nothing visible. Either pass an
 * `actionHref` (renders as a link) or `onAction` (renders as a button)
 * — using both is allowed but href wins.
 */
export const EmptyState = ({
  title,
  description,
  icon,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) => (
  <div className="rounded-2xl border border-dashed border-border bg-cream p-10 text-center">
    {icon && (
      <div className="mb-4 flex items-center justify-center text-accent">
        {icon}
      </div>
    )}
    <h3 className="text-lg font-semibold text-ink">{title}</h3>
    {description && (
      <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
    )}
    {actionLabel && (actionHref || onAction) && (
      <div className="mt-5">
        {actionHref ? (
          <Link
            href={actionHref}
            className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2 text-sm font-semibold text-cream transition hover:opacity-90"
          >
            {actionLabel}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2 text-sm font-semibold text-cream transition hover:opacity-90"
          >
            {actionLabel}
          </button>
        )}
      </div>
    )}
  </div>
);

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

/**
 * Inline failure panel — red-tinted, optional retry button. Used by
 * client-side data fetches when the network or API explodes; SSR
 * pages should still rely on `notFound()` / error.tsx routes.
 */
export const ErrorState = ({
  title = "Something went wrong",
  message,
  onRetry,
}: ErrorStateProps) => (
  <div
    role="alert"
    className="rounded-xl border border-red-300 bg-red-50 p-5 text-sm text-red-800"
  >
    <div className="font-semibold">{title}</div>
    <p className="mt-1 leading-6">{message}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 inline-flex items-center justify-center rounded-full border border-red-300 bg-cream px-4 py-1.5 text-sm font-semibold text-red-800 transition hover:bg-red-100"
      >
        Try again
      </button>
    )}
  </div>
);
