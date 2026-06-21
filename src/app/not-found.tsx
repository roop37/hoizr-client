import Link from "next/link";
import { HoizrLogo } from "@/components/hoizr-ui/HoizrLogo";

/**
 * Branded 404 — replaces Next's bare default so a dead link (e.g. a stale
 * event slug) lands on a Hoizr-styled page instead of an unstyled one.
 */
export default function NotFound() {
  return (
    <main
      className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6 text-center"
      style={{ background: "var(--h-bg, #0a0a0e)", color: "var(--h-ink, #fff)" }}
    >
      {/* Ambient accent glow, consistent with the storefront surfaces. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-1/3 left-1/2 h-[60vh] w-[60vh] -translate-x-1/2 rounded-full opacity-[0.18] blur-[120px]"
        style={{ background: "var(--h-accent)" }}
      />

      <div className="relative z-10 flex flex-col items-center">
        <HoizrLogo size="default" href="/" />

        <p className="mt-10 text-xs font-semibold uppercase tracking-[0.28em] opacity-45">
          Error 404
        </p>
        <h1
          className="mt-3 text-6xl font-bold leading-none sm:text-7xl"
          style={{ color: "var(--h-accent)" }}
        >
          Lost the beat
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed opacity-60">
          This page moved, ended, or never existed. The event you’re after might
          have a new link — head back and find your next night out.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className="h-btn h-btn-accent">
            Back to home
          </Link>
          <Link
            href="/events"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-white/15 px-5 text-sm font-semibold text-white transition hover:border-white/35"
          >
            Browse events
          </Link>
        </div>
      </div>
    </main>
  );
}
