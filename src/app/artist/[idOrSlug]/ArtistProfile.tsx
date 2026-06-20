import Image from "next/image";
import Link from "next/link";
import {
  ArtistJsonLd,
  BreadcrumbJsonLd,
} from "@/components/hoizr-ui/seo/JsonLd";
import { MotionReveal } from "@/components/artist/MotionReveal";
import { getArtistDisplayName } from "@/lib/artist-name";
import { iconForLink } from "@/lib/link-icons";
import type {
  ArtistFollowerCounts,
  PublicArtistEvent,
  PublicArtistGuestlist,
  PublicArtistLink,
  PublicArtistMerch,
  PublicArtistProfile,
  PublicArtistRider,
} from "@/types/artist";
import { FollowButton } from "./FollowButton";
import { MerchBuyButton } from "./MerchBuyButton";
import { ArtistGuestlistSection } from "./ArtistGuestlistSection";

export type ArtistProfileData = {
  profile: PublicArtistProfile;
  links: PublicArtistLink[];
  merch: PublicArtistMerch[];
  riders: PublicArtistRider[];
  events: PublicArtistEvent[];
  counts: ArtistFollowerCounts;
  guestlists: PublicArtistGuestlist[];
};

const RIDER_LABELS: Record<string, string> = {
  Tech: "Tech rider",
  FoodAndBeverage: "F&B rider",
  Hospitality: "Hospitality rider",
  StagePlot: "Stage plot",
  Travel: "Travel rider",
  Other: "Other rider",
};

const formatPrice = (price: number, currency: string) => {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${currency} ${price}`;
  }
};

const formatDate = (iso?: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
};

export const ArtistProfile = ({
  data,
}: {
  data: ArtistProfileData;
  idOrSlug: string;
}) => {
  const { profile, links, merch, riders, events, counts, guestlists } = data;
  const displayName = getArtistDisplayName(profile);
  const location = [profile.city, profile.state].filter(Boolean).join(", ");

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-6">
      <ArtistJsonLd artist={profile} events={events} />
      <BreadcrumbJsonLd
        items={[
          { name: "Hoizr", href: "/" },
          { name: "Artists", href: "/artists" },
          { name: displayName, href: `/artist/${profile.slug ?? profile._id}` },
        ]}
      />
      {profile.coverImage ? (
        <div className="relative -mx-4 mb-6 h-40 overflow-hidden sm:rounded-2xl">
          <Image
            src={profile.coverImage}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 672px"
            className="object-cover"
            unoptimized
          />
        </div>
      ) : null}

      <MotionReveal>
        <header className="flex flex-col items-center text-center">
          {profile.profilePhoto ? (
            <Image
              src={profile.profilePhoto}
              alt={displayName}
              width={96}
              height={96}
              className="h-24 w-24 rounded-full object-cover ring-2 ring-cream"
              unoptimized
            />
          ) : (
            <div className="grid h-24 w-24 place-items-center rounded-full bg-cream text-3xl font-bold text-dark">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <h1 className="mt-3 text-2xl font-bold tracking-tight">{displayName}</h1>
          {profile.tagline ? (
            <p className="mt-1 text-sm text-muted">{profile.tagline}</p>
          ) : null}
          {location ? (
            <p className="mt-1 text-xs text-muted">{location}</p>
          ) : null}
          {profile.genres?.length ? (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
              {profile.genres.map((g) => (
                <span
                  key={g}
                  className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-muted"
                >
                  {g}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-4">
            <FollowButton
              artistId={profile._id}
              isFollowing={counts.isFollowing}
              totalFollowers={counts.totalFollowers}
            />
          </div>

          {profile.bio ? (
            <p className="mt-4 max-w-md text-sm text-foreground/80">
              {profile.bio}
            </p>
          ) : null}
        </header>
      </MotionReveal>

      {links.length ? (
        <MotionReveal delay={0.05}>
          <section className="mt-8 space-y-2">
            {links.map((link) => {
              const Icon = iconForLink(link.icon, link.url);
              return (
                <a
                  key={link._id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-border bg-cream px-4 py-3 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:border-accent hover:shadow-md"
                >
                  <Icon size={18} className="shrink-0 text-accent" />
                  <span className="flex-1 text-center">{link.label}</span>
                  <span className="w-[18px] shrink-0" aria-hidden />
                </a>
              );
            })}
          </section>
        </MotionReveal>
      ) : null}

      {guestlists.length ? (
        <MotionReveal delay={0.1}>
          <ArtistGuestlistSection guestlists={guestlists} />
        </MotionReveal>
      ) : null}

      {events.length ? (
        <MotionReveal delay={0.1}>
          <section className="mt-10">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">
              Upcoming &amp; recent shows
            </h2>
            <div className="space-y-2">
              {events.map((event) => (
                <Link
                  key={event.eventId}
                  href={`/events/${event.eventId}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-background p-3 transition hover:bg-cream"
                >
                  {event.coverImage ? (
                    <Image
                      src={event.coverImage}
                      alt=""
                      width={56}
                      height={56}
                      className="h-14 w-14 rounded-lg object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-lg bg-cream" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{event.title}</p>
                    <p className="text-xs text-muted">
                      {[formatDate(event.startDate), event.city, event.hostName]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </MotionReveal>
      ) : null}

      {merch.length ? (
        <MotionReveal delay={0.1}>
          <section className="mt-10">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">
              Merch
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {merch.map((item) => {
                const image = item.images?.[0];
                const card = (
                  <>
                    {image ? (
                      <div className="relative aspect-square overflow-hidden rounded-t-xl bg-cream">
                        <Image
                          src={image}
                          alt={item.name}
                          fill
                          sizes="(max-width: 768px) 50vw, 320px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="aspect-square rounded-t-xl bg-cream" />
                    )}
                    <div className="px-3 py-2">
                      <p className="truncate text-sm font-semibold">{item.name}</p>
                      <p className="text-xs text-muted">
                        {formatPrice(item.price, item.currency)}
                      </p>
                    </div>
                  </>
                );
                return item.externalCheckoutUrl ? (
                  <a
                    key={item._id}
                    href={item.externalCheckoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block overflow-hidden rounded-xl border border-border bg-background transition hover:bg-cream"
                  >
                    {card}
                  </a>
                ) : (
                  <div
                    key={item._id}
                    className="overflow-hidden rounded-xl border border-border bg-background"
                  >
                    {card}
                    <div className="px-3 pb-3">
                      <MerchBuyButton
                        merchId={item._id}
                        itemName={item.name}
                        price={item.price}
                        currency={item.currency}
                        outOfStock={item.stock != null && item.stock <= 0}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </MotionReveal>
      ) : null}

      {riders.length ? (
        <MotionReveal delay={0.1}>
          <section className="mt-10">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">
              Riders
            </h2>
            <div className="space-y-2">
              {riders.map((rider) => (
                <a
                  key={rider._id}
                  href={rider.fileUrl ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3 transition hover:bg-cream"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{rider.title}</p>
                    <p className="text-xs text-muted">
                      {RIDER_LABELS[rider.riderType] ?? rider.riderType}
                    </p>
                  </div>
                  {rider.fileUrl ? (
                    <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold">
                      View
                    </span>
                  ) : null}
                </a>
              ))}
            </div>
          </section>
        </MotionReveal>
      ) : null}
    </main>
  );
};
