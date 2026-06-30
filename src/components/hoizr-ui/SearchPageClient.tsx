"use client";

import { useMemo, useState } from "react";
import { EventCard } from "./EventCard";
// HFooter rendered once at the layout level.
import { HICONS } from "./icons";
import type { DisplayEvent } from "@/lib/event-display";
import type { GenreTagMaster, IndianCityMaster } from "@/types/master";

const VERTICAL_RX: Record<string, RegExp> = {
  club: /club|dj|electronic|techno|house/i,
  gigs: /live|concert|gig|band/i,
  comedy: /comedy|stand[- ]?up/i,
  shop: /workshop|class|bootcamp/i,
  fest: /fest/i,
};

const isInWhenRange = (iso: string | undefined, when: string) => {
  if (!when || !iso) return true;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return true;
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = (d.getTime() - now.getTime()) / dayMs;
  if (when === "Tonight") return d.toDateString() === now.toDateString();
  if (when === "This weekend") return diffDays >= -1 && diffDays <= 7 && [0, 5, 6].includes(d.getDay());
  if (when === "Next 7 days") return diffDays >= -1 && diffDays <= 7;
  if (when === "This month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  return true;
};

type Props = {
  events: (DisplayEvent & { startDateIso?: string })[];
  cities: IndianCityMaster[];
  genres: GenreTagMaster[];
};

const cityLabel = (city: IndianCityMaster) => city.value || city.city || "Unknown city";

export const SearchPageClient = ({ events, cities, genres }: Props) => {
  const [q, setQ] = useState("");
  const [vert, setVert] = useState("");
  const [city, setCity] = useState("");
  const [when, setWhen] = useState("");
  const [genreId, setGenreId] = useState("");

  const eventCities = useMemo(() => {
    const citySet = new Set(events.map((event) => event.city).filter(Boolean));
    const labels = cities
      .map(cityLabel)
      .filter((label) => citySet.has(label))
      .sort((a, b) => a.localeCompare(b, "en-IN", { sensitivity: "base" }));
    const missing = [...citySet]
      .filter((label) => !labels.includes(label))
      .sort((a, b) => a.localeCompare(b, "en-IN", { sensitivity: "base" }));
    return [...labels, ...missing];
  }, [cities, events]);

  const eventGenres = useMemo(() => {
    const ids = new Set(events.flatMap((event) => event.genreTagIds));
    return genres.filter((genre) => ids.has(genre._id));
  }, [events, genres]);

  const results = useMemo(() => {
    let xs = events;
    if (q.trim()) {
      const qq = q.toLowerCase();
      xs = xs.filter(
        (e) =>
          e.title.toLowerCase().includes(qq) ||
          e.venueLong.toLowerCase().includes(qq) ||
          e.city.toLowerCase().includes(qq),
      );
    }
    if (vert) {
      const rx = VERTICAL_RX[vert];
      if (rx) xs = xs.filter((e) => rx.test(e.series));
    }
    if (city)
      xs = xs.filter((e) => (e.cities ?? [e.city]).some((c) => c === city));
    if (genreId) xs = xs.filter((e) => e.genreTagIds.includes(genreId));
    if (when) xs = xs.filter((e) => isInWhenRange(e.startDateIso, when));
    return xs;
  }, [events, q, vert, city, genreId, when]);

  return (
    <div className="h-page">
      <div className="h-page-head">
        <div>
          <div className="label">Search</div>
          <h1>What are you looking for?</h1>
        </div>
      </div>

      <div className="h-search-bar">
        <span style={{ color: "var(--h-ink-3)", display: "flex" }}>{HICONS.search}</span>
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search events, venues, cities…"
        />
        {q ? (
          <button type="button" onClick={() => setQ("")} style={{ color: "var(--h-ink-3)" }}>
            {HICONS.close}
          </button>
        ) : null}
      </div>

      <div className="h-search-advanced">
        <div className="group">
          <label>Vertical</label>
          <select value={vert} onChange={(e) => setVert(e.target.value)}>
            <option value="">Any</option>
            <option value="club">Club nights</option>
            <option value="gigs">Live gigs</option>
            <option value="comedy">Comedy</option>
            <option value="shop">Workshops</option>
            <option value="fest">Festivals</option>
          </select>
        </div>
        <div className="group">
          <label>City</label>
          <select value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="">Any</option>
            {eventCities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="group">
          <label>Genre</label>
          <select value={genreId} onChange={(e) => setGenreId(e.target.value)}>
            <option value="">Any</option>
            {eventGenres.map((genre) => (
              <option key={genre._id} value={genre._id}>
                {genre.value}
              </option>
            ))}
          </select>
        </div>
        <div className="group">
          <label>When</label>
          <select value={when} onChange={(e) => setWhen(e.target.value)}>
            <option value="">Anytime</option>
            <option>Tonight</option>
            <option>This weekend</option>
            <option>Next 7 days</option>
            <option>This month</option>
          </select>
        </div>
      </div>

      <div className="h-evt-count">
        <strong>{results.length}</strong> {results.length === 1 ? "result" : "results"}
        {q ? (
          <>
            {" "}
            for &quot;<span style={{ color: "var(--h-ink)" }}>{q}</span>&quot;
          </>
        ) : null}
      </div>

      {results.length === 0 ? (
        <div className="h-empty">No matches. Try a broader search.</div>
      ) : (
        <div className="h-evt-grid">
          {results.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </div>
  );
};
