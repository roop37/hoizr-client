"use client";

import { Instagram } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  /** Event flyer — used as a blurred, low-opacity reflective backdrop so the
   *  card picks up the event's own colour palette. */
  flyerUrl?: string | null;
};

const FACE_ROW_LIMIT = 16;
// Avatars shown in the overlapping stack before we collapse to a "+N" chip.
const STACK_LIMIT = 6;
// Handles spelled out under the stack.
const HANDLE_LIMIT = 3;

const cleanHandle = (h?: string | null) => (h ? h.replace(/^@/, "") : "");

/**
 * "Who's coming 👀" card on the event detail + order pages.
 *
 * States:
 *   1. Viewer NOT connected → bold "be the first / connect Instagram" CTA card
 *      (concept borrowed from the venues card in HSide: kicker + headline +
 *      sub + CTA arrow ↗).
 *   2. Viewer connected, nobody else opted in → same CTA-style "early bird".
 *   3. Viewer connected with attendees → overlapping avatar stack + count +
 *      a few handles.
 *
 * A blurred copy of the event flyer sits behind a translucent overlay so the
 * card reflects the event's colours without any IG-branded chrome.
 */
export const EventInstagramAttendees = ({ eventId, flyerUrl }: Props) => {
  const profile = useAuthStore((s) => s.profile);
  const hydrated = useAuthStore((s) => s.hydrated);
  const pathname = usePathname();
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
  const showFaces = viewerConnected && count > 0;

  // Backdrop layer — blurred flyer (when present) under a dark/accent wash.
  const backdrop = (
    <span className="h-ig-card__backdrop" aria-hidden>
      {flyerUrl ? (
        <span
          className="h-ig-card__flyer"
          style={{ backgroundImage: `url(${flyerUrl})` }}
        />
      ) : null}
      <span className="h-ig-card__wash" />
    </span>
  );

  // ── State 3: connected + attendees → avatar stack + count + handles ──────
  if (showFaces) {
    const stack = attendees.slice(0, STACK_LIMIT);
    const overflow = count - stack.length;
    const handles = attendees
      .map((a) => cleanHandle(a.handle))
      .filter(Boolean)
      .slice(0, HANDLE_LIMIT);

    return (
      <div className="h-detail-section">
        <section className="h-ig-card h-ig-card--filled">
          {backdrop}
          <div className="h-ig-card__inner">
            <div className="h-ig-card__kicker">
              <Instagram size={13} />
              Who&apos;s coming
            </div>

            <div className="h-ig-card__stackrow">
              <ul className="h-ig-stack" aria-hidden>
                {stack.map((a) => (
                  <li key={a.customerId} className="h-ig-stack__item">
                    <span
                      className="h-ig-stack__avatar"
                      style={
                        a.avatar
                          ? {
                              backgroundImage: `url(${a.avatar})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }
                          : undefined
                      }
                    >
                      {!a.avatar ? (
                        <span>{(a.firstName ?? a.handle ?? "?").charAt(0)}</span>
                      ) : null}
                    </span>
                  </li>
                ))}
                {overflow > 0 ? (
                  <li className="h-ig-stack__item">
                    <span className="h-ig-stack__avatar h-ig-stack__more">
                      +{overflow}
                    </span>
                  </li>
                ) : null}
              </ul>
              <div className="h-ig-card__count">
                <strong>
                  {count} {count === 1 ? "person" : "people"}
                </strong>
                <span>locking it in</span>
              </div>
            </div>

            {handles.length ? (
              <div className="h-ig-card__handles">
                {handles.map((h) => (
                  <a
                    key={h}
                    href={`https://instagram.com/${h}`}
                    target="_blank"
                    rel="noreferrer"
                    className="h-ig-card__handle"
                  >
                    @{h}
                  </a>
                ))}
                {count > handles.length ? (
                  <span className="h-ig-card__handle h-ig-card__handle--rest">
                    & more
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    );
  }

  // ── States 1 & 2: CTA card (concept borrowed from the HSide venues card) ─
  const earlyBird = viewerConnected; // connected but nobody else opted in yet

  const headline = earlyBird ? (
    <>
      Be the first. <span className="h-ig-cta__accent">Set the tone.</span>
    </>
  ) : (
    <>
      See who&apos;s going. <span className="h-ig-cta__accent">Show you are too.</span>
    </>
  );
  const sub = earlyBird
    ? "You're early — opt in and you might just set the night's lineup."
    : "Connect Instagram to peek at the off-stage lineup — half the fun is who's in the room.";

  return (
    <div className="h-detail-section">
      <section className="h-ig-card h-ig-card--cta">
        {backdrop}
        <div className="h-ig-card__inner">
          <div className="h-ig-cta__copy">
            <div className="h-ig-card__kicker">
              <Instagram size={13} />
              Who&apos;s coming
            </div>
            <h3 className="h-ig-cta__hed">{headline}</h3>
            <p className="h-ig-cta__sub">{sub}</p>
          </div>
          {!viewerConnected ? (
            <Link
              href={
                profile
                  ? `/me/profile?next=${encodeURIComponent(pathname ?? "/events")}`
                  : `/login?next=${encodeURIComponent(pathname ?? "/events")}`
              }
              className="h-ig-cta__btn"
            >
              {profile ? "Connect Instagram" : "Sign in to connect"}
              <span className="h-ig-cta__arrow" aria-hidden>
                ↗
              </span>
            </Link>
          ) : null}
        </div>
      </section>
    </div>
  );
};
