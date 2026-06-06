"use client";

import { Instagram } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { gqlRequest } from "@/lib/graphql";
import {
  GET_EVENT_ATTENDEES_WITH_INSTAGRAM_QUERY,
  GET_MY_INSTAGRAM_QUERY,
} from "@/lib/queries";
import { useAuthStore } from "@/store/auth";
import type {
  CustomerInstagram,
  EventAttendeeWithInstagram,
} from "@/types/instagram";

type Props = {
  eventId: string;
};

const FACE_ROW_LIMIT = 16;

/**
 * "Who's coming 👀" card on the event detail page. Glass surface to
 * match the rest of the event sections — no IG-branded gradient, no
 * loud CTA. Visibility toggle lives only in /me/profile (tucked behind
 * a disclosure), never on the event surface.
 *
 * States:
 *   1. Viewer NOT connected → flirty nudge + Connect Instagram button.
 *   2. Viewer connected, nobody else opted in → playful "early bird".
 *   3. Viewer connected with attendees → face row + interesting-count.
 */
export const EventInstagramAttendees = ({ eventId }: Props) => {
  const profile = useAuthStore((s) => s.profile);
  const hydrated = useAuthStore((s) => s.hydrated);
  const [viewerIg, setViewerIg] = useState<CustomerInstagram | null>(null);
  const [viewerLoading, setViewerLoading] = useState(true);
  const [attendees, setAttendees] = useState<EventAttendeeWithInstagram[]>([]);
  const [attendeesLoading, setAttendeesLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (!hydrated) return;
    if (!profile) {
      setViewerIg(null);
      setViewerLoading(false);
      return;
    }
    setViewerLoading(true);
    gqlRequest<{ getMyInstagram: CustomerInstagram | null }>(
      GET_MY_INSTAGRAM_QUERY
    )
      .then((d) => {
        if (mounted) setViewerIg(d.getMyInstagram ?? null);
      })
      .catch(() => {
        if (mounted) setViewerIg(null);
      })
      .finally(() => {
        if (mounted) setViewerLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [profile?._id, hydrated, profile]);

  useEffect(() => {
    let mounted = true;
    setAttendeesLoading(true);
    gqlRequest<{
      getEventAttendeesWithInstagram: EventAttendeeWithInstagram[];
    }>(GET_EVENT_ATTENDEES_WITH_INSTAGRAM_QUERY, {
      eventId,
      limit: FACE_ROW_LIMIT,
    })
      .then((d) => {
        if (!mounted) return;
        setAttendees(d.getEventAttendeesWithInstagram ?? []);
      })
      .catch(() => {
        if (mounted) setAttendees([]);
      })
      .finally(() => {
        if (mounted) setAttendeesLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [eventId]);

  if (!hydrated || viewerLoading || attendeesLoading) {
    return null;
  }

  const viewerConnected = Boolean(viewerIg?.connected);
  const count = attendees.length;

  const heading = viewerConnected
    ? count > 0
      ? `${count} interesting ${count === 1 ? "person" : "people"} coming 👀`
      : "You're early — eyes on this one 👀"
    : "Who's eyeing this one? 👀";

  const blurb = viewerConnected
    ? count > 0
      ? "These are the folks locking it in. Tap a face — you never know who you'll bump into at the door."
      : "Be the first to opt in and you might just set the tone for the night."
    : "Connect your Instagram and peek at who's coming. The off-stage lineup is half the fun.";

  const showFaces = viewerConnected && count > 0;

  return (
    <div className="h-detail-section">
      <section
        className={`h-glass-card h-event-ig-card${
          showFaces ? "" : " h-event-ig-card--solo"
        }`}
      >
        <div className="h-event-ig-card__copy">
          <div className="h-event-ig-card__kicker">
            <Instagram size={14} />
            Who&apos;s coming
          </div>
          <h3>{heading}</h3>
          <p>{blurb}</p>
          {!viewerConnected ? (
            <Link
              href={
                profile
                  ? "/me/profile"
                  : `/login?next=${encodeURIComponent("/events")}`
              }
              className="h-event-ig-card__cta"
            >
              <Instagram size={14} />
              {profile ? "Connect Instagram" : "Sign in to connect"}
            </Link>
          ) : null}
        </div>

        {viewerConnected && count > 0 ? (
          <ul className="h-event-ig-card__faces">
            {attendees.map((a) => (
              <li key={a.customerId} className="h-event-ig-face">
                <a
                  href={
                    a.handle
                      ? `https://instagram.com/${a.handle.replace(/^@/, "")}`
                      : undefined
                  }
                  target={a.handle ? "_blank" : undefined}
                  rel={a.handle ? "noreferrer" : undefined}
                  aria-label={`${a.firstName ?? "Attendee"} on Instagram`}
                >
                  <span
                    className="h-event-ig-face__avatar"
                    style={
                      a.avatar
                        ? {
                            backgroundImage: `url(${a.avatar})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }
                        : undefined
                    }
                    aria-hidden
                  >
                    {!a.avatar ? (
                      <span>{(a.firstName ?? "?").charAt(0)}</span>
                    ) : null}
                  </span>
                  <span className="h-event-ig-face__name">
                    {a.firstName ?? a.handle ?? "Hoizr-goer"}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
};
