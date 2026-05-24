import Link from "next/link";
import { HeaderAuthLinks } from "./HeaderAuthLinks";

export const SiteHeader = () => (
  <header className="border-b border-border bg-cream/90 backdrop-blur supports-[backdrop-filter]:bg-cream/70 sticky top-0 z-40">
    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
      <Link href="/" className="text-xl font-semibold tracking-tight text-dark">
        hoizr
      </Link>
      <nav className="flex items-center gap-2 md:gap-4 text-sm font-medium">
        <Link
          href="/events"
          className="rounded-full px-3 py-1.5 transition hover:bg-background"
        >
          Events
        </Link>
        <Link
          href="/artist"
          className="rounded-full px-3 py-1.5 transition hover:bg-background"
        >
          Artists
        </Link>
        <HeaderAuthLinks />
      </nav>
    </div>
  </header>
);
