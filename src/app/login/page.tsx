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
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-12 md:py-16">
      <div className="w-full rounded-2xl border border-border bg-cream p-6 md:p-8">
        <LoginForm next={searchParams.next ?? "/"} />
      </div>
    </div>
  );
}
