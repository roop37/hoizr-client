"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { AuthPanel } from "./AuthPanel";

type AuthSheetProps = {
  open: boolean;
  onClose: () => void;
  onAuthenticated: () => void | Promise<void>;
  headline?: string;
  subheadline?: string;
};

/**
 * Shared auth surface — bottom sheet on mobile, centred fluid-glass
 * modal on desktop. Used by both the global SignInModal and the
 * checkout-gate CheckoutAuthModal so we maintain one source of truth
 * for the auth chrome (scrim opacity, drag handle, body-lock, ESC,
 * focus return). The inner AuthPanel handles the actual flow.
 */
export const AuthSheet = ({
  open,
  onClose,
  onAuthenticated,
  headline,
  subheadline,
}: AuthSheetProps) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="h-auth-sheet-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="h-auth-sheet-title"
      onClick={onClose}
    >
      <div className="h-auth-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="h-auth-sheet-handle" aria-hidden />
        <button
          type="button"
          aria-label="Close sign-in"
          onClick={onClose}
          className="h-auth-sheet-close"
        >
          <X size={16} strokeWidth={2.2} />
        </button>
        <div className="h-auth-sheet-body">
          <h2 id="h-auth-sheet-title" className="sr-only">
            {headline ?? "Sign in"}
          </h2>
          <AuthPanel
            onAuthenticated={onAuthenticated}
            headline={headline}
            subheadline={subheadline}
          />
        </div>
      </div>
    </div>
  );
};
