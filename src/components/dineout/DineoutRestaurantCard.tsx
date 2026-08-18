import Link from "next/link";
import type { DineoutRestaurantFieldsFragment } from "@/generated/graphql";

/**
 * One Swiggy restaurant card — shares the fluid-glass tile language (`.h-tile`)
 * with the event cards it sits beside in the home/live rails and the venues
 * grid. The flyer is overridden to 4:3 (restaurant covers are landscape; the
 * 3:4 baked into `.h-tile-flyer` would crop them to portrait). `extraParams`
 * lets callers append deep-link params (e.g. `&date=…&doorsAt=…`).
 */
export function DineoutRestaurantCard({
  restaurant: r,
  lat,
  lng,
  extraParams = "",
}: {
  restaurant: DineoutRestaurantFieldsFragment;
  lat: number;
  lng: number;
  extraParams?: string;
}) {
  const cover = r.imageUrl ?? r.mastheadImages?.[0] ?? null;
  const meta =
    [r.cuisines?.slice(0, 2).join(", "), r.address, r.costForTwo]
      .filter(Boolean)
      .join(" · ") || "Tap to see tables";
  return (
    <Link
      href={`/dineout/restaurant/${encodeURIComponent(r.restaurantId)}?lat=${lat}&lng=${lng}&name=${encodeURIComponent(r.name ?? "")}${extraParams}`}
      className="h-tile"
    >
      <div className="h-tile-flyer" style={{ aspectRatio: "4 / 3" }}>
        {r.rating != null ? (
          <span className="h-tile-distance" aria-label={`Rated ${r.rating}`}>
            ★ {r.rating}
          </span>
        ) : null}
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={r.name ?? "Restaurant"} loading="lazy" decoding="async" />
        ) : (
          <div
            className="h-tile-flyer-fallback"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 34,
              fontWeight: 700,
              color: "var(--h-ink-4)",
              background:
                "linear-gradient(155deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
            }}
            aria-hidden
          >
            {(r.name ?? "R").charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="h-tile-info">
        <h3 className="h-tile-title">{r.name ?? "Restaurant"}</h3>
        <p className="h-tile-venue">{meta}</p>
        <p className="h-tile-price" style={{ color: "var(--h-accent)" }}>
          Reserve a table →
        </p>
      </div>
    </Link>
  );
}
