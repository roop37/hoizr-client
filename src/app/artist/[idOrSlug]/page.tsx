import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  PUBLIC_ARTIST_EVENTS_QUERY,
  PUBLIC_ARTIST_FOLLOWER_COUNTS_QUERY,
  PUBLIC_ARTIST_GUESTLISTS_QUERY,
  PUBLIC_ARTIST_LINKS_QUERY,
  PUBLIC_ARTIST_MERCH_QUERY,
  PUBLIC_ARTIST_PROFILE_QUERY,
  PUBLIC_ARTIST_RIDERS_QUERY,
} from "@/lib/artist-queries";
import { gqlMainRequest } from "@/lib/graphql-main";
import type {
  ArtistFollowerCounts,
  PublicArtistEvent,
  PublicArtistGuestlist,
  PublicArtistLink,
  PublicArtistMerch,
  PublicArtistProfile,
  PublicArtistRider,
} from "@/types/artist";
import { ArtistProfile } from "./ArtistProfile";

const fetchArtistProfile = async (
  idOrSlug: string,
): Promise<PublicArtistProfile | null> => {
  const res = await gqlMainRequest<{
    publicArtistProfile: PublicArtistProfile | null;
  }>(PUBLIC_ARTIST_PROFILE_QUERY, { idOrSlug }).catch(() => null);
  return res?.publicArtistProfile ?? null;
};

export async function generateMetadata({
  params,
}: {
  params: { idOrSlug: string };
}): Promise<Metadata> {
  const profile = await fetchArtistProfile(params.idOrSlug);
  if (!profile) return { title: "Artist not found" };

  const name = `${profile.firstName} ${profile.lastName}`.trim();
  const location = [profile.city, profile.state].filter(Boolean).join(", ");
  const genres = profile.genres?.length ? profile.genres.join(", ") : null;
  // Canonical always points to the slug variant when available so the
  // /artist/:idOrSlug/:name fallback doesn't split link equity.
  const canonical = `/artist/${profile.slug ?? params.idOrSlug}`;
  const description =
    profile.bio?.slice(0, 160) ??
    profile.tagline ??
    [name, genres, location].filter(Boolean).join(" · ") ??
    `${name} on Hoizr — live shows, tour dates, and merch.`;

  return {
    title: name,
    description,
    keywords: [name, ...(profile.genres ?? []), "live music India", "Hoizr"],
    alternates: {
      canonical,
      languages: { "en-IN": canonical, "x-default": canonical },
    },
    openGraph: {
      type: "profile",
      title: name,
      description,
      url: canonical,
      siteName: "Hoizr",
      locale: "en_IN",
      images: profile.profilePhoto
        ? [{ url: profile.profilePhoto, alt: name }]
        : undefined,
    },
  };
}

type PageProps = {
  params: { idOrSlug: string };
};

export const dynamic = "force-dynamic";

const fetchArtistData = async (idOrSlug: string) => {
  const profileRes = await gqlMainRequest<{
    publicArtistProfile: PublicArtistProfile | null;
  }>(PUBLIC_ARTIST_PROFILE_QUERY, { idOrSlug }).catch(() => null);

  const profile = profileRes?.publicArtistProfile ?? null;
  if (!profile) return null;

  const [links, merch, riders, events, counts, guestlists] = await Promise.all([
    gqlMainRequest<{ publicArtistLinks: PublicArtistLink[] }>(
      PUBLIC_ARTIST_LINKS_QUERY,
      { idOrSlug }
    )
      .then((r) => r.publicArtistLinks)
      .catch(() => [] as PublicArtistLink[]),
    gqlMainRequest<{ publicArtistMerch: PublicArtistMerch[] }>(
      PUBLIC_ARTIST_MERCH_QUERY,
      { idOrSlug }
    )
      .then((r) => r.publicArtistMerch)
      .catch(() => [] as PublicArtistMerch[]),
    gqlMainRequest<{ publicArtistRiders: PublicArtistRider[] }>(
      PUBLIC_ARTIST_RIDERS_QUERY,
      { idOrSlug }
    )
      .then((r) => r.publicArtistRiders)
      .catch(() => [] as PublicArtistRider[]),
    gqlMainRequest<{ publicArtistEvents: PublicArtistEvent[] }>(
      PUBLIC_ARTIST_EVENTS_QUERY,
      { idOrSlug }
    )
      .then((r) => r.publicArtistEvents)
      .catch(() => [] as PublicArtistEvent[]),
    gqlMainRequest<{
      publicArtistFollowerCounts: ArtistFollowerCounts;
    }>(PUBLIC_ARTIST_FOLLOWER_COUNTS_QUERY, { idOrSlug })
      .then((r) => r.publicArtistFollowerCounts)
      .catch(() => ({ totalFollowers: 0, isFollowing: false })),
    gqlMainRequest<{ publicArtistGuestlists: PublicArtistGuestlist[] }>(
      PUBLIC_ARTIST_GUESTLISTS_QUERY,
      { idOrSlug }
    )
      .then((r) => r.publicArtistGuestlists)
      .catch(() => [] as PublicArtistGuestlist[]),
  ]);

  return { profile, links, merch, riders, events, counts, guestlists };
};

export default async function ArtistPage({ params }: PageProps) {
  const data = await fetchArtistData(params.idOrSlug);
  if (!data) notFound();
  return <ArtistProfile data={data} idOrSlug={params.idOrSlug} />;
}
