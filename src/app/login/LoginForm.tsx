"use client";

import { useRouter } from "next/navigation";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { useAuthStore } from "@/store/auth";

export const LoginForm = ({ next }: { next: string }) => {
  const router = useRouter();
  const hydrate = useAuthStore((s) => s.hydrate);

  const handleAuthenticated = async () => {
    // Re-hydrate auth state from the freshly-set server cookies, then
    // route back to wherever the user originally headed.
    useAuthStore.setState({ hydrated: false });
    await hydrate();
    router.push(next || "/");
  };

  return (
    <AuthPanel
      onAuthenticated={handleAuthenticated}
      headline="Sign in to Hoizr"
      subheadline="Use phone OTP to continue. Google is available when this browser origin is configured."
    />
  );
};
