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
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4 backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-auth-modal-title"
    >
      <div className="relative w-full max-w-md rounded-[24px] border border-white/12 bg-white/[0.08] p-5 text-white shadow-2xl backdrop-blur-2xl">
        <button
          type="button"
          aria-label="Close sign-in"
          onClick={onClose}
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-white/55 hover:bg-white/10 hover:text-white"
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
          subheadline="Use phone OTP to continue. We'll send your tickets to the email on file."
        />
      </div>
    </div>
  );
};
