"use client";

import Image from "next/image";
import Link from "next/link";

type Props = {
  size?: "default" | "small";
  href?: string;
  /** "white" (default) reads on dark surfaces; "dark" reads on light ones. */
  variant?: "white" | "dark";
};

const HEIGHT: Record<NonNullable<Props["size"]>, number> = {
  default: 30,
  small: 22,
};

/**
 * Brand wordmark. Renders the canonical Hoizr logo PNG (same asset
 * used in business-client/assets/logo) so consumer + business chrome
 * share one identity. Width auto-scales from the PNG's natural ratio.
 */
export const HoizrLogo = ({ size = "default", href = "/", variant = "white" }: Props) => {
  const height = HEIGHT[size];
  const src = variant === "dark" ? "/logo/logoDark.png" : "/logo/logoWhite.png";
  const img = (
    <Image
      src={src}
      alt="Hoizr"
      width={size === "default" ? 132 : 96}
      height={height}
      priority={size === "default"}
      style={{ width: "auto", height, display: "block" }}
    />
  );
  if (href) {
    return (
      <Link href={href} className="h-logo-mark" aria-label="Hoizr">
        {img}
      </Link>
    );
  }
  return (
    <span className="h-logo-mark" aria-label="Hoizr">
      {img}
    </span>
  );
};
