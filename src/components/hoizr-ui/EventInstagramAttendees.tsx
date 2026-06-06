"use client";

import { Eye, Instagram, Lock, Users } from "lucide-react";
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
 * Compact landscape card on the event detail page that surfaces the
 * Instagram-connected attendee row. Two states:
 *
 *  1. Viewer NOT connected (logged out OR logged in without IG) →
 *     "Connect your Instagram and find out who is visiting." CTA →
 *     /me/profile (or /login if logged out). The face row is hidden
 *     because seeing others requires being seeable yourself.
 *
 *  2. Viewer connected → render the face row. Each tile is an
 *     attendee who has BOTH connected IG AND opted-in for visibility
 *     (the resolver gates this server-side).
 */
export const EventInstagramAttendees = ({ eventId }: Props) => {
  const profile = useAuthStore((s) => s.profile);
  const hydrated = useAuthStore((s) => s.hydrated);
  const [viewerIg, setViewerIg] = useState<CustomerInstagram | null>(null);
  const [viewerLoading, setViewerLoading] = useState(true);
  const [attendees, setAttendees] = useState<
    EventAttendeeWithInstagram[]
  >([]);
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
    // Quiet placeholder — this section is sweetener, not core to the
    // event detail page, so we don't want spinner noise above the
    // fold. The card slots into place once data lands.
    return null;
  }

  const viewerConnected = Boolean(viewerIg?.connected);
  const viewerVisible = Boolean(
    viewerIg?.connected && viewerIg?.attendeeVisibility
  );

  return (
    <div className="h-detail-section">
      <section className="h-event-ig-card">
        <div className="h-event-ig-card__copy">
          <div className="h-event-ig-card__kicker">
            <Instagram size={14} />
            Who&apos;s coming
          </div>
          {viewerConnected ? (
            <>
              <h3>
                {attendees.length
                  ? `${attendees.length} attendee${
                      attendees.length === 1 ? "" : "s"
                    } you can see`
                  : "No one&apos;s opted in yet"}
              </h3>
              <p>
                {viewerVisible
                  ? "You're visible too — your handle shows up on every event you book."
                  : "Turn on attendee visibility in your profile to be seen by other Hoizr-goers."}
              </p>
              {!viewerVisible ? (
                <Link
                  href="/me/profile"
                  className="h-event-ig-card__cta h-event-ig-card__cta--soft"
                >
                  <Eye size={14} />
                  Manage visibility
                </Link>
              ) : null}
            </>
          ) : (
            <>
              <h3>Connect your Instagram</h3>
              <p>
                Find out who else is coming. Connect your Instagram and
                we&apos;ll show a face row of other ticket-holders who
                opted in. Your handle and last 10 posts come along too.
              </p>
              <Link
                href={profile ? "/me/profile" : `/login?next=${encodeURIComponent(
                  `/events`
                )}`}
                className="h-event-ig-card__cta"
              >
                <Instagram size={14} />
                {profile ? "Connect Instagram" : "Sign in to connect"}
              </Link>
            </>
          )}
        </div>

        {viewerConnected ? (
          attendees.length ? (
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
          ) : (
            <div className="h-event-ig-card__empty">
              <Users size={18} />
              <span>Once attendees turn on visibility, they&apos;ll show up here.</span>
            </div>
          )
        ) : (
          <div className="h-event-ig-card__locked">
            <Lock size={18} />
            <span>Faces unlock once you connect your Instagram.</span>
          </div>
        )}
      </section>
    </div>
  );
};
