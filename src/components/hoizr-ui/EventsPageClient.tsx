"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { EventCard } from "./EventCard";
import type { DisplayEvent } from "@/lib/event-display";
import { useUIStore } from "@/store/uiStore";
import type { GenreTagMaster, IndianCityMaster } from "@/types/master";

type VibeMatch = (event: DisplayEvent) => boolean;
const VERTICALS: { id: string; label: string; match: VibeMatch }[] = [
  { id: "All", label: "All vibes", match: () => true },
  {
    id: "club",
    label: "Club nights",
    match: (e) => /club|dj|electronic|techno|house/i.test(e.series),
  },
  {
    id: "gigs",
    label: "Live gigs",
    match: (e) => /live|concert|gig|band/i.test(e.series),
  },
  {
    id: "comedy",
    label: "Comedy",
    match: (e) => /comedy|stand[- ]?up/i.test(e.series),
  },
  {
    id: "shop",
    label: "Workshops",
    match: (e) => /workshop|class|bootcamp/i.test(e.series),
  },
  { id: "fest", label: "Festivals", match: (e) => /fest/i.test(e.series) },
];

type WhenId = "all" | "today" | "tomorrow" | "weekend" | "week" | "month";
const WHEN_OPTIONS: { id: WhenId; label: string }[] = [
  { id: "all", label: "All upcoming" },
  { id: "today", label: "Tonight" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "weekend", label: "This weekend" },
  { id: "week", label: "Next 7 days" },
  { id: "month", label: "Next 30 days" },
];

type PriceId = "any" | "free" | "under500" | "mid" | "premium";
const PRICE_OPTIONS: { id: PriceId; label: string }[] = [
  { id: "any", label: "Any price" },
  { id: "free", label: "Free / Guestlist" },
  { id: "under500", label: "Under ₹500" },
  { id: "mid", label: "₹500 – ₹1,500" },
  { id: "premium", label: "₹1,500+" },
];

type SortId = "earliest" | "trending" | "cheapest" | "priciest";
const SORT_OPTIONS: { id: SortId; label: string }[] = [
  { id: "earliest", label: "Earliest first" },
  { id: "trending", label: "Trending" },
  { id: "cheapest", label: "Lowest price" },
  { id: "priciest", label: "Highest price" },
];

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const endOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

const matchesWhen = (event: DisplayEvent, when: WhenId): boolean => {
  if (when === "all") return true;
  if (!event.startDateISO) return false;
  const start = new Date(event.startDateISO);
  if (Number.isNaN(start.getTime())) return false;
  const now = new Date();
  if (when === "today") {
    return start >= startOfDay(now) && start <= endOfDay(now);
  }
  if (when === "tomorrow") {
    const tomorrow = addDays(now, 1);
    return start >= startOfDay(tomorrow) && start <= endOfDay(tomorrow);
  }
  if (when === "weekend") {
    const dow = now.getDay();
    const daysUntilFri = (5 - dow + 7) % 7;
    const fri = addDays(startOfDay(now), daysUntilFri);
    fri.setHours(18, 0, 0, 0);
    const sun = endOfDay(addDays(fri, 2));
    return start >= fri && start <= sun;
  }
  if (when === "week") {
    return start >= startOfDay(now) && start <= endOfDay(addDays(now, 7));
  }
  if (when === "month") {
    return start >= startOfDay(now) && start <= endOfDay(addDays(now, 30));
  }
  return true;
};

const matchesPrice = (event: DisplayEvent, price: PriceId): boolean => {
  if (price === "any") return true;
  const p = event.fromPrice;
  if (price === "free") return p === null || p === 0;
  if (p === null) return false;
  if (price === "under500") return p > 0 && p < 500;
  if (price === "mid") return p >= 500 && p <= 1500;
  if (price === "premium") return p > 1500;
  return true;
};

const sortEvents = (events: DisplayEvent[], sort: SortId): DisplayEvent[] => {
  const xs = [...events];
  if (sort === "earliest") {
    xs.sort((a, b) => {
      const ta = a.startDateISO ? Date.parse(a.startDateISO) : Infinity;
      const tb = b.startDateISO ? Date.parse(b.startDateISO) : Infinity;
      return ta - tb;
    });
  } else if (sort === "trending") {
    xs.sort((a, b) => {
      const da = a.isHighDemand ? 0 : 1;
      const db = b.isHighDemand ? 0 : 1;
      if (da !== db) return da - db;
      const ta = a.startDateISO ? Date.parse(a.startDateISO) : Infinity;
      const tb = b.startDateISO ? Date.parse(b.startDateISO) : Infinity;
      return ta - tb;
    });
  } else if (sort === "cheapest") {
    xs.sort((a, b) => (a.fromPrice ?? Infinity) - (b.fromPrice ?? Infinity));
  } else if (sort === "priciest") {
    xs.sort((a, b) => (b.fromPrice ?? -Infinity) - (a.fromPrice ?? -Infinity));
  }
  return xs;
};

