"use client";

import { customerApiOrigin } from "@/lib/graphql";
import { cn } from "@/lib/cn";

type ConnectSwiggyButtonProps = {
  reconnect?: boolean;
  className?: string;
};

// The connect flow is a full-page navigation to the customer-server route,
// which runs the PKCE OAuth server-side. The browser never talks to Swiggy
// directly, and the redirect must hit the customer-server origin so the auth
// cookie (scoped to that origin) is sent. `customerApiOrigin` is the same
// base the Instagram connect button uses. The callback return stays owned by
// customer-server (`SWIGGY_FRONTEND_RETURN`, falling back to `/dineout`).
export function ConnectSwiggyButton({
  reconnect = false,
  className,
}: ConnectSwiggyButtonProps) {
  const action = reconnect ? "Reconnect" : "Connect";

  return (
    <a
      href={`${customerApiOrigin}/auth/swiggy/start`}
      aria-label={`${action} Swiggy account`}
      className={cn(
        "h-btn min-h-11 justify-center border border-[#FE5005]/45 bg-[#FE5005]/[0.08] text-cream shadow-[0_10px_28px_-20px_rgba(254,80,5,0.9)] hover:border-[#FE5005]/70 hover:bg-[#FE5005]/[0.13] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE5005] focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
        className
      )}
    >
      <span>{action}</span>
      {/* The supplied lockup is used as-is: no tint, mask, or crop. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brands/swiggy.svg"
        alt=""
        aria-hidden="true"
        width={159}
        height={49}
        className="h-5 w-auto shrink-0 object-contain"
      />
    </a>
  );
}
