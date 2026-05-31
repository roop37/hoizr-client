"use client";

import { useEffect } from "react";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { useAuthStore } from "@/store/auth";
import { useUIStore } from "@/store/uiStore";
import { HICONS } from "./icons";

export const SignInModal = () => {
  const open = useUIStore((s) => s.signInOpen);
  const close = useUIStore((s) => s.closeSignIn);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  if (!open) return null;

  const handleAuthenticated = async () => {
    useAuthStore.setState({ hydrated: false });
    await hydrate();
    close();
  };

  return (
    <div className="h-scrim" onClick={close}>
      <div className="h-modal h-signin h-signin-real" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="h-modal-close" onClick={close} aria-label="Close">
          {HICONS.close}
        </button>
        <AuthPanel
          onAuthenticated={handleAuthenticated}
          headline="Sign in to Hoizr"
          subheadline="Use phone OTP to continue. Google is available when this browser origin is configured."
        />
      </div>
    </div>
  );
};
