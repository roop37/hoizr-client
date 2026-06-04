"use client";

import { AuthSheet } from "./AuthSheet";

type CheckoutAuthModalProps = {
  open: boolean;
  onClose: () => void;
  onAuthenticated: () => void | Promise<void>;
};

/**
 * Auth gate used by /checkout when an unauthenticated customer tries
 * to proceed. Lives over the checkout page so the cart stays mounted
 * — once auth resolves the sheet closes and the customer picks up
 * where they left off, no hard redirect, no cart-reload race.
 *
 * Chrome is the shared AuthSheet (bottom sheet on mobile, fluid-glass
 * modal on desktop); flow logic is unchanged.
 */
export const CheckoutAuthModal = ({
  open,
  onClose,
  onAuthenticated,
}: CheckoutAuthModalProps) => (
  <AuthSheet
    open={open}
    onClose={onClose}
    onAuthenticated={onAuthenticated}
    headline="Sign in to complete your booking"
    subheadline="Use phone OTP to continue. We'll send your tickets to the email on file."
  />
);
