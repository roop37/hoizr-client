import Link from "next/link";
import { DomeGallery } from "@/components/hoizr-ui/DomeGallery";
// HFooter now rendered at the layout level so it can pin to bottom on
// short pages. Page-level renders removed.
import { fetchPublicArtists } from "@/lib/home-data";

export const metadata = { title: "Artists" };
export const dynamic = "force-dynamic";

export default async function ArtistsPage() {
  const res = await fetchPublicArtists(64);
  const artists = res.artists;

  return (
    <div className="h-page">
      <div className="h-page-head">
        <div>
          <div className="label">Artists on Hoizr</div>
          <h1>People you should be hearing.</h1>
        </div>
      </div>
      {artists.length === 0 ? (
        <div className="h-empty">
          No artists live yet.{" "}
          <Link href="/events" className="h-btn-text" style={{ color: "var(--h-accent)" }}>
            Browse events
          </Link>
        </div>
      ) : (
        <section className="h-dome-section" style={{ height: 700, margin: "24px 0 0" }}>
          <div className="h-dome-head">
            <h2>The Hoizr dome</h2>
            <span className="sub">Drag to rotate · click to follow</span>
          </div>
          <DomeGallery artists={artists.length < 16 ? [...artists, ...artists, ...artists] : artists} />
        </section>
      )}
    </div>
  );
}
