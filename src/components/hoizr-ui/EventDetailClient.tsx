"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  PublicEvent,
  PublicEventPeopleResponse,
  PublicLanguageMaster,
  PublicProhibitedItemMaster,
} from "@/types/event";
import { toDisplayEvent } from "@/lib/event-display";
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

      <div className="h-detail-grid h-detail-grid--single">


        <div className="h-detail-body-card">
          {display.about ? (
            <div className="h-detail-section">
              <h2>About</h2>
              <p style={{ whiteSpace: "pre-line" }}>{display.about}</p>
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
                  const clickable = !artist.isPhantom && artist.slug;
                  const href = clickable
                    ? `/artists/${artist.slug}`
                    : undefined;
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
                  return clickable ? (
                    <a
                      key={`${artist._id ?? "lineup"}-${idx}`}
                      href={href}
                      className="h-people-card h-glass-card h-people-card--linked"
                    >
                      {inner}
                    </a>
                  ) : (
                    <div
                      key={`${artist._id ?? "lineup"}-${idx}`}
                      className="h-people-card h-glass-card"
                    >
                      {inner}
                    </div>
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
                  const href = org._id ? `/hosts/${org._id}` : undefined;
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
                  return href ? (
                    <a
                      key={`${org._id}-${idx}`}
                      href={href}
                      className="h-people-card h-glass-card h-people-card--linked"
                    >
                      {inner}
                    </a>
                  ) : (
                    <div
                      key={`org-${idx}`}
                      className="h-people-card h-glass-card"
                    >
                      {inner}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          <p className="h-detail-disclaimer">
            Ticketing by Hoizr. The event itself is run by the organizer - Hoizr is not the event organizer.
          </p>
        </div>

      </div>

      {display.ticketingEnabled ? (
        <Link href={ticketsHref} className="h-detail-bottom-cta">
          Book tickets
        </Link>
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
