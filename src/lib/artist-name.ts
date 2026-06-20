export type ArtistNameSource = {
  stageName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

export const getArtistDisplayName = (
  artist: ArtistNameSource,
  fallback = "Artist",
): string =>
  artist.stageName?.trim() ||
  [artist.firstName, artist.lastName].filter(Boolean).join(" ").trim() ||
  fallback;
