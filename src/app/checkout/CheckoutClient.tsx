"use client";

import { Loader2, Minus, Plus, ShoppingCart } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  buildAdjustedCartInput,
  isGuestInfoComplete,
  type GuestInfoDraft,
} from "@/app/checkout/cart-editing";
import { CheckoutAuthModal } from "@/components/auth/CheckoutAuthModal";
import {
  CenteredLoader,
  EmptyState,
  ErrorState,
} from "@/components/ui/feedback";
import { clearActiveCart, writeActiveCart } from "@/lib/active-cart";
import { rupee } from "@/lib/format";
import { gqlRequest } from "@/lib/graphql";
import {
  CONFIRM_PAYMENT_MUTATION,
  CREATE_ORDER_MUTATION,
  GET_CART_QUERY,
  REUSE_PENDING_ORDER_MUTATION,
  SET_CART_MUTATION,
} from "@/lib/queries";
import { getStoredAttribution, track } from "@/lib/tracker";
import { useAuthStore } from "@/store/auth";
import type {
  CartResponse,
  CreateOrderResponse,
  CustomerOrderView,
} from "@/types/order";
import type { RazorpayPaymentResponse } from "@/types/razorpay";

const RAZORPAY_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

const loadRazorpay = (): Promise<boolean> =>
  new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector(
      `script[src="${RAZORPAY_SCRIPT_SRC}"]`
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(Boolean(window.Razorpay)));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

const useCountdown = (expiresAt: string | null | undefined) => {
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      setRemaining(Math.max(0, Math.floor(diff / 1000)));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  return remaining;
};

