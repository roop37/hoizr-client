import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  PUBLIC_ARTIST_EVENTS_QUERY,
  PUBLIC_ARTIST_FOLLOWER_COUNTS_QUERY,
  PUBLIC_ARTIST_LINKS_QUERY,
  PUBLIC_ARTIST_MERCH_QUERY,
  PUBLIC_ARTIST_PROFILE_QUERY,
  PUBLIC_ARTIST_RIDERS_QUERY,
} from "@/lib/artist-queries";
import { getArtistDisplayName } from "@/lib/artist-name";
import { gqlMainRequest } from "@/lib/graphql-main";
import type {
  ArtistFollowerCounts,
  PublicArtistEvent,
  PublicArtistLink,
  PublicArtistMerch,
  PublicArtistProfile,
  PublicArtistRider,
} from "@/types/artist";
import { ArtistProfile } from "../ArtistProfile";

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
  params: { idOrSlug: string; name: string };
}): Promise<Metadata> {
  const profile = await fetchArtistProfile(params.idOrSlug);
  if (!profile) return { title: "Artist not found" };

  const name = getArtistDisplayName(profile);
  const location = [profile.city, profile.state].filter(Boolean).join(", ");
  const genres = profile.genres?.length ? profile.genres.join(", ") : null;
  // Canonical points back to the bare /artist/:idOrSlug variant so we
  // never split link equity across the two URL shapes that resolve to
  // the same profile.
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
  params: { idOrSlug: string; name: string };
};

export const dynamic = "force-dynamic";

const fetchArtistData = async (idOrSlug: string) => {
  const profileRes = await gqlMainRequest<{
    publicArtistProfile: PublicArtistProfile | null;
  }>(PUBLIC_ARTIST_PROFILE_QUERY, { idOrSlug }).catch(() => null);

  const profile = profileRes?.publicArtistProfile ?? null;
  if (!profile) return null;

  const [links, merch, riders, events, counts] = await Promise.all([
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
  ]);

  // Guestlists are fetched CLIENT-SIDE inside ArtistGuestlistSection (they're
  // visibility-gated on the viewer's auth cookie, which SSR can't forward).
  return { profile, links, merch, riders, events, counts };
};

export default async function ArtistPageWithName({ params }: PageProps) {
  const data = await fetchArtistData(params.idOrSlug);
  if (!data) notFound();
  return <ArtistProfile data={data} idOrSlug={params.idOrSlug} />;
}
