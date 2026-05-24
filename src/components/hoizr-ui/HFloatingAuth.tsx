"use client";

import { useUIStore } from "@/store/uiStore";

/**
 * Tiny floating auth chip pinned to the top-right of the content column.
 * Replaces the old top bar. Transparent until hover — keeps the content
 * visually unblocked while still surfacing Sign in / the avatar.
 */
export const HFloatingAuth = () => {
  const user = useUIStore((s) => s.user);
  const openSignIn = useUIStore((s) => s.openSignIn);

  return (
    <div className="h-float-auth">
      {!user.signedIn ? (
        <button type="button" onClick={openSignIn} className="h-float-auth__btn">
          Sign in
        </button>
      ) : (
        <button type="button" className="h-float-auth__avatar" aria-label={user.name}>
          {user.initials}
        </button>
      )}
    </div>
  );
};
