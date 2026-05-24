import Link from "next/link";

export const SiteFooter = () => (
  <footer className="border-t border-border bg-cream mt-auto">
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-sm md:grid-cols-3 md:px-6">
      <div>
        <div className="text-lg font-semibold">hoizr</div>
        <p className="mt-2 text-muted">
          Discover concerts, festivals, and nights out across India.
        </p>
      </div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted">
          Explore
        </div>
        <ul className="mt-3 space-y-2">
          <li>
            <Link href="/events" className="hover:underline">
              All events
            </Link>
          </li>
          <li>
            <Link href="/orders" className="hover:underline">
              My tickets
            </Link>
          </li>
        </ul>
      </div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted">
          Company
        </div>
        <ul className="mt-3 space-y-2">
          <li>
            <a href="https://business.hoizr.com" className="hover:underline">
              For organisers
            </a>
          </li>
        </ul>
      </div>
    </div>
    <div className="border-t border-border py-4 text-center text-xs text-muted">
      © {new Date().getFullYear()} Hoizr Technology
    </div>
  </footer>
);
