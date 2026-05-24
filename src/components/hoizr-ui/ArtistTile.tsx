import Link from "next/link";
import type { PublicArtistListItem } from "@/types/artist";

type Props = {
  artist: PublicArtistListItem;
};

export const ArtistTile = ({ artist }: Props) => {
  const name = `${artist.firstName} ${artist.lastName}`.trim();
  const href = artist.slug ? `/artist/${artist.slug}` : `/artist?id=${artist._id}`;
  const tag = artist.tagline ?? artist.genres?.[0] ?? artist.city ?? "Artist";
  return (
    <Link href={href} className="h-artist">
      <div className="cover">
        {artist.profilePhoto ? (
          <img src={artist.profilePhoto} alt={name} />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(135deg,#FA2D48,#FF8FB1)",
            }}
          />
        )}
      </div>
      <div className="body">
        <div className="name">{name}</div>
        <div className="tag">{tag}</div>
      </div>
    </Link>
  );
};
