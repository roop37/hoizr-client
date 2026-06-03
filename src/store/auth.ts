"use client";

import { create } from "zustand";
import { sdk } from "@/lib/sdk";
import { unregisterStoredWebPushToken } from "@/lib/web-push";
import type { CustomerProfile } from "@/types/auth";

type AuthState = {
  profile: CustomerProfile | null;
  loading: boolean;
  hydrated: boolean;
  setProfile: (profile: CustomerProfile | null) => void;
  hydrate: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  profile: null,
  loading: false,
  hydrated: false,

  setProfile: (profile) => set({ profile }),

  hydrate: async () => {
    if (get().hydrated) return;
    set({ loading: true });
    try {
      const data = await sdk.MyProfile();
      set({ profile: (data.getMyProfile ?? null) as CustomerProfile | null });
    } catch {
      set({ profile: null });
    } finally {
      set({ loading: false, hydrated: true });
    }
  },

  logout: async () => {
    await unregisterStoredWebPushToken();
    try {
      await sdk.CustomerLogout();
    } catch {
      // ignore network errors on logout
    }
    set({ profile: null });
  },
}));
