import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number;
  strokeWidth?: number;
  children?: ReactNode;
};

const Stroke = ({ size = 18, strokeWidth = 1.8, children, ...rest }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...rest}
  >
    {children}
  </svg>
);

const Fill = ({ size = 18, children, ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...rest}>
    {children}
  </svg>
);

export const HICONS = {
  search: (
    <Stroke>
      <circle cx="11" cy="11" r="7" />
      <path d="m20.5 20.5-4-4" />
    </Stroke>
  ),
  home: (
    <Stroke>
      <path d="M3 11.5 12 3l9 8.5V21a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1v-9.5z" />
    </Stroke>
  ),
  grid: (
    <Stroke>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </Stroke>
  ),
  radio: (
    <Stroke>
      <circle cx="12" cy="12" r="2" />
      <path d="M16.2 7.8a6 6 0 0 1 0 8.4M7.8 16.2a6 6 0 0 1 0-8.4M19 5a10 10 0 0 1 0 14M5 19A10 10 0 0 1 5 5" />
    </Stroke>
  ),
  ticket: (
    <Stroke>
      <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V9zm12 0v8" />
    </Stroke>
  ),
  user: (
    <Stroke>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </Stroke>
  ),
  mic: (
    <Stroke>
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </Stroke>
  ),
  pin: (
    <Stroke>
      <path d="M20 10c0 7-8 12-8 12s-8-5-8-12a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </Stroke>
  ),
  fav: (
    <Stroke>
      <path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z" />
    </Stroke>
  ),
  globe: (
    <Stroke>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
    </Stroke>
  ),
  chevDown: (
    <Stroke>
      <path d="m6 9 6 6 6-6" />
    </Stroke>
  ),
  chevR: (
    <Stroke strokeWidth={2}>
      <path d="m9 6 6 6-6 6" />
    </Stroke>
  ),
  chevL: (
    <Stroke strokeWidth={2}>
      <path d="m15 6-6 6 6 6" />
    </Stroke>
  ),
  close: (
    <Stroke strokeWidth={2}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Stroke>
  ),
  arrowR: (
    <Stroke strokeWidth={2}>
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </Stroke>
  ),
  clock: (
    <Stroke>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </Stroke>
  ),
  play: (
    <Fill>
      <path d="M7 4v16l13-8L7 4z" />
    </Fill>
  ),
  pause: (
    <Fill>
      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
    </Fill>
  ),
  skipN: (
    <Fill>
      <path d="M5 4l10 8L5 20V4zm12 0h2v16h-2V4z" />
    </Fill>
  ),
  skipP: (
    <Fill>
      <path d="M19 4 9 12l10 8V4zM5 4h2v16H5V4z" />
    </Fill>
  ),
  share: (
    <Stroke>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
    </Stroke>
  ),
  insta: (
    <Stroke>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r=".5" fill="currentColor" />
    </Stroke>
  ),
  twitter: (
    <Fill>
      <path d="M17.5 3h2.7l-5.9 6.7L21 21h-5.4l-4.2-5.5L6.4 21H3.7l6.3-7.1L3 3h5.5l3.8 5L17.5 3z" />
    </Fill>
  ),
  spotify: (
    <Stroke>
      <circle cx="12" cy="12" r="10" />
      <path d="M7 9.5c3.5-1 7.5-.5 10 1M7.5 13c3-.8 6.5-.4 8.5 1M8 16c2.5-.6 5-.3 6.5 1" />
    </Stroke>
  ),
  google: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="#fff">
      <path d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.3c1.9-1.8 3-4.4 3-7.4z" />
      <path
        d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.5c-.9.6-2 1-3.4 1A5.9 5.9 0 0 1 6.4 14H3v2.6A10 10 0 0 0 12 22z"
        opacity=".8"
      />
    </svg>
  ),
  apple: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="#fff">
      <path d="M17.5 12.5c0-2.6 2.1-3.8 2.2-3.9-1.2-1.7-3-1.9-3.7-2-1.6-.2-3.1 1-3.9 1s-2-.9-3.3-.9c-1.7 0-3.3 1-4.2 2.5C2.8 12.4 4 17 5.7 19.6c.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.4-.8s2 .8 3.4.8c1.4 0 2.3-1.3 3.1-2.5.9-1.4 1.3-2.7 1.3-2.8-.1 0-2.5-1-2.6-3.9zM14.8 4.2c.7-.9 1.2-2.1 1.1-3.3-1 0-2.3.7-3 1.5-.7.8-1.3 2-1.1 3.2 1.1.1 2.3-.6 3-1.4z" />
    </svg>
  ),
} as const;

export const THING_ICONS: Record<string, ReactNode> = {
  lang: (
    <Stroke strokeWidth={1.6}>
      <path d="m5 8 6 6M4 14l6-6 2-3M2 5h12" />
      <path d="M22 22l-5-10-5 10M14 18h6" />
    </Stroke>
  ),
  clock: HICONS.clock,
  ticket: HICONS.ticket,
  id: (
    <Stroke strokeWidth={1.6}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="12" r="2.5" />
      <path d="M14 10h4M14 14h4M5 17.5C5.6 16 7.1 15 9 15s3.4 1 4 2.5" />
    </Stroke>
  ),
  layout: (
    <Stroke>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </Stroke>
  ),
  seat: (
    <Stroke strokeWidth={1.6}>
      <path d="M4 18v-2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2M6 14V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8M4 22h16" />
    </Stroke>
  ),
  kids: (
    <Stroke strokeWidth={1.6}>
      <circle cx="12" cy="10" r="6" />
      <path d="M9 10h.01M15 10h.01M9 13c1.5 1.5 4.5 1.5 6 0" />
    </Stroke>
  ),
  pets: (
    <Stroke strokeWidth={1.4}>
      <circle cx="6" cy="8" r="2" />
      <circle cx="10" cy="5" r="2" />
      <circle cx="14" cy="5" r="2" />
      <circle cx="18" cy="8" r="2" />
      <path d="M8 13c0-2 2-3 4-3s4 1 4 3c0 1.5-1 2.5-2 3.5-1 1-1.5 2.5-2 2.5s-1-1.5-2-2.5c-1-1-2-2-2-3.5z" />
    </Stroke>
  ),
};
