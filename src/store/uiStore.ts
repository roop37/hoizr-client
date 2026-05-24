import { create } from "zustand";

type UIUser = {
  signedIn: boolean;
  name: string;
  initials: string;
};

type UIState = {
  signInOpen: boolean;
  user: UIUser;
  city: string;
  cityId?: string;
  dockPlaying: boolean;
  showDock: boolean;
  openSignIn: () => void;
  closeSignIn: () => void;
  signIn: (name?: string) => void;
  signOut: () => void;
  setCity: (city: string, cityId?: string) => void;
  toggleDockPlay: () => void;
  setShowDock: (v: boolean) => void;
};

const initialsFrom = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "U";

export const useUIStore = create<UIState>((set) => ({
  signInOpen: false,
  user: { signedIn: false, name: "Guest", initials: "G" },
  city: "All cities",
  cityId: undefined,
  dockPlaying: true,
  showDock: true,
  openSignIn: () => set({ signInOpen: true }),
  closeSignIn: () => set({ signInOpen: false }),
  signIn: (name = "Rohan Sharma") =>
    set({
      user: { signedIn: true, name, initials: initialsFrom(name) },
      signInOpen: false,
    }),
  signOut: () => set({ user: { signedIn: false, name: "Guest", initials: "G" } }),
  setCity: (city, cityId) => set({ city, cityId }),
  toggleDockPlay: () => set((s) => ({ dockPlaying: !s.dockPlaying })),
  setShowDock: (v: boolean) => set({ showDock: v }),
}));
