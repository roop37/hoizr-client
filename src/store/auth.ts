"use client";

import { create } from "zustand";
import { gqlRequest } from "@/lib/graphql";
import { LOGOUT_MUTATION, MY_PROFILE_QUERY } from "@/lib/queries";
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
      const data = await gqlRequest<{ getMyProfile: CustomerProfile | null }>(
        MY_PROFILE_QUERY
      );
      set({ profile: data.getMyProfile ?? null });
    } catch {
      set({ profile: null });
    } finally {
      set({ loading: false, hydrated: true });
    }
  },

  logout: async () => {
    await unregisterStoredWebPushToken();
    try {
      await gqlRequest<{ customerLogout: boolean }>(LOGOUT_MUTATION);
    } catch {
      // ignore network errors on logout
    }
    set({ profile: null });
  },
}));
