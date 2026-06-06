"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type {
  PublicEvent,
  PublicEventPeopleResponse,
  PublicLanguageMaster,
  PublicProhibitedItemMaster,
} from "@/types/event";
import { formatPrice, toDisplayEvent } from "@/lib/event-display";
import { gqlRequest } from "@/lib/graphql";
import {
  ARTIST_PAST_UPCOMING_EVENTS_QUERY,
  ORGANIZER_PAST_UPCOMING_EVENTS_QUERY,
} from "@/lib/queries";
import { sanitizeRichText } from "@/lib/sanitize";
import { HICONS, THING_ICONS } from "./icons";
import Link from "next/link";
// HFooter rendered once at the layout level.
// The inline booking panel was removed when ticket selection moved to
// its own /events/[slug]/tickets route — the event detail page now
// only carries the pitch + a "Book tickets" CTA that navigates there.

type Props = {
  event: PublicEvent;
  people?: PublicEventPeopleResponse;
  detailLookups?: {
    languages: PublicLanguageMaster[];
    prohibitedItems: PublicProhibitedItemMaster[];
  };
};

type Thing = {
  key: string;
  icon: ReactNode;
  text: string;
};

const enumLabels: Record<string, string> = {
  ALL_AGES: "All ages",
  AllAges: "All ages",
  AGE_13_PLUS: "13+ entry",
  Age13Plus: "13+ entry",
  AGE_16_PLUS: "16+ entry",
  Age16Plus: "16+ entry",
  AGE_18_PLUS: "18+ entry",
  Age18Plus: "18+ entry",
  AGE_21_PLUS: "21+ entry",
  Age21Plus: "21+ entry",
  AGE_25_PLUS: "25+ entry",
  Age25Plus: "25+ entry",
  INDOOR: "Indoor venue",
  Indoor: "Indoor venue",
  OUTDOOR: "Outdoor venue",
  Outdoor: "Outdoor venue",
  MIXED: "Indoor + outdoor",
  Mixed: "Indoor + outdoor",
  SEATED: "Seated",
  Seated: "Seated",
  STANDING: "Standing",
  Standing: "Standing",
  SEATED_AND_STANDING: "Seated + standing",
  SeatedAndStanding: "Seated + standing",
  KIDS_WELCOME: "Kids welcome",
  KidsWelcome: "Kids welcome",
  KIDS_NOT_ALLOWED: "Kids not allowed",
  KidsNotAllowed: "Kids not allowed",
  KIDS_WITH_GUARDIAN: "Kids with guardian",
  KidsWithGuardian: "Kids with guardian",
  PETS_WELCOME: "Pets welcome",
  PetsWelcome: "Pets welcome",
  PETS_NOT_ALLOWED: "Pets not allowed",
  PetsNotAllowed: "Pets not allowed",
  SERVICE_ANIMALS_ONLY: "Service animals only",
  ServiceAnimalsOnly: "Service animals only",
};

const objectIdPattern = /^[a-f0-9]{24}$/i;

