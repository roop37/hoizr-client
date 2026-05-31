import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArtistFilters } from "./ArtistFilters";
import { TrackView } from "@/components/analytics/TrackView";
import { PUBLIC_ARTISTS_QUERY } from "@/lib/artist-queries";
import { gqlRequest } from "@/lib/graphql";
import { gqlMainRequest } from "@/lib/graphql-main";
import { ACTIVE_CITIES_QUERY } from "@/lib/queries";
import type {
  PublicArtistListItem,
  PublicArtistListResponse,
} from "@/types/artist";

type SearchParams = {
  q?: string;
  city?: string;
  page?: string;
};

export const metadata: Metadata = {
  title: "Discover artists",
  description: "Browse artists, DJs, and performers on Hoizr.",
};

export const dynamic = "force-dynamic";

const buildHref = (searchParams: SearchParams, nextPage: number) => {
  const params = new URLSearchParams();
  if (searchParams.q) params.set("q", searchParams.q);
  if (searchParams.city) params.set("city", searchParams.city);
  if (nextPage > 1) params.set("page", String(nextPage));
  const query = params.toString();
  return `/artist${query ? `?${query}` : ""}`;
};

const formatFollowers = (count: number) =>
  new Intl.NumberFormat("en-IN", {
    notation: count >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(count);

async function fetchData(searchParams: SearchParams) {
  const page = searchParams.page ? Number(searchParams.page) : 1;
  const [artistsRes, citiesRes] = await Promise.allSettled([
    gqlMainRequest<{ publicArtists: PublicArtistListResponse }>(
      PUBLIC_ARTISTS_QUERY,
      {
        input: {
          search: searchParams.q,
          city: searchParams.city,
          page: Number.isFinite(page) ? page : 1,
          pageSize: 24,
        },
      }
    ),
    gqlRequest<{
      getActiveIndianCities: { _id: string; value: string; state?: string }[];
    }>(ACTIVE_CITIES_QUERY),
  ]);

  return {
    artists:
      artistsRes.status === "fulfilled"
        ? artistsRes.value.publicArtists
        : { artists: [], total: 0, page: 1, pageSize: 24 },
    cities:
      citiesRes.status === "fulfilled" ? citiesRes.value.getActiveIndianCities : [],
  };
}

const artistHref = (artist: PublicArtistListItem) =>
  `/artist/${artist.slug || artist._id}`;

export default async function ArtistsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { artists, cities } = await fetchData(searchParams);
  const hasPrev = artists.page > 1;
  const hasNext = artists.page * artists.pageSize < artists.total;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6">
      <TrackView
        event="artistListView"
        payload={{
          metadata: {
            totalResults: artists.total,
            page: artists.page,
            city: searchParams.city,
            query: searchParams.q,
          },
        }}
      />
      <header className="mb-6">
        <h1 className="text-3xl font-semibold md:text-4xl">Discover artists</h1>
        <p className="mt-1 text-sm text-muted">
          {artists.total
            ? `${artists.total} artist${artists.total === 1 ? "" : "s"} matching your filters`
            : "Browse performers, DJs, and live acts building their audience on Hoizr."}
        </p>
      </header>

      <div className="mb-8">
        <ArtistFilters cities={cities} />
      </div>

      {artists.artists.length ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {artists.artists.map((artist) => {
              const displayName = [artist.firstName, artist.lastName]
                .filter(Boolean)
                .join(" ")
                .trim();
              const avatarInitial = displayName.charAt(0).toUpperCase() || "A";
              const location = [artist.city, artist.state]
                .filter(Boolean)
                .join(", ");
              const genres = artist.genres?.slice(0, 3) ?? [];

              return (
                <Link
                  key={artist._id}
                  href={artistHref(artist)}
                  className="group flex h-full flex-col rounded-3xl border border-border bg-cream p-5 text-ink transition hover:-translate-y-0.5 hover:bg-background"
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
                      <div className="grid h-[72px] w-[72px] place-items-center rounded-2xl bg-background text-2xl font-semibold text-dark">
                        {avatarInitial}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-lg font-semibold text-ink">
                        {displayName}
                      </div>
                      {artist.tagline ? (
                        <p className="mt-1 overflow-hidden text-sm text-muted [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                          {artist.tagline}
                        </p>
                      ) : null}
                      {location ? (
                        <div className="mt-2 text-xs text-muted">{location}</div>
                      ) : null}
                    </div>
                  </div>

                  {genres.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {genres.map((genre) => (
                        <span
                          key={genre}
                          className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-muted"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-5 border-t border-border pt-4 text-sm text-muted">
                    {formatFollowers(artist.totalFollowersCount)} followers
                  </div>
                </Link>
              );
            })}
          </div>

          {(hasPrev || hasNext) && (
            <div className="mt-8 flex items-center justify-between">
              <Link
                href={hasPrev ? buildHref(searchParams, artists.page - 1) : "#"}
                className={`rounded-full border px-4 py-2 text-sm font-medium ${
                  hasPrev
                    ? "border-border bg-cream text-ink transition hover:bg-background"
                    : "pointer-events-none border-border/60 bg-cream/60 text-muted/60"
                }`}
              >
                Previous
              </Link>
              <span className="text-sm text-muted">
                Page {artists.page}
              </span>
              <Link
                href={hasNext ? buildHref(searchParams, artists.page + 1) : "#"}
                className={`rounded-full border px-4 py-2 text-sm font-medium ${
                  hasNext
                    ? "border-border bg-cream text-ink transition hover:bg-background"
                    : "pointer-events-none border-border/60 bg-cream/60 text-muted/60"
                }`}
              >
                Next
              </Link>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-cream px-6 py-16 text-center text-sm text-muted">
          No artists match those filters yet. Try another city or a broader search.
        </div>
      )}
    </div>
  );
}
