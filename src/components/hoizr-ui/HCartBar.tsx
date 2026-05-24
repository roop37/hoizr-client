"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { clearActiveCart, readActiveCart, type ActiveCart } from "@/lib/active-cart";
import { rupee } from "@/lib/format";
import { GlassSurface } from "./GlassSurface";
import { HICONS } from "./icons";

/**
 * Bottom-center "continue to payment" bar — replaces the old music dock.
 * Mounts only when there's a live cart entry in localStorage with a
 * future expiresAt. Auto-hides while the customer is already on the
 * checkout / order detail pages (the cart is the foreground there).
 */
export const HCartBar = () => {
  const pathname = usePathname();
  const [cart, setCart] = useState<ActiveCart | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const sync = () => setCart(readActiveCart());
    sync();
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === "hoizr:active-cart") sync();
    };
    window.addEventListener("hoizr:active-cart-changed", sync);
    window.addEventListener("storage", onStorage);
    const tick = window.setInterval(() => setNow(Date.now()), 30 * 1000);
    return () => {
      window.removeEventListener("hoizr:active-cart-changed", sync);
      window.removeEventListener("storage", onStorage);
      window.clearInterval(tick);
    };
  }, []);

  if (!cart) return null;

  // Hide on the routes where the cart UI is already foregrounded.
  if (
    pathname?.startsWith("/checkout") ||
    pathname?.startsWith("/orders/") ||
    pathname?.startsWith("/login")
  ) {
    return null;
  }

  const expiresAt = new Date(cart.expiresAt).getTime();
  const msLeft = expiresAt - now;
  if (msLeft <= 0) {
    clearActiveCart();
    return null;
  }
  const mins = Math.max(0, Math.floor(msLeft / 60000));
  const secs = Math.max(0, Math.floor((msLeft % 60000) / 1000));
  const timeLabel = mins > 0 ? `${mins}m ${String(secs).padStart(2, "0")}s` : `${secs}s`;

  return (
    <div className="h-cartbar-wrap" role="status" aria-live="polite">
      <GlassSurface
        width="100%"
        height="100%"
        borderRadius={16}
        backgroundOpacity={0.6}
        saturation={1.4}
        blur={14}
        opacity={0.92}
        brightness={48}
      >
        <div className="h-cartbar">
          <div className="h-cartbar__cover">
            {cart.eventImage ? (
              <img src={cart.eventImage} alt={cart.eventTitle ?? "Cart event"} />
            ) : (
              <span style={{ display: "inline-flex", color: "var(--h-ink-2)" }}>
                {HICONS.ticket}
              </span>
            )}
          </div>
          <div className="h-cartbar__info">
            <div className="h-cartbar__title">
              {cart.eventTitle ?? "Continue your order"}
            </div>
            <div className="h-cartbar__meta">
              {rupee(cart.totalAmount)} · Holds for {timeLabel}
            </div>
          </div>
          <div className="h-cartbar__actions">
            <button
              type="button"
              className="h-cartbar__dismiss"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                clearActiveCart();
              }}
              aria-label="Dismiss"
              title="Dismiss"
            >
              {HICONS.close}
            </button>
            <Link
              href={`/checkout?eventId=${cart.eventId}`}
              className="h-cartbar__cta"
            >
              <span>Continue to payment</span>
              <span style={{ display: "inline-flex" }}>{HICONS.arrowR}</span>
            </Link>
          </div>
        </div>
      </GlassSurface>
    </div>
  );
};
