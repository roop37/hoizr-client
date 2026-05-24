"use client";

import { useEffect, useMemo, useState } from "react";
import { EventTile } from "./EventTile";
// HFooter rendered once at the layout level.
import type { DisplayEvent } from "@/lib/event-display";
import { useUIStore } from "@/store/uiStore";
import type { GenreTagMaster, IndianCityMaster } from "@/types/master";

const VERTICALS = [
  { id: "All", label: "All", match: () => true },
  { id: "club", label: "Club nights", match: (e: DisplayEvent) => /club|dj|electronic|techno|house/i.test(e.series) },
  { id: "gigs", label: "Live gigs", match: (e: DisplayEvent) => /live|concert|gig|band/i.test(e.series) },
  { id: "comedy", label: "Comedy", match: (e: DisplayEvent) => /comedy|stand[- ]?up/i.test(e.series) },
  { id: "shop", label: "Workshops", match: (e: DisplayEvent) => /workshop|class|bootcamp/i.test(e.series) },
  { id: "fest", label: "Festivals", match: (e: DisplayEvent) => /fest/i.test(e.series) },
];

type Props = {
  events: DisplayEvent[];
  cities: IndianCityMaster[];
  genres: GenreTagMaster[];
  initialVertical?: string;
  initialCity?: string;
  initialGenreId?: string;
};

const cityLabel = (city: IndianCityMaster) => city.value || city.city || "Unknown city";

export const EventsPageClient = ({
  events,
  cities,
  genres,
  initialVertical = "All",
  initialCity,
  initialGenreId,
}: Props) => {
  const [vert, setVert] = useState(initialVertical);
  const selectedGlobalCity = useUIStore((s) => s.city);
  const [city, setCity] = useState(initialCity ?? "All cities");
  const [genreId, setGenreId] = useState(initialGenreId ?? "All genres");

  useEffect(() => {
    if (!initialCity && selectedGlobalCity !== "All cities") {
      setCity(selectedGlobalCity);
    }
  }, [initialCity, selectedGlobalCity]);

  const eventCities = useMemo(() => {
    const citySet = new Set(events.map((event) => event.city).filter(Boolean));
    const fromMasters = cities
      .map(cityLabel)
      .filter((label) => citySet.has(label))
      .sort((a, b) => a.localeCompare(b, "en-IN", { sensitivity: "base" }));
    const missingFromMasters = [...citySet]
      .filter((label) => !fromMasters.includes(label))
      .sort((a, b) => a.localeCompare(b, "en-IN", { sensitivity: "base" }));
    return ["All cities", ...fromMasters, ...missingFromMasters];
  }, [cities, events]);

  const eventGenres = useMemo(() => {
    const ids = new Set(events.flatMap((event) => event.genreTagIds));
    return genres.filter((genre) => ids.has(genre._id));
  }, [events, genres]);

  const filtered = useMemo(() => {
    let xs = events;
    const v = VERTICALS.find((x) => x.id === vert);
    if (v && vert !== "All") xs = xs.filter(v.match);
    if (city !== "All cities") xs = xs.filter((e) => e.city === city);
    if (genreId !== "All genres") {
      xs = xs.filter((event) => event.genreTagIds.includes(genreId));
    }
    return xs;
  }, [events, vert, city, genreId]);

  const activeGenre = eventGenres.find((genre) => genre._id === genreId);

  return (
    <div className="h-page">
      <div className="h-page-head">
        <div>
          <div className="label">Events · India</div>
          <h1>Find tonight, or any night.</h1>
          <p style={{ color: "var(--h-ink-2)", maxWidth: "56ch", margin: "10px 0 0", fontSize: 14 }}>
            Every event here is hand-picked. As Hoizr grows, this feed grows with it.
          </p>
        </div>
      </div>

      <div className="h-evt-filters">
        {VERTICALS.map((v) => (
          <button
            key={v.id}
            type="button"
            className={`h-chip ${vert === v.id ? "active" : ""}`}
            onClick={() => setVert(v.id)}
          >
            {v.label}
          </button>
        ))}
        <span className="divider" />
        {eventCities.map((c) => (
          <button
            key={c}
            type="button"
            className={`h-chip ${city === c ? "active" : ""}`}
            onClick={() => setCity(c)}
          >
            {c}
          </button>
        ))}
        {eventGenres.length ? (
          <>
            <span className="divider" />
            <button
              type="button"
              className={`h-chip ${genreId === "All genres" ? "active" : ""}`}
              onClick={() => setGenreId("All genres")}
            >
              All genres
            </button>
            {eventGenres.map((genre) => (
              <button
                key={genre._id}
                type="button"
                className={`h-chip ${genreId === genre._id ? "active" : ""}`}
                onClick={() => setGenreId(genre._id)}
              >
                {genre.value}
              </button>
            ))}
          </>
        ) : null}
      </div>

      <div className="h-evt-count">
        <strong>{filtered.length}</strong> {filtered.length === 1 ? "event" : "events"}
        {vert !== "All" ? (
          <>
            {" "}
            · in <span style={{ color: "var(--h-ink)" }}>{VERTICALS.find((v) => v.id === vert)?.label}</span>
          </>
        ) : null}
        {city !== "All cities" ? <> · {city}</> : null}
        {activeGenre ? <> · {activeGenre.value}</> : null}
      </div>

      {filtered.length === 0 ? (
        <div className="h-empty">
          No events match this filter yet.{" "}
          <button
            type="button"
            className="h-btn-text"
            style={{ color: "var(--h-accent)" }}
            onClick={() => {
              setVert("All");
              setCity("All cities");
              setGenreId("All genres");
            }}
          >
            Show all
          </button>
        </div>
      ) : (
        <div className="h-evt-grid">
          {filtered.map((e) => (
            <EventTile key={e.id} event={e} />
          ))}
        </div>
      )}
    </div>
  );
};
