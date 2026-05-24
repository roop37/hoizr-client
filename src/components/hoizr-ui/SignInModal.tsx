"use client";

import { useEffect } from "react";
import { useUIStore } from "@/store/uiStore";
import { HICONS } from "./icons";

export const SignInModal = () => {
  const open = useUIStore((s) => s.signInOpen);
  const close = useUIStore((s) => s.closeSignIn);
  const signIn = useUIStore((s) => s.signIn);

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

  return (
    <div className="h-scrim" onClick={close}>
      <div className="h-modal h-signin" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="h-modal-close" onClick={close} aria-label="Close">
          {HICONS.close}
        </button>
        <h2>Welcome to Hoizr</h2>
        <p>Sign in to save events, get presale alerts, and pick up tickets at the door.</p>
        <div className="field">
          <label htmlFor="hoizr-signin-mobile">Mobile</label>
          <input id="hoizr-signin-mobile" placeholder="+91 98XXX XXXXX" />
        </div>
        <button type="button" className="h-btn h-btn-accent h-btn-lg" onClick={() => signIn()}>
          Send OTP
        </button>
        <div className="or">or continue with</div>
        <div className="socials">
          <button type="button" onClick={() => signIn()}>
            {HICONS.google}
            <span>Google</span>
          </button>
          <button type="button" onClick={() => signIn()}>
            {HICONS.apple}
            <span>Apple</span>
          </button>
          <button type="button" onClick={() => signIn()}>
            {HICONS.spotify}
            <span>Spotify</span>
          </button>
        </div>
        <div className="fine">By continuing you agree to our Terms &amp; Privacy.</div>
      </div>
    </div>
  );
};
