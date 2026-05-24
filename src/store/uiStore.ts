import { create } from "zustand";

type UIUser = {
  signedIn: boolean;
  name: string;
  initials: string;
};

type UIState = {
  signInOpen: boolean;
  mobileSidebarOpen: boolean;
  user: UIUser;
  city: string;
  cityId?: string;
  dockPlaying: boolean;
  showDock: boolean;
  openSignIn: () => void;
  closeSignIn: () => void;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  toggleMobileSidebar: () => void;
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
  mobileSidebarOpen: false,
  user: { signedIn: false, name: "Guest", initials: "G" },
  city: "All cities",
  cityId: undefined,
  dockPlaying: true,
  showDock: true,
  openSignIn: () => set({ signInOpen: true }),
  closeSignIn: () => set({ signInOpen: false }),
  openMobileSidebar: () => set({ mobileSidebarOpen: true }),
  closeMobileSidebar: () => set({ mobileSidebarOpen: false }),
  toggleMobileSidebar: () =>
    set((s) => ({ mobileSidebarOpen: !s.mobileSidebarOpen })),
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
