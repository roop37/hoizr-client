"use client";

import Image from "next/image";
import { Sparkles, Ticket } from "lucide-react";
import { useEffect, useState } from "react";
import { gqlMainRequest } from "@/lib/graphql-main";
import { PUBLIC_ARTIST_GUESTLISTS_QUERY } from "@/lib/artist-queries";
import { useAuthStore } from "@/store/auth";
import type { PublicArtistGuestlist } from "@/types/artist";

const CUSTOMER_APP =
  process.env.NEXT_PUBLIC_CUSTOMER_APP_URL ?? "https://hoizr.com";

const fmtDate = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        weekday: "short",
        day: "numeric",
        month: "short",
      }).format(d);
};

/**
 * An artist's public guestlists are visibility-gated server-side: shown ONLY to
 * a logged-in viewer who follows the artist AND is in the event's city. That
 * gate needs the viewer's auth cookie — which a server-rendered fetch can't
 * forward — so we fetch CLIENT-SIDE here (browser → credentials:"include" →
 * main-server sees ctx.user). A logged-out / non-follower / different-city
 * viewer gets an empty list and the section renders nothing.
 */
export const ArtistGuestlistSection = ({
  idOrSlug,
}: {
  idOrSlug: string;
}) => {
  const hydrated = useAuthStore((s) => s.hydrated);
  const profile = useAuthStore((s) => s.profile);
  const [guestlists, setGuestlists] = useState<PublicArtistGuestlist[]>([]);

  useEffect(() => {
    // Only logged-in viewers can pass the server gate; skip the call otherwise.
    if (!hydrated || !profile) {
      setGuestlists([]);
      return;
    }
    let active = true;
    gqlMainRequest<{ publicArtistGuestlists: PublicArtistGuestlist[] }>(
      PUBLIC_ARTIST_GUESTLISTS_QUERY,
      { idOrSlug }
    )
      .then((r) => {
        if (active) setGuestlists(r.publicArtistGuestlists ?? []);
      })
      .catch(() => {
        if (active) setGuestlists([]);
      });
    return () => {
      active = false;
    };
  }, [idOrSlug, hydrated, profile]);

  if (!guestlists.length) return null;

  const highlighted = guestlists.filter((g) => g.isHighlighted);
  const rest = guestlists.filter((g) => !g.isHighlighted);

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
