"use client";

import { MapPin, Music2, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { gqlRequest } from "@/lib/graphql";
import { MY_FOLLOWED_ARTISTS_QUERY } from "@/lib/queries";
import { useAuthStore } from "@/store/auth";
import type { FollowedArtist } from "@/types/artist";
import {
  CardSkeleton,
  EmptyState,
  ErrorState,
} from "@/components/ui/feedback";

const formatFollowers = (count: number) =>
  new Intl.NumberFormat("en-IN", {
    notation: count >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(count);

const artistHref = (artist: FollowedArtist) =>
  `/artist/${artist.slug || artist._id}`;

export const FollowedArtistsClient = () => {
  const router = useRouter();
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrated = useAuthStore((s) => s.hydrated);
  const profile = useAuthStore((s) => s.profile);

  const [artists, setArtists] = useState<FollowedArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    if (hydrated && !profile) {
      router.replace("/login?next=/me/artists");
    }
  }, [hydrated, profile, router]);

  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    gqlRequest<{ myFollowedArtists: FollowedArtist[] }>(MY_FOLLOWED_ARTISTS_QUERY)
      .then((data) => {
        setArtists(data.myFollowedArtists ?? []);
        setError(null);
      })
      .catch((err: any) => {
        setArtists([]);
        setError(
          err?.response?.errors?.[0]?.message ??
            "Unable to load the artists you follow right now."
        );
      })
      .finally(() => setLoading(false));
  }, [profile]);

  const intro = useMemo(() => {
    if (!artists.length) {
      return "Keep track of artists you want to see live, shop merch from, or revisit later.";
    }
    return `${artists.length} artist${artists.length === 1 ? "" : "s"} in your follow list.`;
  }, [artists.length]);

  if (!hydrated || loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-12">
        <div className="mb-8">
          <div className="h-8 w-48 animate-pulse rounded bg-white/[0.08]" />
          <div className="mt-2 h-4 w-80 animate-pulse rounded bg-white/[0.06]" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 text-white md:px-6 md:py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold text-white md:text-4xl">
          Following
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-white/65">{intro}</p>
      </header>

      {error ? (
        <div className="mb-6">
          <ErrorState message={error} onRetry={() => router.refresh()} />
        </div>
      ) : null}

      {artists.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {artists.map((artist) => {
            const displayName = [artist.firstName, artist.lastName]
              .filter(Boolean)
              .join(" ")
              .trim();
            const avatarInitial = displayName.charAt(0).toUpperCase() || "A";
            const location = [artist.city, artist.state]
              .filter(Boolean)
              .join(", ");
            const genres = artist.genres?.filter(Boolean).slice(0, 3) ?? [];

            return (
              <Link
                key={artist._id}
                href={artistHref(artist)}
                className="group flex h-full flex-col rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 text-white backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/[0.07]"
              >
                <div className="flex items-start gap-4">
                  {artist.profilePhoto ? (
                    <Image
                      src={artist.profilePhoto}
                      alt={displayName}
                      width={72}
                      height={72}
                      className="h-[72px] w-[72px] rounded-2xl object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="grid h-[72px] w-[72px] place-items-center rounded-2xl bg-white/[0.06] text-2xl font-semibold text-white ring-1 ring-inset ring-white/10">
                      {avatarInitial}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-lg font-semibold text-white">
                      {displayName}
                    </div>
                    {artist.tagline ? (
                      <p className="mt-1 overflow-hidden text-sm text-white/65 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                        {artist.tagline}
                      </p>
                    ) : null}
                    {location ? (
                      <div className="mt-2 inline-flex items-center gap-1 text-xs text-white/55">
                        <MapPin size={12} />
                        <span className="truncate">{location}</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                {genres.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {genres.map((genre) => (
                      <span
                        key={genre}
                        className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-white/70"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="mt-5 flex items-center justify-between border-t border-white/[0.08] pt-4 text-sm">
                  <div className="inline-flex items-center gap-2 text-white/55">
                    <Users size={14} />
                    <span>{formatFollowers(artist.totalFollowersCount)} followers</span>
                  </div>
                  <span className="font-semibold text-[#c5ff3d] transition group-hover:text-[#d9ff6e]">
                    View profile →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Music2 size={28} />}
          title="You are not following any artists yet"
          description="Follow artists from their profile pages to build a personal shortlist for lineups, merch, and future drops."
          actionLabel="Browse artists"
          actionHref="/artist"
        />
      )}
    </div>
  );
};
