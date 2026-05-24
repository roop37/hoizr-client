/**
 * Local-only "you have an active cart" pointer.
 *
 * customer-server doesn't expose a list-all-carts query. To surface a
 * "Continue to payment" prompt without one, we persist the most recent
 * cart's identifying details to localStorage when SetCart succeeds, and
 * clear them on checkout completion or when the cart expires.
 *
 * This is best-effort: if the customer wipes storage, switches devices,
 * or never had a chance to write here, the bar simply won't show. The
 * server is still the source of truth for cart state during checkout.
 */

const KEY = "hoizr:active-cart";

export type ActiveCart = {
  eventId: string;
  eventSlug?: string;
  eventTitle?: string;
  eventImage?: string;
  totalAmount: number;
  expiresAt: string; // ISO
};

const safeWindow = (): Window | null =>
  typeof window === "undefined" ? null : window;

export const readActiveCart = (): ActiveCart | null => {
  const w = safeWindow();
  if (!w) return null;
  try {
    const raw = w.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActiveCart;
    if (!parsed.eventId || !parsed.expiresAt) return null;
    if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
      w.localStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch {
    w.localStorage.removeItem(KEY);
    return null;
  }
};

export const writeActiveCart = (cart: ActiveCart) => {
  const w = safeWindow();
  if (!w) return;
  try {
    w.localStorage.setItem(KEY, JSON.stringify(cart));
    w.dispatchEvent(new CustomEvent("hoizr:active-cart-changed"));
  } catch {
    // storage quota or disabled — fail silent
  }
};

export const clearActiveCart = () => {
  const w = safeWindow();
  if (!w) return;
  try {
    w.localStorage.removeItem(KEY);
    w.dispatchEvent(new CustomEvent("hoizr:active-cart-changed"));
  } catch {
    // ignore
  }
};
