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
 * Visually tuned for the dark Apple-Music-inspired shell (see
 * globals.css). Each surface uses translucent white-on-dark glass
 * with neon-chartreuse accents — never bare cream on dark, which
 * looked like un-styled boilerplate against the gradient body.
 */

type SkeletonProps = {
  className?: string;
};

export const Skeleton = ({ className = "" }: SkeletonProps) => (
  <div
    className={`animate-pulse rounded-md bg-white/[0.06] ${className}`}
    aria-hidden="true"
  />
);

type CardSkeletonProps = {
  lines?: number;
};

export const CardSkeleton = ({ lines = 3 }: CardSkeletonProps) => (
  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl">
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

export const CenteredLoader = ({
  label = "Loading…",
  small = false,
}: CenteredLoaderProps) => (
  <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-sm text-white/70">
    <Loader2
      className={`animate-spin text-[#c5ff3d] ${small ? "h-5 w-5" : "h-8 w-8"}`}
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

export const EmptyState = ({
  title,
  description,
  icon,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) => (
  <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-10 text-center backdrop-blur-xl">
    {icon && (
      <div className="mb-4 flex items-center justify-center text-[#c5ff3d]">
        {icon}
      </div>
    )}
    <h3 className="text-lg font-semibold text-white">{title}</h3>
    {description && (
      <p className="mt-2 text-sm leading-6 text-white/65">{description}</p>
    )}
    {actionLabel && (actionHref || onAction) && (
      <div className="mt-5">
        {actionHref ? (
          <Link
            href={actionHref}
            className="inline-flex items-center justify-center rounded-full bg-[#c5ff3d] px-5 py-2 text-sm font-semibold text-[#0a0a0e] transition hover:bg-[#d9ff6e]"
          >
            {actionLabel}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center justify-center rounded-full bg-[#c5ff3d] px-5 py-2 text-sm font-semibold text-[#0a0a0e] transition hover:bg-[#d9ff6e]"
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

export const ErrorState = ({
  title = "Something went wrong",
  message,
  onRetry,
}: ErrorStateProps) => (
  <div
    role="alert"
    className="rounded-2xl border border-rose-400/30 bg-rose-500/[0.08] p-5 text-sm text-rose-100 backdrop-blur-xl"
  >
    <div className="font-semibold">{title}</div>
    <p className="mt-1 leading-6 text-rose-100/85">{message}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 inline-flex items-center justify-center rounded-full border border-rose-300/40 bg-white/5 px-4 py-1.5 text-sm font-semibold text-rose-100 transition hover:bg-white/10"
      >
        Try again
      </button>
    )}
  </div>
);
