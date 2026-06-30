"use client";

import { AuthSheet } from "@/components/auth/AuthSheet";
import { useAuthStore } from "@/store/auth";
import { useUIStore } from "@/store/uiStore";

export const SignInModal = () => {
  const open = useUIStore((s) => s.signInOpen);
  const close = useUIStore((s) => s.closeSignIn);
  const hydrate = useAuthStore((s) => s.hydrate);

  const handleAuthenticated = async () => {
    useAuthStore.setState({ hydrated: false });
    await hydrate();
    close();
  };

  return (
    <AuthSheet
      open={open}
      onClose={close}
      onAuthenticated={handleAuthenticated}
      headline="Sign in to Hoizr"
      subheadline="Use phone OTP to continue. Google is available when this browser origin is configured."
    />
  );
};
