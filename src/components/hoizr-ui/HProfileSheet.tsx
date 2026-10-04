"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAuthStore } from "@/store/auth";
import { useUIStore } from "@/store/uiStore";
import { HICONS } from "./icons";

/**
 * Mobile "Profile" bottom sheet — opened from the bottom-tab Profile button.
 * Mirrors the desktop sidebar's library menu so a fan reaches account, orders,
 * artists, venues, Hoizr Local and the organizer CTA from the bottom bar.
 *
 * Reuses the AuthSheet chrome classes (.h-auth-sheet-overlay / .h-auth-sheet)
 * so the existing globals.css `:has()` rule already hides the bottom tab bar +
 * cart bar while it's open. Bottom sheet on mobile, centered modal ≥769px.
 */

type SheetLink = {
  href: string;
  label: string;
  icon: React.ReactNode;
  external?: boolean;
  authOnly?: boolean;
};

// Mirrors HSide LIBRARY_NAV. `authOnly` items are hidden when signed out.
const LINKS: SheetLink[] = [
  { href: "/me", label: "Profile", icon: HICONS.user, authOnly: true },
  { href: "/orders", label: "My Orders", icon: HICONS.ticket, authOnly: true },
  { href: "/artist", label: "Artists", icon: HICONS.mic },
  { href: "/venues", label: "Venues", icon: HICONS.pin },
];

export const HProfileSheet = () => {
  const open = useUIStore((s) => s.profileSheetOpen);
  const close = useUIStore((s) => s.closeProfileSheet);
  const openSignIn = useUIStore((s) => s.openSignIn);
  const signedIn = Boolean(useAuthStore((s) => s.profile));

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, close]);

  if (!open || !mounted) return null;

  const visibleLinks = LINKS.filter((l) => !l.authOnly || signedIn);

  return createPortal(
    <div
      className="h-auth-sheet-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      onClick={close}
    >
      <div className="h-auth-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="h-auth-sheet-handle" aria-hidden />
        <div className="h-auth-sheet-body">
          <div className="flex flex-col gap-1.5">
            {visibleLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={close}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[15px] font-semibold text-white transition active:bg-white/[0.08]"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#c5ff3d]/15 text-[#c5ff3d]">
                  {l.icon}
                </span>
                {l.label}
              </Link>
            ))}

            {/* ── SIGN-IN (mobile profile sheet) ─────────────────────────────
                Re-enabled 2026-07-18 (Hoizr live): OTP delivers via MSG91
                WhatsApp+SMS in prod; dev accepts 000000 (SERVER_ENV bypass). */}
            {!signedIn ? (
              <button
                type="button"
                onClick={() => {
                  close();
                  openSignIn();
                }}
                className="mt-1 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#c5ff3d] text-[15px] font-semibold text-[#0a0a0e] transition active:bg-[#d9ff6e]"
              >
                Sign in
              </button>
            ) : null}
          </div>

          {/* Hoizr Local — coming soon */}
          <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#c5ff3d]/15 text-[#c5ff3d]">
              {HICONS.globe}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[13px] font-semibold text-white">
                Hoizr Local
                <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white/55">
                  Soon
                </span>
              </div>
              <div className="text-[11px] leading-snug text-white/55">
                Crazy houseparties &amp; foodspots near you.
              </div>
            </div>
          </div>

          {/* For organizers — List on Hoizr */}
          <a
            href="https://business.hoizr.com"
            target="_blank"
            rel="noreferrer"
            className="h-side-biz__card mt-3"
          >
            <span className="h-side-biz__kicker">For organizers</span>
            <span className="h-side-biz__hed">
              Own the room.{" "}
              <span className="h-side-biz__hed-accent">Own the repeat.</span>
            </span>
            <span className="h-side-biz__cta">
              List on Hoizr
              <span className="h-side-biz__arrow" aria-hidden>
                ↗
              </span>
            </span>
          </a>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default HProfileSheet;
