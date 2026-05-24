"use client";

import { LogOut, UserCircle2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth";

export const HeaderAuthLinks = () => {
  const [open, setOpen] = useState(false);
  const profile = useAuthStore((s) => s.profile);
  const hydrated = useAuthStore((s) => s.hydrated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  if (!hydrated) {
    return <div className="h-9 w-20 rounded-full bg-background animate-pulse" />;
  }

  if (!profile) {
    return (
      <Link
        href="/login"
        className="rounded-full bg-dark px-4 py-1.5 text-cream text-sm font-medium transition hover:opacity-90"
      >
        Sign in
      </Link>
    );
  }

  const displayName =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
    profile.phone;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-cream px-3 py-1.5 text-sm font-medium hover:bg-background"
      >
        <UserCircle2 size={16} />
        <span className="max-w-[120px] truncate">{displayName}</span>
      </button>
      {open ? (
        <div
          className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-cream shadow-lg"
          onMouseLeave={() => setOpen(false)}
        >
          <Link
            href="/orders"
            className="block px-4 py-2 text-sm hover:bg-background"
            onClick={() => setOpen(false)}
          >
            My tickets
          </Link>
          <Link
            href="/me/artists"
            className="block px-4 py-2 text-sm hover:bg-background"
            onClick={() => setOpen(false)}
          >
            Following
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="flex w-full items-center gap-2 border-t border-border px-4 py-2 text-left text-sm text-ink hover:bg-background"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
};
