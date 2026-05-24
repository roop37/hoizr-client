"use client";

import { useEffect, useRef } from "react";
import {
  AnalyticsEventName,
  AnalyticsEventPayload,
  track,
} from "@/lib/tracker";

/**
 * Drop into a server-rendered page to fire a single tracked event
 * once on mount. Used for funnel events with entity context the
 * automatic `pageView` can't capture — e.g. `eventDetailView` with
 * `eventId`, `artistDetailView` with `artistId`.
 *
 * Re-renders that change `eventName` or `payload.eventId` produce a
 * new event; identical values are deduped via the `firedRef` guard so
 * a parent state update doesn't double-count.
 */
type Props = {
  event: AnalyticsEventName;
  payload?: AnalyticsEventPayload;
};

export const TrackView = ({ event, payload }: Props) => {
  const firedRef = useRef<string>("");

  useEffect(() => {
    const key = JSON.stringify({ event, payload });
    if (firedRef.current === key) return;
    firedRef.current = key;
    track(event, payload);
  }, [event, payload]);

  return null;
};
