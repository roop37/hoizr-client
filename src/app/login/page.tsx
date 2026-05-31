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
    <div className="h-page flex min-h-[70vh] w-full items-center justify-center py-12 md:py-16">
      <div className="w-full max-w-[430px] rounded-[28px] border border-white/12 bg-white/[0.08] p-6 text-white shadow-2xl backdrop-blur-2xl sm:p-8 md:p-10">
        <LoginForm next={searchParams.next ?? "/"} />
      </div>
    </div>
  );
}
