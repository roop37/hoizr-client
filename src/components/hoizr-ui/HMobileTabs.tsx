"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HICONS } from "./icons";

/**
 * Apple-Music-style bottom tab bar. Mobile-only — hidden on screens
 * ≥1101px where the floating sidebar takes over (see `.h-mobile-tabs`
 * media query in globals.css).
 *
 * Search is intentionally omitted while the catalogue is small. The
 * Library tab points at /orders so a fan can find their tickets on
 * touch devices without going through the sidebar.
 */

type Tab = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const TABS: Tab[] = [
  { href: "/", label: "Home", icon: HICONS.home },
  { href: "/events", label: "Events", icon: HICONS.grid },
  { href: "/live", label: "Live", icon: HICONS.radio },
  { href: "/orders", label: "Library", icon: HICONS.ticket },
];

const isActive = (pathname: string | null, href: string) => {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
};

export const HMobileTabs = () => {
  const pathname = usePathname();

  return (
    <nav className="h-mobile-tabs" aria-label="Primary">
      <ul className="h-mobile-tabs__row">
        {TABS.map((t) => {
          const active = isActive(pathname, t.href);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                className={`h-mobile-tabs__btn${active ? " is-active" : ""}`}
              >
                <span className="h-mobile-tabs__icon">{t.icon}</span>
                <span className="h-mobile-tabs__label">{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
