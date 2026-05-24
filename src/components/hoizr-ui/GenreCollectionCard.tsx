import Link from "next/link";
import type { GenreTagMaster } from "@/types/master";

/** Cycle of bold colour treatments — Apple Music-style "big word on a
 * colour wash" collection cards. Black text always so anything we pick
 * stays legible. We hash the genre name into one of these slots so the
 * same genre always gets the same colour across renders. */
const PALETTE: { bg: string; fg: string; sub: string }[] = [
  { bg: "linear-gradient(135deg, #c5ff3d 0%, #6bd900 100%)", fg: "#0a0a0e", sub: "rgba(10,10,14,0.62)" },
  { bg: "linear-gradient(135deg, #ff8fb1 0%, #ff2e8a 100%)", fg: "#0a0a0e", sub: "rgba(10,10,14,0.62)" },
  { bg: "linear-gradient(135deg, #ffd66b 0%, #ff8b3d 100%)", fg: "#0a0a0e", sub: "rgba(10,10,14,0.62)" },
  { bg: "linear-gradient(135deg, #b5e6ff 0%, #3fc0ff 100%)", fg: "#0a0a0e", sub: "rgba(10,10,14,0.62)" },
  { bg: "linear-gradient(135deg, #d6c8ff 0%, #7a1fff 100%)", fg: "#ffffff", sub: "rgba(255,255,255,0.7)" },
  { bg: "linear-gradient(135deg, #ffb86b 0%, #c04a0a 100%)", fg: "#ffffff", sub: "rgba(255,255,255,0.72)" },
  { bg: "linear-gradient(135deg, #87f5b6 0%, #1f8a5b 100%)", fg: "#0a0a0e", sub: "rgba(10,10,14,0.66)" },
  { bg: "linear-gradient(160deg, #2a3550 0%, #060616 100%)", fg: "#ffffff", sub: "rgba(255,255,255,0.7)" },
];

/** Cheap deterministic hash so cards render the same on server + client. */
const slotFor = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) % PALETTE.length;
};

/** One-liner descriptor per genre. Keeps the card from looking empty.
 * Fallback uses the genre name when we don't have a curated line. */
const TAGLINES: Record<string, string> = {
  comedy: "Punchlines, hot takes, late nights.",
  techno: "Warehouse tempo. Until sunrise.",
  house: "Tight grooves for the floor.",
  edm: "Drops, lights, and full rooms.",
  "hip-hop": "Verses, bars, big bookings.",
  "hip hop": "Verses, bars, big bookings.",
  rap: "Verses, bars, big bookings.",
  rock: "Loud, live, in your chest.",
  indie: "Smaller rooms, bigger feelings.",
  jazz: "Late sets, sharp horns.",
  classical: "Halls, strings, full attention.",
  bollywood: "Big tunes, bigger nights.",
  electronic: "From ambient to acid.",
  pop: "Hooks the whole room knows.",
  folk: "Stripped down. Up close.",
  acoustic: "Just the song, just the room.",
  workshop: "Hands-on. Half a day. New skill.",
  workshops: "Hands-on. Half a day. New skill.",
  festival: "Multi-stage, multi-day, must-be-there.",
  festivals: "Multi-stage, multi-day, must-be-there.",
  club: "Late-night, full-floor energy.",
  clubs: "Late-night, full-floor energy.",
};

const taglineFor = (label: string) => {
  const key = label.trim().toLowerCase();
  return TAGLINES[key] ?? `New ${label.toLowerCase()} events on Hoizr.`;
};

type Props = {
  genre: GenreTagMaster;
};

export const GenreCollectionCard = ({ genre }: Props) => {
  const palette = PALETTE[slotFor(genre.value)];
  return (
    <Link
      href={`/events?genre=${genre._id}`}
      className="h-genrecol"
      style={{
        background: palette.bg,
        color: palette.fg,
      }}
    >
      <div className="h-genrecol__title">{genre.value}</div>
      <div className="h-genrecol__sub" style={{ color: palette.sub }}>
        {taglineFor(genre.value)}
      </div>
    </Link>
  );
};
