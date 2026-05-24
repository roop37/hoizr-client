"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { AuthPanel } from "./AuthPanel";

type CheckoutAuthModalProps = {
  open: boolean;
  onClose: () => void;
  onAuthenticated: () => void | Promise<void>;
};

/**
 * Modal-overlay auth gate used by /checkout when an unauthenticated
 * customer tries to proceed. Lives over the checkout page so the cart
 * stays mounted — once auth resolves the modal closes and the customer
 * picks up where they left off, no hard redirect, no cart-reload race.
 */
export const CheckoutAuthModal = ({
  open,
  onClose,
  onAuthenticated,
}: CheckoutAuthModalProps) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-auth-modal-title"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-cream p-5 shadow-2xl">
        <button
          type="button"
          aria-label="Close sign-in"
          onClick={onClose}
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-background hover:text-ink"
        >
          <X size={16} />
        </button>
        <h2
          id="checkout-auth-modal-title"
          className="sr-only"
        >
          Sign in to complete your booking
        </h2>
        <AuthPanel
          onAuthenticated={onAuthenticated}
          headline="Sign in to complete your booking"
          subheadline="Your cart is held while you sign in. We'll send your tickets to the email on file."
        />
      </div>
    </div>
  );
};