const labelForEnum = (value?: string) => {
  if (!value) return "";
  if (enumLabels[value]) return enumLabels[value];
  return value
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const titleFromSlug = (value: string) =>
  value
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatLeadTime = (hours?: number, minutes?: number) => {
  const h = Number(hours ?? 0);
  const m = Number(minutes ?? 0);
  const parts = [
    h > 0 ? `${h}h` : "",
    m > 0 ? `${m}m` : "",
  ].filter(Boolean);
  return parts.length
    ? `Gates open ${parts.join(" ")} before event`
    : "Gates open before event";
};

export const EventDetailClient = ({
  event,
  people,
  detailLookups,
}: Props) => {
  const router = useRouter();
  const display = toDisplayEvent(event);
  const [moreOpen, setMoreOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  type PeopleModalEntry =
    | {
        kind: "artist";
        id?: string;
        name: string;
        tagline?: string;
        picture?: string;
      }
    | {
        kind: "organizer";
        id?: string;
        name: string;
        tagline?: string;
        picture?: string;
        city?: string;
        isPrimary?: boolean;
      };
  const [peopleModal, setPeopleModal] = useState<PeopleModalEntry | null>(null);
  type PastUpcomingEvent = {
    _id: string;
    title?: string;
    slug?: string;
    eventFlyer?: string;
    horizontalFlyer?: string;
    city?: string;
    startDate?: string;
  };
  const [peopleEvents, setPeopleEvents] = useState<{
    upcoming: PastUpcomingEvent[];
    past: PastUpcomingEvent[];
    loading: boolean;
  }>({ upcoming: [], past: [], loading: false });
  useEffect(() => {
    if (!peopleModal?.id) {
      setPeopleEvents({ upcoming: [], past: [], loading: false });
      return;
    }
    let cancelled = false;
    setPeopleEvents({ upcoming: [], past: [], loading: true });
    const query =
      peopleModal.kind === "artist"
        ? ARTIST_PAST_UPCOMING_EVENTS_QUERY
        : ORGANIZER_PAST_UPCOMING_EVENTS_QUERY;
    const variables =
      peopleModal.kind === "artist"
        ? { artistId: peopleModal.id }
        : { hostId: peopleModal.id };
    gqlRequest<{
      getArtistPastUpcomingEvents?: {
        upcoming: PastUpcomingEvent[];
        past: PastUpcomingEvent[];
      };
      getOrganizerPastUpcomingEvents?: {
        upcoming: PastUpcomingEvent[];
        past: PastUpcomingEvent[];
      };
    }>(query, variables)
      .then((data) => {
        if (cancelled) return;
        const payload =
          peopleModal.kind === "artist"
            ? data.getArtistPastUpcomingEvents
            : data.getOrganizerPastUpcomingEvents;
        setPeopleEvents({
          upcoming: payload?.upcoming ?? [],
          past: payload?.past ?? [],
          loading: false,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setPeopleEvents({ upcoming: [], past: [], loading: false });
      });
    return () => {
      cancelled = true;
    };
  }, [peopleModal?.id, peopleModal?.kind]);
  const [venueOpen, setVenueOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const venueFullAddress =
    event.location?.formattedAddress ??
    [
      event.location?.addressLine1,
      event.location?.addressLine2,
      event.location?.city ?? display.city,
      event.location?.state,
    ]
      .filter(Boolean)
      .join(", ");
  const mapSrc = venueFullAddress
    ? `https://www.google.com/maps?q=${encodeURIComponent(
        venueFullAddress
      )}&output=embed`
    : "";
  const mapOpenInGoogleHref = venueFullAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        venueFullAddress
      )}${
        event.location?.place?.placeId
          ? `&query_place_id=${event.location.place.placeId}`
          : ""
      }`
    : "";

  const formatClockTime = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  };
  const gateLeadMs =
    Number(display.eventGuide?.gatesOpenLeadHours ?? 0) * 3600000 +
    Number(display.eventGuide?.gatesOpenLeadMinutes ?? 0) * 60000;
  const gatesIso = display.startDateISO
    ? new Date(new Date(display.startDateISO).getTime() - gateLeadMs).toISOString()
    : undefined;
  const gatesLabel = formatClockTime(gatesIso) || display.startTime;
  // The About card is rich-text on some events; render a plain-text
  // preview for the clamp + the sanitised HTML in the dedicated modal.
  const aboutPreview = useMemo(() => {
    if (!display.about) return "";
    return display.about
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/\s+/g, " ")
      .trim();
  }, [display.about]);
  const aboutIsLong = aboutPreview.length > 280;

  const languageById = useMemo(() => {
    const map = new Map<string, string>();
    for (const language of detailLookups?.languages ?? []) {
      map.set(language._id, language.nativeName ? `${language.value}` : language.value);
    }
    return map;
  }, [detailLookups?.languages]);

  const prohibitedByKey = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of detailLookups?.prohibitedItems ?? []) {
      map.set(item._id, item.value);
      map.set(item.slug, item.value);
    }
    return map;
  }, [detailLookups?.prohibitedItems]);

  const languageLabels = useMemo(
    () =>
      (display.eventGuide?.languageIds ?? [])
        .map((id) => languageById.get(id))
        .filter((value): value is string => Boolean(value)),
    [display.eventGuide?.languageIds, languageById],
  );

  const prohibitedLabels = useMemo(
    () =>
      display.prohibitedItems
        .map((item) => {
          const known = prohibitedByKey.get(item);
          if (known) return known;
          if (objectIdPattern.test(item)) return "";
          return titleFromSlug(item);
        })
        .filter(Boolean),
    [display.prohibitedItems, prohibitedByKey],
  );

  const thingsToKnow = useMemo<Thing[]>(() => {
    const guide = display.eventGuide;
    const things: Thing[] = [];

    if (languageLabels.length) {
      things.push({
        key: "languages",
        icon: THING_ICONS.lang,
        text: `Languages: ${languageLabels.join(", ")}`,
      });
    }
    if (guide?.minimumEntryAge) {
      things.push({
        key: "minimum-age",
        icon: THING_ICONS.id,
        text: labelForEnum(guide.minimumEntryAge),
      });
    }
    if (guide?.paidEntryAge) {
      things.push({
        key: "paid-age",
        icon: HICONS.ticket,
        text: `Paid entry from ${labelForEnum(guide.paidEntryAge).replace(" entry", "")}`,
      });
    }
    if (guide?.venueLayout) {
      things.push({
        key: "layout",
        icon: THING_ICONS.layout,
        text: labelForEnum(guide.venueLayout),
      });
    }
    if (guide?.seatingArrangement) {
      things.push({
        key: "seating",
        icon: THING_ICONS.seat,
        text: labelForEnum(guide.seatingArrangement),
      });
    }
    if (guide?.kidFriendly) {
      things.push({
        key: "kids",
        icon: THING_ICONS.kids,
        text: labelForEnum(guide.kidFriendly),
      });
    }
    if (guide?.petFriendly) {
      things.push({
        key: "pets",
        icon: THING_ICONS.pets,
        text: labelForEnum(guide.petFriendly),
      });
    }
    if (guide?.gatesOpenBeforeEvent) {
      things.push({
        key: "gates",
        icon: HICONS.clock,
        text: formatLeadTime(
          guide.gatesOpenLeadHours,
          guide.gatesOpenLeadMinutes,
        ),
      });
    }
    return things;
  }, [display.eventGuide, languageLabels]);

  const hasMoreContent =
    display.eventInstructions.length > 0 ||
    prohibitedLabels.length > 0 ||
    Boolean(display.eventGuide?.youtubeLink) ||
    Boolean(display.ticketingTerms) ||
    Boolean(display.refundPolicy) ||
    Boolean(display.cancellationPolicy);

  const heroMode = display.horizontalImage
    ? "landscape"
    : display.portraitImage
      ? "portrait"
      : "fallback";
  const ticketsHref = `/events/${display.slug}/tickets`;

  // Floating bottom CTA tracks the visibility of the top hero CTA. On
  // mobile we hide the bottom button while the top one is on-screen
  // (avoids a duplicate above-the-fold), and reveal it the moment the
  // user scrolls past so the action stays reachable. Desktop renders
  // both unconditionally — the CSS only positions/styles the floating
  // version below the `(max-width: 1100px)` breakpoint anyway.
  const topCtaRef = useRef<HTMLDivElement | null>(null);
  const [showFloatingCta, setShowFloatingCta] = useState(false);
  useEffect(() => {
    if (!topCtaRef.current) return;
    if (typeof IntersectionObserver === "undefined") {
      setShowFloatingCta(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setShowFloatingCta(!entry.isIntersecting),
      { rootMargin: "-20px 0px 0px 0px", threshold: 0.01 }
    );
    observer.observe(topCtaRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [event._id]);

  return (
    <div className="h-page h-detail">
      <button
        type="button"
        className="h-detail-back"
        onClick={() => router.back()}
        aria-label="Go back"
      >
        <span className="h-back-icon">{HICONS.chevL}</span>
        <span>Back</span>
      </button>

      <div className={`h-event-hero h-event-hero--${heroMode}`}>
        {display.horizontalImage ? (
          <img
            className="h-event-hero-landscape"
            src={display.horizontalImage}
            alt={display.title}
          />
        ) : display.portraitImage ? (
          <>
            <img
              className="h-event-hero-blur"
              src={display.portraitImage}
              alt=""
              aria-hidden
            />
            <img
              className="h-event-hero-poster"
              src={display.portraitImage}
              alt={display.title}
            />
          </>
        ) : (
          <div
            className="h-event-hero-fallback"
            style={{ background: display.imageStyle }}
          />
        )}
        {display.videoSneakPeek ? (
          <div className="h-event-sneak-card">
            <video
              src={display.videoSneakPeek}
              muted
              playsInline
              autoPlay
              loop
            />
            <span>Preview</span>
          </div>
        ) : null}
      </div>

      <div className="h-detail-heading">
        <div>
          <h1 className="h-detail-title">{display.title}</h1>
          <div className="h-detail-line">
            <span className="date">
              {display.date}
              {display.startTime ? `, ${display.startTime}` : ""}
            </span>
            <span className="sep">|</span>
            <span>{display.venueShort}</span>
          </div>
        </div>
        <div ref={topCtaRef}>
          {display.ticketingEnabled ? (
            <Link href={ticketsHref} className="h-detail-cta">
              Book tickets
            </Link>
          ) : (
            <span className="h-detail-cta" aria-disabled>
              View entry
            </span>
          )}
        </div>
      </div>

      <div className="h-detail-grid h-detail-grid--with-aside">
        <div className="h-detail-body-card">
          {display.about ? (
            <div className="h-detail-section">
              <h2>About</h2>
              <p
                className={`h-detail-about${aboutIsLong ? " is-clamped" : ""}`}
                style={{ whiteSpace: "pre-line" }}
              >
                {aboutPreview}
              </p>
              {aboutIsLong ? (
                <button
                  type="button"
                  className="readmore"
                  onClick={() => setAboutOpen(true)}
                >
                  Read more {HICONS.chevR}
                </button>
              ) : null}
            </div>
          ) : null}

          {display.gallery && display.gallery.length > 0 ? (
            <div className="h-detail-section">
              <h2>Gallery</h2>
              <div className="h-event-gallery">
                {display.gallery.map((item) => (
                  <div key={item.url} className="h-event-gallery-item">
                    {String(item.type).toUpperCase() === "VIDEO" ? (
                      <video
                        src={item.url}
                        muted
                        playsInline
                        loop
                        controls
                      />
                    ) : (
                      <img src={item.url} alt={display.title} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="h-detail-section">
            <h2>When &amp; where</h2>
            <p>
              {display.dateLong}
              {display.startTime ? ` · ${display.startTime}` : ""}
              {display.endTime ? ` - ${display.endTime}` : ""}
            </p>
            <p>{display.venueShort}</p>
          </div>

          {thingsToKnow.length > 0 ? (
            <div className="h-detail-section">
              <h2>Things to know</h2>
              <div className="h-things">
                {thingsToKnow.map((thing) => (
                  <div key={thing.key} className="h-thing">
                    <span className="ic">{thing.icon}</span>
                    <span>{thing.text}</span>
                  </div>
                ))}
              </div>
              {hasMoreContent ? (
                <button
                  type="button"
                  className="readmore"
                  onClick={() => setMoreOpen(true)}
                >
                  More details {HICONS.chevR}
                </button>
              ) : null}
            </div>
          ) : hasMoreContent ? (
            <div className="h-detail-section">
              <h2>Things to know</h2>
              <button
                type="button"
                className="readmore"
                onClick={() => setMoreOpen(true)}
              >
                More details {HICONS.chevR}
              </button>
            </div>
          ) : null}

          {display.faqs.length > 0 ? (
            <div className="h-detail-section">
              <h2>FAQs</h2>
              <div className="h-faq-list">
                {display.faqs.map((faq, index) => (
                  <details key={`${faq.question}-${index}`} className="h-faq">
                    <summary>{faq.question}</summary>
                    <p>{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          ) : null}

          {people && people.artists.length > 0 ? (
            <div className="h-detail-section">
              <h2>Lineup</h2>
              <div className="h-people-row">
                {people.artists.map((artist, idx) => {
                  const realArtist = !artist.isPhantom && Boolean(artist.slug);
                  const inner = (
                    <>
                      <span
                        className="h-people-avatar"
                        style={
                          artist.picture
                            ? { backgroundImage: `url(${artist.picture})` }
                            : undefined
                        }
                        aria-hidden
                      >
                        {!artist.picture ? (
                          <span className="h-people-avatar-initial">
                            {artist.name.charAt(0).toUpperCase()}
                          </span>
                        ) : null}
                      </span>
                      <span className="h-people-name">{artist.name}</span>
                      {artist.tagline ? (
                        <span className="h-people-sub">{artist.tagline}</span>
                      ) : null}
                    </>
                  );
                  // Real artists with a Hoizr profile route to their page;
                  // phantoms (entered as free text) open a quick mini-profile
                  // modal so the card is still tappable and gives info.
                  return (
                    <button
                      type="button"
                      key={`${artist._id ?? "lineup"}-${idx}`}
                      className="h-people-card h-glass-card h-people-card--linked"
                      onClick={() => {
                        if (realArtist) {
                          router.push(`/artists/${artist.slug}`);
                        } else {
                          setPeopleModal({
                            kind: "artist",
                            id: artist._id ?? undefined,
                            name: artist.name,
                            tagline: artist.tagline ?? undefined,
                            picture: artist.picture ?? undefined,
                          });
                        }
                      }}
                    >
                      {inner}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {people && people.organizers.length > 0 ? (
            <div className="h-detail-section">
              <h2>Organizer{people.organizers.length > 1 ? "s" : ""}</h2>
              <div className="h-people-row">
                {people.organizers.map((org, idx) => {
                  const inner = (
                    <>
                      <span
                        className="h-people-avatar"
                        style={
                          org.logo
                            ? { backgroundImage: `url(${org.logo})` }
                            : undefined
                        }
                        aria-hidden
                      >
                        {!org.logo ? (
                          <span className="h-people-avatar-initial">
                            {org.name.charAt(0).toUpperCase()}
                          </span>
                        ) : null}
                      </span>
                      <span className="h-people-name">{org.name}</span>
                      <span className="h-people-sub">
                        {org.isPrimary ? "Organizer" : "Collaborator"}
                        {org.city ? ` · ${org.city}` : ""}
                      </span>
                    </>
                  );
                  // Organizers always open the mini-profile modal first —
                  // a public /hosts/{id} page exists but it's not the
                  // primary affordance customers expect from this card.
                  return (
                    <button
                      type="button"
                      key={`${org._id ?? "org"}-${idx}`}
                      className="h-people-card h-glass-card h-people-card--linked"
                      onClick={() =>
                        setPeopleModal({
                          kind: "organizer",
                          id: org._id ?? undefined,
                          name: org.name,
                          picture: org.logo ?? undefined,
                          city: org.city ?? undefined,
                          isPrimary: org.isPrimary,
                        })
                      }
                    >
                      {inner}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <p className="h-detail-disclaimer">
            Ticketing by Hoizr. The event itself is run by the organizer - Hoizr is not the event organizer.
          </p>
        </div>

        {/* Floating booking card — desktop right column only. Hidden
            under 1101px because mobile already has the top hero CTA +
            the IntersectionObserver-gated sticky bottom CTA. Sticky to
            top so the price + Book button stay reachable while the
            customer scrolls through the body card on the left. */}
        <aside className="h-detail-booking-card" aria-label="Booking summary">
          <ul className="h-detail-booking-rows">
            <li>
              <button
                type="button"
                className="h-detail-booking-row h-detail-booking-row--button"
                onClick={() => setVenueOpen(true)}
              >
                <span className="h-detail-booking-row__icon" aria-hidden>
                  {HICONS.pin}
                </span>
                <span className="h-detail-booking-row__body">
                  <span className="h-detail-booking-row__title">
                    {display.venueShort}
                  </span>
                  {display.city ? (
                    <span className="h-detail-booking-row__sub">
                      {display.city}
                    </span>
                  ) : null}
                </span>
                <span className="h-detail-booking-row__chev" aria-hidden>
                  {HICONS.chevR}
                </span>
              </button>
            </li>
            <li>
              <button
                type="button"
                className="h-detail-booking-row h-detail-booking-row--button"
                onClick={() => setScheduleOpen(true)}
              >
                <span className="h-detail-booking-row__icon" aria-hidden>
                  {HICONS.clock}
                </span>
                <span className="h-detail-booking-row__body">
                  <span className="h-detail-booking-row__title">
                    {gatesLabel
                      ? `Gates open at ${gatesLabel}`
                      : "View timeline"}
                  </span>
                  <span className="h-detail-booking-row__sub">
                    View full schedule & timeline
                  </span>
                </span>
                <span className="h-detail-booking-row__chev" aria-hidden>
                  {HICONS.chevR}
                </span>
              </button>
            </li>
          </ul>

          <div className="h-detail-booking-divider" aria-hidden />

          <div className="h-detail-booking-foot">
            <div className="h-detail-booking-price">
              <span className="h-detail-booking-price__amount">
                {formatPrice(display.fromPrice)}
              </span>
              <span className="h-detail-booking-price__suffix">
                {display.fromPrice === null || display.fromPrice === 0
                  ? ""
                  : " onwards"}
              </span>
            </div>
            {display.ticketingEnabled ? (
              <Link
                href={ticketsHref}
                className="h-detail-booking-cta"
              >
                Book Tickets
              </Link>
            ) : (
              <span className="h-detail-booking-cta is-disabled">
                Entry only
              </span>
            )}
          </div>
        </aside>
      </div>

      {display.ticketingEnabled ? (
        <Link
          href={ticketsHref}
          className={`h-detail-bottom-cta${showFloatingCta ? " is-visible" : ""}`}
          aria-hidden={!showFloatingCta}
        >
          Book tickets
        </Link>
      ) : null}

      {venueOpen ? (
        <div
          className="h-scrim"
          role="dialog"
          aria-modal="true"
          onClick={() => setVenueOpen(false)}
        >
          <div
            className="h-modal wide h-map-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="h-modal-close"
              onClick={() => setVenueOpen(false)}
              aria-label="Close"
            >
              {HICONS.close}
            </button>
            <h2>{display.venueShort}</h2>
            {venueFullAddress ? (
              <p className="h-map-modal__addr">{venueFullAddress}</p>
            ) : null}
            {mapSrc ? (
              <iframe
                title={`Map of ${display.venueShort}`}
                src={mapSrc}
                className="h-map-modal__iframe"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <p className="h-map-modal__addr">
                Map coordinates haven't been provided yet.
              </p>
            )}
            {mapOpenInGoogleHref ? (
              <a
                href={mapOpenInGoogleHref}
                target="_blank"
                rel="noreferrer"
                className="h-map-modal__cta"
              >
                Open in Google Maps
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      {scheduleOpen ? (
        <div
          className="h-scrim"
          role="dialog"
          aria-modal="true"
          onClick={() => setScheduleOpen(false)}
        >
          <div
            className="h-modal h-schedule-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="h-modal-close"
              onClick={() => setScheduleOpen(false)}
              aria-label="Close"
            >
              {HICONS.close}
            </button>
            <h2>Schedule & timeline</h2>
            <p className="h-schedule-modal__day">{display.dateLong}</p>
            <ul className="h-schedule-list">
              <li>
                <span className="h-schedule-list__label">Gates open</span>
                <span className="h-schedule-list__time">
                  {gatesLabel || "TBA"}
                </span>
              </li>
              <li>
                <span className="h-schedule-list__label">Event starts</span>
                <span className="h-schedule-list__time">
                  {display.startTime || "TBA"}
                </span>
              </li>
              <li>
                <span className="h-schedule-list__label">Event ends</span>
                <span className="h-schedule-list__time">
                  {display.endTime || "TBA"}
                </span>
              </li>
            </ul>
          </div>
        </div>
      ) : null}

      {aboutOpen ? (
        <div
          className="h-scrim"
          role="dialog"
          aria-modal="true"
          onClick={() => setAboutOpen(false)}
        >
          <div
            className="h-modal wide h-more-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="h-modal-close"
              onClick={() => setAboutOpen(false)}
              aria-label="Close"
            >
              {HICONS.close}
            </button>
            <h2>About this event</h2>
            <div
              className="h-richtext"
              dangerouslySetInnerHTML={{
                __html: sanitizeRichText(display.about),
              }}
            />
          </div>
        </div>
      ) : null}

      {peopleModal ? (
        <div
          className="h-scrim"
          role="dialog"
          aria-modal="true"
          onClick={() => setPeopleModal(null)}
        >
          <div
            className="h-modal h-people-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="h-modal-close"
              onClick={() => setPeopleModal(null)}
              aria-label="Close"
            >
              {HICONS.close}
            </button>
            <div className="h-people-modal__head">
              <span
                className="h-people-modal__avatar"
                style={
                  peopleModal.picture
                    ? { backgroundImage: `url(${peopleModal.picture})` }
                    : undefined
                }
                aria-hidden
              >
                {!peopleModal.picture ? (
                  <span className="h-people-modal__initial">
                    {peopleModal.name.charAt(0).toUpperCase()}
                  </span>
                ) : null}
              </span>
              <div className="min-w-0">
                <div className="h-people-modal__name">{peopleModal.name}</div>
                <div className="h-people-modal__sub">
                  {peopleModal.kind === "artist"
                    ? peopleModal.tagline || "Artist"
                    : `${peopleModal.isPrimary ? "Organizer" : "Collaborator"}${
                        peopleModal.city ? ` · ${peopleModal.city}` : ""
                      }`}
                </div>
              </div>
            </div>
            {peopleModal.id ? (
              peopleEvents.loading ? (
                <p className="h-people-modal__note">Loading events…</p>
              ) : peopleEvents.upcoming.length === 0 &&
                peopleEvents.past.length === 0 ? (
                <p className="h-people-modal__note">
                  No other events linked to{" "}
                  {peopleModal.kind === "artist"
                    ? "this artist"
                    : "this organiser"}{" "}
                  yet.
                </p>
              ) : (
                <div className="h-people-modal__events">
                  {peopleEvents.upcoming.length > 0 ? (
                    <section>
                      <h3 className="h-people-modal__section">Upcoming</h3>
                      <ul className="h-people-modal__list">
                        {peopleEvents.upcoming.map((evt) => (
                          <PeopleEventRow key={evt._id} event={evt} />
                        ))}
                      </ul>
                    </section>
                  ) : null}
                  {peopleEvents.past.length > 0 ? (
                    <section>
                      <h3 className="h-people-modal__section">Past</h3>
                      <ul className="h-people-modal__list">
                        {peopleEvents.past.map((evt) => (
                          <PeopleEventRow key={evt._id} event={evt} />
                        ))}
                      </ul>
                    </section>
                  ) : null}
                </div>
              )
            ) : (
              <p className="h-people-modal__note">
                {peopleModal.kind === "artist"
                  ? "This artist isn't on Hoizr yet, so we can't surface their other shows."
                  : "This organiser isn't linked to a Hoizr account yet."}
              </p>
            )}
          </div>
        </div>
      ) : null}

      {moreOpen ? (
        <div className="h-scrim" role="dialog" aria-modal="true">
          <div className="h-modal wide h-more-modal">
            <button
              type="button"
              className="h-modal-close"
              onClick={() => setMoreOpen(false)}
              aria-label="Close"
            >
              {HICONS.close}
            </button>
            <h2>More details</h2>

            {display.eventGuide?.youtubeLink ? (
              <div className="h-more-section">
                <h3>Event guide video</h3>
                <a
                  href={display.eventGuide.youtubeLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open video
                </a>
              </div>
            ) : null}

            {display.eventInstructions.length > 0 ? (
              <div className="h-more-section">
                <h3>Instructions</h3>
                <ul>
                  {display.eventInstructions.map((instruction) => (
                    <li key={instruction}>{instruction}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {prohibitedLabels.length > 0 ? (
              <div className="h-more-section">
                <h3>Not allowed</h3>
                <div className="h-chip-row">
                  {prohibitedLabels.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </div>
            ) : null}

            {display.ticketingTerms ? (
              <div className="h-more-section">
                <h3>Terms &amp; conditions</h3>
                <div
                  className="h-richtext"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeRichText(display.ticketingTerms),
                  }}
                />
              </div>
            ) : null}

            {display.refundPolicy ? (
              <div className="h-more-section">
                <h3>Refund policy</h3>
                <div
                  className="h-richtext"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeRichText(display.refundPolicy),
                  }}
                />
              </div>
            ) : null}

            {display.cancellationPolicy ? (
              <div className="h-more-section">
                <h3>Cancellation policy</h3>
                <div
                  className="h-richtext"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeRichText(display.cancellationPolicy),
                  }}
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};

const PeopleEventRow = ({
  event,
}: {
  event: {
    _id: string;
    title?: string;
    slug?: string;
    eventFlyer?: string;
    horizontalFlyer?: string;
    city?: string;
    startDate?: string;
  };
}) => {
  const flyer = event.eventFlyer || event.horizontalFlyer || "";
  const when = event.startDate
    ? new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(event.startDate))
    : "";
  const href = `/events/${event.slug ?? event._id}`;
  return (
    <li>
      <Link href={href} className="h-people-modal__event">
        <span
          className="h-people-modal__event-flyer"
          style={flyer ? { backgroundImage: `url(${flyer})` } : undefined}
          aria-hidden
        />
        <span className="h-people-modal__event-body">
          <span className="h-people-modal__event-title">
            {event.title ?? "Untitled event"}
          </span>
          <span className="h-people-modal__event-sub">
            {[when, event.city].filter(Boolean).join(" · ") || "Date TBA"}
          </span>
        </span>
      </Link>
    </li>
  );
};
