import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in · Hoizr",
  description:
    "Sign in to Hoizr to buy tickets, save events, and follow hosts.",
  robots: { index: false, follow: true },
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  // Wrapper is intentionally a centered block, NOT a flex column with
  // items-center — that combination shrunk the inner card to its
  // intrinsic content width (≈150px) instead of letting it span
  // max-w-md, which made the "Sign in to Hoizr" heading wrap onto
  // every other word.
  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 md:py-16">
      <div className="w-full rounded-2xl border border-border bg-cream p-6 md:p-8 shadow-sm">
        <LoginForm next={searchParams.next ?? "/"} />
      </div>
    </div>
  );
}