export const CheckoutClient = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId");
  const retryOrderId = searchParams.get("retryOrderId");

  const profile = useAuthStore((s) => s.profile);
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrated = useAuthStore((s) => s.hydrated);

  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [updatingLine, setUpdatingLine] = useState<string | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [guestInfo, setGuestInfo] = useState<GuestInfoDraft>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);

  const remainingSeconds = useCountdown(cart?.expiresAt ?? null);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    // Inline modal instead of hard redirect — keeps the cart and event
    // context mounted while the customer signs in.
    if (hydrated && !profile) {
      setAuthModalOpen(true);
    } else if (profile) {
      setAuthModalOpen(false);
    }
  }, [hydrated, profile]);

  const handleAuthenticated = useCallback(async () => {
    useAuthStore.setState({ hydrated: false });
    await hydrate();
    setAuthModalOpen(false);
  }, [hydrate]);

  const closeAuthModal = useCallback(() => {
    // If the customer dismisses without signing in, send them back to
    // event browse rather than leaving them on a half-blocked checkout.
    if (!profile) {
      router.push("/events");
    } else {
      setAuthModalOpen(false);
    }
  }, [profile, router]);

  useEffect(() => {
    if (!profile) return;
    setGuestInfo({
      firstName: profile.firstName ?? "",
      lastName: profile.lastName ?? "",
      email: profile.email ?? "",
      phone: profile.phone ?? "",
    });
  }, [profile]);

  const fetchCart = useCallback(async () => {
    if (!eventId) {
      setFatalError("Missing event reference");
      setLoading(false);
      return;
    }
    setLoading(true);
    setFatalError(null);
    setActionError(null);
    try {
      const data = await gqlRequest<{ getCart: CartResponse | null }>(
        GET_CART_QUERY,
        { eventId }
      );
      if (!data.getCart) {
        setFatalError("Your cart has expired. Please reselect your tickets.");
        clearActiveCart();
      } else {
        setCart(data.getCart);
        if (data.getCart.expiresAt) {
          writeActiveCart({
            eventId,
            totalAmount: Number(data.getCart.pricing?.totalAmount ?? 0),
            expiresAt: data.getCart.expiresAt,
          });
        }
      }
    } catch (err: any) {
      setFatalError(
        err?.response?.errors?.[0]?.message ?? "Unable to fetch your cart"
      );
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (profile) fetchCart();
  }, [profile, fetchCart]);

  const updateCartLine = async (
    kind: "ticket" | "extra",
    lineId: string,
    delta: number
  ) => {
    if (!cart || !eventId) return;
    const key = `${kind}:${lineId}`;
    setUpdatingLine(key);
    setActionError(null);
    try {
      const data = await gqlRequest<{ setCart: CartResponse }>(
        SET_CART_MUTATION,
        { input: buildAdjustedCartInput(cart, kind, lineId, delta) }
      );
      setCart(data.setCart);
      if (data.setCart?.expiresAt) {
        writeActiveCart({
          eventId,
          totalAmount: Number(data.setCart.pricing?.totalAmount ?? 0),
          expiresAt: data.setCart.expiresAt,
        });
      }
      track("cartUpdated", {
        eventId,
        itemIds: [lineId],
        metadata: { kind, delta },
      });
    } catch (err: any) {
      setActionError(
        err?.response?.errors?.[0]?.message ??
          "Unable to update this cart. Please retry."
      );
    } finally {
      setUpdatingLine(null);
    }
  };

  const startPayment = async () => {
    if (!eventId || !cart || !profile) return;
    setActionError(null);
    if (!isGuestInfoComplete(guestInfo)) {
      setActionError("Add your name and a valid email before continuing.");
      return;
    }
    setPaying(true);

    // Read first-touch attribution from localStorage so the order
    // doc carries the campaign that brought this customer in.
    const attribution = getStoredAttribution();

    track("checkoutStarted", {
      eventId,
      metadata: {
        totalAmount: cart.pricing?.totalAmount,
        ticketCount: cart.tickets?.length ?? 0,
      },
    });

    try {
      // AUDIT-030: resume the existing PaymentPending order if the
      // customer was bounced here via /checkout?retryOrderId=… from
      // their order detail page. Reusing the order keeps the original
      // Razorpay order id alive (or refreshes it cleanly if the amount
      // drifted), eliminating the risk of two Razorpay orders both
      // capturing for the same intent.
      const createOrReusePromise = retryOrderId
        ? gqlRequest<{ reusePendingOrder: CreateOrderResponse }>(
            REUSE_PENDING_ORDER_MUTATION,
            { orderId: retryOrderId }
          ).then((d) => ({ createOrder: d.reusePendingOrder }))
        : gqlRequest<{ createOrder: CreateOrderResponse }>(
            CREATE_ORDER_MUTATION,
            {
              input: {
                eventId,
                guestInfo: {
                  firstName: guestInfo.firstName?.trim(),
                  lastName: guestInfo.lastName?.trim(),
                  email: guestInfo.email?.trim(),
                  phone: guestInfo.phone?.trim() || profile.phone,
                },
                utm: {
                  utmSource: attribution.utmSource,
                  utmMedium: attribution.utmMedium,
                  utmCampaign: attribution.utmCampaign,
                  utmTerm: attribution.utmTerm,
                  utmContent: attribution.utmContent,
                },
              },
            }
          );

      const createRes = await createOrReusePromise;

      const { checkout, order } = createRes.createOrder;
      if (!checkout) {
        track("checkoutCompleted", {
          eventId,
          orderId: order._id,
          metadata: { totalAmount: order.totalAmount, freeOrder: true },
        });
        router.push(`/orders/${order._id}?just_paid=1`);
        return;
      }

      track("checkoutPaymentInit", {
        eventId,
        orderId: order._id,
        metadata: { totalAmount: order.totalAmount },
      });

      const ready = await loadRazorpay();
      if (!ready) throw new Error("Unable to load Razorpay. Please retry.");

      await new Promise<void>((resolve, reject) => {
        const rp = new window.Razorpay!({
          key: checkout.razorpayKeyId,
          amount: Math.round(checkout.amount * 100),
          currency: checkout.currency,
          name: "Hoizr",
          description: `Order ${checkout.orderId}`,
          order_id: checkout.razorpayOrderId,
          prefill: {
            name: [profile.firstName, profile.lastName].filter(Boolean).join(" "),
            email: profile.email,
            contact: profile.phone,
          },
          theme: { color: "#0F8842" },
          handler: async (response: RazorpayPaymentResponse) => {
            try {
              await gqlRequest<{ confirmOrderPayment: CustomerOrderView }>(
                CONFIRM_PAYMENT_MUTATION,
                {
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                }
              );
              track("checkoutCompleted", {
                eventId,
                orderId: order._id,
                metadata: { totalAmount: order.totalAmount },
              });
              clearActiveCart();
              router.push(`/orders/${order._id}?just_paid=1`);
              resolve();
            } catch (err: any) {
              track("checkoutPaymentFailed", {
                eventId,
                orderId: order._id,
                metadata: {
                  stage: "confirm",
                  reason: err?.message ?? "unknown",
                },
              });
              reject(err);
            }
          },
          modal: {
            ondismiss: () => {
              track("checkoutPaymentFailed", {
                eventId,
                orderId: order._id,
                metadata: { stage: "razorpay-modal", reason: "cancelled" },
              });
              reject(new Error("Payment cancelled"));
            },
          },
        });
        rp.open();
      });
    } catch (err: any) {
      setActionError(
        err?.response?.errors?.[0]?.message ??
          err?.message ??
          "Payment could not be completed."
      );
    } finally {
      setPaying(false);
    }
  };

  if (!hydrated) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10 md:py-12">
        <CenteredLoader label="Preparing your cart…" />
      </div>
    );
  }

  if (!profile) {
    // Render the auth modal over a neutral backdrop instead of the
    // empty cart skeleton. Closing the modal without signing in routes
    // back to /events (see closeAuthModal).
    return (
      <>
        <div className="mx-auto w-full max-w-2xl px-4 py-10 md:py-12">
          <h1 className="text-2xl font-semibold md:text-3xl">
            Sign in to complete your booking
          </h1>
          <p className="mt-1 text-sm text-muted">
            We'll get you back to your cart as soon as you're signed in.
          </p>
        </div>
        <CheckoutAuthModal
          open={authModalOpen}
          onClose={closeAuthModal}
          onAuthenticated={handleAuthenticated}
        />
      </>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10 md:py-12">
        <CenteredLoader label="Preparing your cart…" />
      </div>
    );
  }

  if (fatalError) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <ErrorState
          title="Cart unavailable"
          message={fatalError}
          onRetry={() => router.push("/events")}
        />
      </div>
    );
  }

  if (!cart) {
    // Defensive guard — auth + cart lock both succeeded but no cart
    // came back. Steer the user to the browse page instead of showing
    // a blank screen.
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <EmptyState
          icon={<ShoppingCart size={28} />}
          title="Your cart is empty"
          description="Pick an event and add tickets to start a checkout."
          actionLabel="Browse events"
          actionHref="/events"
        />
      </div>
    );
  }

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const guestInfoReady = isGuestInfoComplete(guestInfo);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 md:py-12">
      <h1 className="text-2xl font-semibold md:text-3xl">Review your order</h1>
      <p className="mt-1 text-sm text-muted">
        Lock expires in{" "}
        <span className="font-semibold text-ink">
          {minutes}:{seconds.toString().padStart(2, "0")}
        </span>
      </p>

      <div className="mt-6 space-y-4">
        <div className="rounded-2xl border border-border bg-cream">
          <div className="border-b border-border px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
            Tickets
          </div>
          <div className="divide-y divide-border">
            {cart.tickets.map((line) => (
              <div
                key={line.ticketId}
                className="flex items-center justify-between gap-4 px-5 py-3 text-sm"
              >
                <div>
                  <div className="font-semibold">{line.ticketName}</div>
                  <div className="text-xs text-muted">
                    {rupee(line.unitPrice)} each
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-1">
                    <button
                      type="button"
                      aria-label={`Remove one ${line.ticketName}`}
                      disabled={
                        paying ||
                        updatingLine === `ticket:${line.ticketId}` ||
                        line.quantity <= 1
                      }
                      onClick={() => updateCartLine("ticket", line.ticketId, -1)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink disabled:opacity-30"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="min-w-[1.5rem] text-center text-sm font-semibold">
                      {updatingLine === `ticket:${line.ticketId}` ? (
                        <Loader2 size={13} className="mx-auto animate-spin" />
                      ) : (
                        line.quantity
                      )}
                    </span>
                    <button
                      type="button"
                      aria-label={`Add one ${line.ticketName}`}
                      disabled={paying || updatingLine === `ticket:${line.ticketId}`}
                      onClick={() => updateCartLine("ticket", line.ticketId, 1)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink disabled:opacity-30"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="min-w-[5rem] text-right font-semibold">
                    {rupee(line.totalPrice)}
                  </div>
                </div>
              </div>
            ))}
            {cart.extras.length ? (
              <div className="border-t border-border px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                Add-ons
              </div>
            ) : null}
            {cart.extras.map((line) => (
              <div
                key={line.extraId}
                className="flex items-center justify-between gap-4 px-5 py-3 text-sm"
              >
                <div>
                  <div className="font-semibold">{line.extraName}</div>
                  <div className="text-xs text-muted">
                    {rupee(line.unitPrice)} each
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-1">
                    <button
                      type="button"
                      aria-label={`Remove one ${line.extraName}`}
                      disabled={paying || updatingLine === `extra:${line.extraId}`}
                      onClick={() => updateCartLine("extra", line.extraId, -1)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink disabled:opacity-30"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="min-w-[1.5rem] text-center text-sm font-semibold">
                      {updatingLine === `extra:${line.extraId}` ? (
                        <Loader2 size={13} className="mx-auto animate-spin" />
                      ) : (
                        line.quantity
                      )}
                    </span>
                    <button
                      type="button"
                      aria-label={`Add one ${line.extraName}`}
                      disabled={paying || updatingLine === `extra:${line.extraId}`}
                      onClick={() => updateCartLine("extra", line.extraId, 1)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink disabled:opacity-30"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="min-w-[5rem] text-right font-semibold">
                    {rupee(line.totalPrice)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-cream p-5 text-sm">
          <div className="flex justify-between py-1">
            <span className="text-muted">Subtotal</span>
            <span className="font-medium">{rupee(cart.pricing.grossAmount)}</span>
          </div>
          {cart.pricing.taxes > 0 ? (
            <div className="flex justify-between py-1">
              <span className="text-muted">
                Ticket GST ({cart.pricing.taxesPercent}%)
              </span>
              <span className="font-medium">{rupee(cart.pricing.taxes)}</span>
            </div>
          ) : null}
          <div className="flex justify-between py-1">
            <span className="text-muted">
              Platform fee ({cart.pricing.applicationFeePercent}%)
            </span>
            <span className="font-medium">{rupee(cart.pricing.applicationFee)}</span>
          </div>
          {cart.pricing.platformFeeGst > 0 ? (
            <div className="flex justify-between py-1">
              <span className="text-muted">GST on platform fee (18%)</span>
              <span className="font-medium">{rupee(cart.pricing.platformFeeGst)}</span>
            </div>
          ) : null}
          <div className="mt-2 flex justify-between border-t border-border pt-2 text-base">
            <span className="font-semibold">Total payable</span>
            <span className="font-semibold">{rupee(cart.pricing.totalAmount)}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-cream p-5 text-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-semibold">Your details</div>
              <p className="mt-1 text-xs text-muted">
                These details appear on the booking and payment receipt.
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                guestInfoReady
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {guestInfoReady ? "Ready" : "Needed"}
            </span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-muted">First name</span>
              <input
                value={guestInfo.firstName ?? ""}
                onChange={(e) =>
                  setGuestInfo((current) => ({
                    ...current,
                    firstName: e.target.value,
                  }))
                }
                className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-accent"
                autoComplete="given-name"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-muted">Last name</span>
              <input
                value={guestInfo.lastName ?? ""}
                onChange={(e) =>
                  setGuestInfo((current) => ({
                    ...current,
                    lastName: e.target.value,
                  }))
                }
                className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-accent"
                autoComplete="family-name"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold text-muted">Email</span>
              <input
                type="email"
                value={guestInfo.email ?? ""}
                onChange={(e) =>
                  setGuestInfo((current) => ({
                    ...current,
                    email: e.target.value,
                  }))
                }
                className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-accent"
                autoComplete="email"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold text-muted">Phone</span>
              <input
                value={guestInfo.phone ?? ""}
                onChange={(e) =>
                  setGuestInfo((current) => ({
                    ...current,
                    phone: e.target.value,
                  }))
                }
                className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-accent"
                autoComplete="tel"
              />
            </label>
          </div>
        </div>

        {actionError ? (
          <ErrorState
            title="Couldn't update your order"
            message={actionError}
          />
        ) : null}

        <button
          type="button"
          disabled={paying || updatingLine !== null || remainingSeconds <= 0}
          onClick={startPayment}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-cream transition hover:opacity-95 disabled:opacity-50"
        >
          {paying ? (
            <Loader2 size={16} className="animate-spin" />
          ) : remainingSeconds <= 0 ? (
            "Cart expired"
          ) : cart.pricing.totalAmount <= 0 ? (
            "Confirm booking"
          ) : (
            `Pay ${rupee(cart.pricing.totalAmount)}`
          )}
        </button>
        <p className="text-center text-xs text-muted">
          {cart.pricing.totalAmount <= 0
            ? "No payment is needed for this booking."
            : "Secured by Razorpay. Cards, UPI, net-banking, and wallets supported."}
        </p>

        {/* AUDIT-034: SoT §27 disclosure on point of sale. Hoizr is the
            ticketing platform — the organiser owns and runs the event. */}
        <p className="text-center text-xs text-muted">
          Ticketing by Hoizr. The event itself is run by the organiser —
          Hoizr is not the event organiser.
        </p>
      </div>
    </div>
  );
};