type Props = {
  events: DisplayEvent[];
  cities: IndianCityMaster[];
  genres: GenreTagMaster[];
  initialVertical?: string;
  initialCity?: string;
  initialGenreId?: string;
  initialWhen?: WhenId;
  initialPrice?: PriceId;
  initialSort?: SortId;
  initialSearch?: string;
};

const cityLabel = (city: IndianCityMaster) =>
  city.value || city.city || "Unknown city";

export const EventsPageClient = ({
  events,
  cities,
  genres,
  initialVertical = "All",
  initialCity,
  initialGenreId,
  initialWhen = "all",
  initialPrice = "any",
  initialSort = "earliest",
  initialSearch = "",
}: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [vert, setVert] = useState(initialVertical);
  const [when, setWhen] = useState<WhenId>(initialWhen);
  const [price, setPrice] = useState<PriceId>(initialPrice);
  const [sort, setSort] = useState<SortId>(initialSort);
  const [search, setSearch] = useState(initialSearch);
  const selectedGlobalCity = useUIStore((s) => s.city);
  const [city, setCity] = useState(initialCity ?? "All cities");
  const [genreId, setGenreId] = useState(initialGenreId ?? "All genres");
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (!initialCity && selectedGlobalCity !== "All cities") {
      setCity(selectedGlobalCity);
    }
  }, [initialCity, selectedGlobalCity]);

  useEffect(() => {
    if (!sheetOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSheetOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [sheetOpen]);

  // URL state sync — written without `scroll: false` so deep-linking
  // doesn't jump the page on every filter change.
  useEffect(() => {
    const params = new URLSearchParams();
    if (vert !== "All") params.set("vibe", vert);
    if (city !== "All cities") params.set("city", city);
    if (genreId !== "All genres") params.set("genre", genreId);
    if (when !== "all") params.set("when", when);
    if (price !== "any") params.set("price", price);
    if (sort !== "earliest") params.set("sort", sort);
    if (search) params.set("q", search);
    const next = params.toString();
    const current = searchParams?.toString() ?? "";
    if (next === current) return;
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [vert, city, genreId, when, price, sort, search, pathname, router, searchParams]);

  const eventCities = useMemo(() => {
    const citySet = new Set(events.map((event) => event.city).filter(Boolean));
    const fromMasters = cities
      .map(cityLabel)
      .filter((label) => citySet.has(label))
      .sort((a, b) =>
        a.localeCompare(b, "en-IN", { sensitivity: "base" }),
      );
    const missingFromMasters = [...citySet]
      .filter((label) => !fromMasters.includes(label))
      .sort((a, b) =>
        a.localeCompare(b, "en-IN", { sensitivity: "base" }),
      );
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
    if (city !== "All cities") {
      const target = city.toLowerCase();
      xs = xs.filter((e) => e.city?.toLowerCase() === target);
    }
    if (genreId !== "All genres") {
      xs = xs.filter((event) => event.genreTagIds.includes(genreId));
    }
    xs = xs.filter((e) => matchesWhen(e, when));
    xs = xs.filter((e) => matchesPrice(e, price));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      xs = xs.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.city?.toLowerCase().includes(q) ||
          e.venueShort?.toLowerCase().includes(q) ||
          e.venueLong?.toLowerCase().includes(q) ||
          e.series?.toLowerCase().includes(q),
      );
    }
    return sortEvents(xs, sort);
  }, [events, vert, city, genreId, when, price, sort, search]);

  const activeGenre = eventGenres.find((genre) => genre._id === genreId);

  // Build active-filter pills (removable). Search is shown as a pill so
  // the user can clear it without finding the input.
  type Pill = { key: string; label: string; clear: () => void };
  const pills: Pill[] = [];
  if (vert !== "All") {
    pills.push({
      key: "vibe",
      label: VERTICALS.find((v) => v.id === vert)?.label ?? vert,
      clear: () => setVert("All"),
    });
  }
  // City pill intentionally suppressed — the current city is already
  // surfaced in the global header chip ("Hoizr Pune"), so showing it
  // again here is redundant noise. The state still drives filtering;
  // the user changes city via the header dropdown.
  if (when !== "all") {
    pills.push({
      key: "when",
      label: WHEN_OPTIONS.find((w) => w.id === when)?.label ?? when,
      clear: () => setWhen("all"),
    });
  }
  if (price !== "any") {
    pills.push({
      key: "price",
      label: PRICE_OPTIONS.find((p) => p.id === price)?.label ?? price,
      clear: () => setPrice("any"),
    });
  }
  if (activeGenre) {
    pills.push({
      key: "genre",
      label: activeGenre.value,
      clear: () => setGenreId("All genres"),
    });
  }
  if (search.trim()) {
    pills.push({
      key: "search",
      label: `"${search.trim()}"`,
      clear: () => setSearch(""),
    });
  }

  const activeCount = pills.length;

  const clearAll = () => {
    setVert("All");
    setCity("All cities");
    setGenreId("All genres");
    setWhen("all");
    setPrice("any");
    setSort("earliest");
    setSearch("");
  };

  return (
    <div className="h-page">
      <div className="h-page-head">
        <div>
          <h1>Find tonight, or any night.</h1>
          <p
            style={{
              color: "var(--h-ink-2)",
              maxWidth: "56ch",
              margin: "10px 0 0",
              fontSize: 14,
            }}
          >
            Every event here is hand-picked. As Hoizr grows, this feed grows
            with it.
          </p>
        </div>
      </div>

      <div className="h-evt-toolbar">
        <label className="h-evt-search">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search artists, venues, cities…"
          />
        </label>
        <button
          type="button"
          className="h-evt-filter-btn"
          onClick={() => setSheetOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="7" y1="12" x2="17" y2="12" />
            <line x1="10" y1="18" x2="14" y2="18" />
          </svg>
          <span>Filters</span>
          {activeCount > 0 ? (
            <span className="h-evt-filter-count">{activeCount}</span>
          ) : null}
        </button>
        <div className="h-evt-sort">
          <span className="h-evt-sort-label">Sort</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortId)}
            aria-label="Sort events"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {pills.length ? (
        <div className="h-evt-pills">
          {pills.map((pill) => (
            <button
              key={pill.key}
              type="button"
              className="h-evt-pill"
              onClick={pill.clear}
            >
              <span>{pill.label}</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          ))}
          <button
            type="button"
            className="h-evt-pill h-evt-pill-clear"
            onClick={clearAll}
          >
            Clear all
          </button>
        </div>
      ) : null}

      <div className="h-evt-count">
        <strong>{filtered.length}</strong>{" "}
        {filtered.length === 1 ? "event" : "events"}
      </div>

      {filtered.length === 0 ? (
        <div className="h-empty">
          No events match these filters.{" "}
          <button
            type="button"
            className="h-btn-text"
            style={{ color: "var(--h-accent)" }}
            onClick={clearAll}
          >
            Show all
          </button>
        </div>
      ) : (
        <div className="h-evt-grid">
          {filtered.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}

      {sheetOpen ? (
        <div
          className="h-evt-sheet-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Filter events"
          onClick={() => setSheetOpen(false)}
        >
          <div
            className="h-evt-sheet"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="h-evt-sheet-handle" aria-hidden />
            <div className="h-evt-sheet-head">
              <h2>Filters</h2>
              <button
                type="button"
                className="h-evt-sheet-close"
                onClick={() => setSheetOpen(false)}
                aria-label="Close filters"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="h-evt-sheet-body">
              <FilterSection title="When">
                {WHEN_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`h-chip ${when === option.id ? "active" : ""}`}
                    onClick={() => setWhen(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </FilterSection>

              {eventCities.length > 1 ? (
                <FilterSection title="City">
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
                </FilterSection>
              ) : null}

              <FilterSection title="Vibe">
                {VERTICALS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`h-chip ${vert === option.id ? "active" : ""}`}
                    onClick={() => setVert(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </FilterSection>

              <FilterSection title="Price">
                {PRICE_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`h-chip ${price === option.id ? "active" : ""}`}
                    onClick={() => setPrice(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </FilterSection>

              {eventGenres.length ? (
                <FilterSection title="Genre">
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
                </FilterSection>
              ) : null}
            </div>

            <div className="h-evt-sheet-foot">
              <button
                type="button"
                className="h-evt-sheet-clear"
                onClick={clearAll}
              >
                Clear all
              </button>
              <button
                type="button"
                className="h-evt-sheet-apply"
                onClick={() => setSheetOpen(false)}
              >
                Show {filtered.length}{" "}
                {filtered.length === 1 ? "event" : "events"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const FilterSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="h-evt-sheet-section">
    <h3>{title}</h3>
    <div className="h-evt-sheet-chips">{children}</div>
  </section>
);
