import type { Metadata } from "next";
import Link from "next/link";
// Pre-launch: real orders client gated until accounts reopen. Restore
// the import below and the JSX render once /login is live again.
// import { OrdersClient } from "./OrdersClient";

export const metadata: Metadata = {
  title: "My tickets · coming soon",
  description: "Your Hoizr ticket history will land here once accounts open.",
  robots: { index: false, follow: true },
};

export const dynamic = "force-dynamic";

export default function OrdersPage() {
  return (
    <div className="h-page">
      <div className="h-page-head">
        <div>
          <div className="label">Library</div>
          <h1>Your tickets land here.</h1>
        </div>
      </div>
      <section className="h-coming-soon">
        <div className="h-coming-soon__card">
          <div className="h-coming-soon__kicker">Coming soon</div>
          <h2>Sign-in opens with the first events.</h2>
          <p>
            Once accounts open, every ticket you buy on Hoizr — UPI receipts,
            QR codes, weekend reminders — will live right here. We&rsquo;ll
            email you the moment your slot opens.
          </p>
          <div className="h-coming-soon__row">
            <Link href="/events" className="h-btn h-btn-accent h-btn-coming">
              Browse what&rsquo;s coming
            </Link>
            <a
              href="mailto:contact@hoizr.com"
              className="h-btn h-btn-outline h-btn-coming"
            >
              Email contact@hoizr.com
            </a>
          </div>
          <div className="h-coming-soon__meta">
            Already had a ticket? Reply to your order email and the team will
            help you on the same day.
          </div>
        </div>
      </section>
      {/* Original orders flow — restore when accounts reopen.
      <OrdersClient />
      */}
    </div>
  );
}
