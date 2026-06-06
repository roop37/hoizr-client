"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { CenteredLoader } from "@/components/ui/feedback";
import { useAuthStore } from "@/store/auth";

export const LoginForm = ({ next }: { next: string }) => {
  const router = useRouter();
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrated = useAuthStore((s) => s.hydrated);
  const profile = useAuthStore((s) => s.profile);

  // If someone hits /login with a valid session already in flight,
  // bounce them out instead of showing the form. The server doesn't
  // run a redirect here (the route is statically declared), so we
  // do it on the client once hydration confirms the cookie maps to a
  // real customer.
  useEffect(() => {
    if (!hydrated) {
      hydrate();
    }
  }, [hydrated, hydrate]);

  useEffect(() => {
    if (hydrated && profile) {
      router.replace(next || "/");
    }
  }, [hydrated, profile, router, next]);

  const handleAuthenticated = async () => {
    // Re-hydrate auth state from the freshly-set server cookies, then
    // route back to wherever the user originally headed.
    useAuthStore.setState({ hydrated: false });
    await hydrate();
    router.push(next || "/");
  };

  // Loading / already-signed-in branch — render a quiet loader rather
  // than the auth panel so the user doesn't see a flash of the
  // sign-in UI before the redirect lands.
  if (!hydrated || profile) {
    return (
      <div className="py-10">
        <CenteredLoader
          label={profile ? "Taking you to Hoizr…" : "Checking your session…"}
        />
      </div>
    );
  }

  return (
    <AuthPanel
      onAuthenticated={handleAuthenticated}
      headline="Sign in to Hoizr"
      subheadline="Use phone OTP to continue. Google is available when this browser origin is configured."
    />
  );
};
