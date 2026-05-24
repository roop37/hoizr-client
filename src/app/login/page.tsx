import type { Metadata } from "next";
import Link from "next/link";
// Pre-launch: login form hidden until accounts reopen. Restore the
// import + form render below when the API server is back online.
// import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in · coming soon",
  description:
    "Hoizr accounts open in waves. Hosts can sign in at business.hoizr.com.",
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-12 md:py-16">
      <div className="w-full rounded-2xl border border-border bg-cream p-6 md:p-8">
        <h1 className="text-2xl font-semibold">Accounts opening soon.</h1>
        <p className="mt-2 text-sm text-muted">
          Hoizr accounts open to fans in waves while we onboard hosts and
          finish verification. You can still browse and shortlist events
          without an account.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/events"
            className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-white"
          >
            Browse events
          </Link>
          <a
            href="https://business.hoizr.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2.5 text-sm font-semibold"
          >
            I&rsquo;m a host · open business.hoizr.com ↗
          </a>
        </div>
        <p className="mt-6 text-xs text-muted">
          Questions? Email{" "}
          <a href="mailto:contact@hoizr.com" className="font-semibold">
            contact@hoizr.com
          </a>
          .
        </p>
        {/* Original login form — restore when accounts reopen.
        <div className="mt-6">
          <LoginForm next={searchParams.next ?? "/"} />
        </div>
        */}
      </div>
    </div>
  );
}
