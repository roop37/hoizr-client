"use client";

import Image from "next/image";
import { Sparkles, Ticket } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import type { PublicArtistGuestlist } from "@/types/artist";

const CUSTOMER_APP =
  process.env.NEXT_PUBLIC_CUSTOMER_APP_URL ?? "https://hoizr.com";

const fmtDate = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : new Intl.DateTimeFormat("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }).format(d);
};

const cityMatches = (selected: string, eventCity?: string | null) => {
  if (!selected || selected === "All cities") return true; // no city filter
  if (!eventCity) return false;
  return eventCity.trim().toLowerCase() === selected.trim().toLowerCase();
};

export const ArtistGuestlistSection = ({
  guestlists,
}: {
  guestlists: PublicArtistGuestlist[];
}) => {
  const city = useUIStore((s) => s.city);
  const visible = guestlists.filter((g) => cityMatches(city, g.eventCity));
  if (!visible.length) return null;

  const highlighted = visible.filter((g) => g.isHighlighted);
  const rest = visible.filter((g) => !g.isHighlighted);

  return (
    <section className="mt-10">
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-muted">
        <Sparkles size={14} className="text-accent" /> Guestlists
      </h2>

      {highlighted.map((g) => (
        <a
          key={g.guestlistId}
          href={`${CUSTOMER_APP}/guestlist/${g.code}`}
          className="group mb-3 block overflow-hidden rounded-2xl border border-border bg-cream shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          {g.eventFlyer ? (
            <div className="relative aspect-[16/9] w-full overflow-hidden">
              <Image
                src={g.eventFlyer}
                alt={g.eventTitle}
                fill
                sizes="(max-width: 768px) 100vw, 672px"
                className="object-cover transition group-hover:scale-[1.03]"
                unoptimized
              />
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{g.eventTitle}</p>
              <p className="text-xs text-muted">
                {[fmtDate(g.startDate), g.eventCity].filter(Boolean).join(" · ")}
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-cream">
              <Ticket size={13} /> Join guestlist
            </span>
          </div>
        </a>
      ))}

      <div className="space-y-2">
        {rest.map((g) => (
          <a
            key={g.guestlistId}
            href={`${CUSTOMER_APP}/guestlist/${g.code}`}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-cream px-4 py-3 transition hover:-translate-y-0.5 hover:border-accent"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{g.eventTitle}</p>
              <p className="text-xs text-muted">
                {[fmtDate(g.startDate), g.eventCity].filter(Boolean).join(" · ")}
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-accent">
              <Ticket size={13} /> Join
            </span>
          </a>
        ))}
      </div>
    </section>
  );
};
