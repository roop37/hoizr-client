"use client";

import { useCallback, useEffect, useRef } from "react";
import type { DisplayEvent } from "@/lib/event-display";
import { EventCard } from "./EventCard";

type Props = {
  title: string;
  events: DisplayEvent[];
};

/**
 * Static horizontal carousel with native overflow-scroll + custom drag
 * and wheel handlers. No auto-rotation. Loop is achieved by rendering
 * the events 3× and snapping scrollLeft back to the middle copy when
 * the user reaches either edge — visually seamless.
 *
 * - Wheel: vertical delta becomes horizontal scroll (deltaX still
 *   passes through for trackpad horizontal swipes).
 * - Drag: pointer-driven scroll with a short inertia tail so a flick
 *   of the wrist gives a few hundred pixels of follow-through.
 */
export const MarqueeRow = ({ title, events }: Props) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const oneCopyWidth = useRef(0);
  // Auto-scroll is paused while the user hovers / touches / drags the row.
  const pausedRef = useRef(false);
  const reduceMotionRef = useRef(false);
  // A tiny row (< 4) would just drift through visible duplicates — keep it static.
  const autoScrollEnabled = events.length >= 4;

  // Position scrollLeft at the start of the middle copy on mount so we
  // have equal "runway" on both sides.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => {
      oneCopyWidth.current = el.scrollWidth / 3;
      el.scrollLeft = oneCopyWidth.current;
    };
    measure();
    // Re-measure once images settle (poster aspect-ratio is fixed so
    // this should be a no-op, but cheap insurance against late layout
    // shifts on slow networks).
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [events.length]);

  // Respect prefers-reduced-motion: no auto-scroll when the user asked for less.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduceMotionRef.current = mq.matches;
    const onChange = () => {
      reduceMotionRef.current = mq.matches;
    };
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  // Very-very-slow continuous auto-scroll. Nudges scrollLeft a few px/sec; the
  // existing onScroll boundary-wrap makes it loop seamlessly over the tripled
  // list. Paused on hover/touch/drag and disabled for reduced-motion / tiny rows.
  useEffect(() => {
    if (!autoScrollEnabled) return;
    const el = trackRef.current;
    if (!el) return;
    const SPEED_PX_PER_SEC = 10; // gentle drift
    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      const dt = t - last;
      last = t;
      if (
        !pausedRef.current &&
        !reduceMotionRef.current &&
        oneCopyWidth.current
      ) {
        el.scrollLeft += (SPEED_PX_PER_SEC * dt) / 1000;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [autoScrollEnabled, events.length]);

  // Boundary wrap: if the user scrolls past either edge, instantly
  // shift scrollLeft by one copy-width so the loop is invisible.
  const onScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const w = oneCopyWidth.current;
    if (!w) return;
    if (el.scrollLeft < w * 0.5) {
      el.scrollLeft += w;
    } else if (el.scrollLeft > w * 2.5) {
      el.scrollLeft -= w;
    }
  }, []);

  // Vertical mouse wheel is left untouched so the page can scroll
  // down past the marquee. Trackpad horizontal swipes (native deltaX)
  // and Shift+wheel still scroll the row horizontally via the
  // browser's default handling on `overflow-x: auto`.

  // Pointer drag with inertia tail.
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el) return;
    // Ignore right-clicks and clicks landing on real interactive
    // elements (links / buttons) — we still want tile clicks to
    // navigate without being eaten by the drag handler.
    if (e.button !== 0) return;

    // Hold the auto-scroll while the user is interacting; resumed on pointer-up
    // (tap) or once the inertia tail finishes (drag).
    pausedRef.current = true;

    const startX = e.clientX;
    const startScroll = el.scrollLeft;
    let lastX = startX;
    let lastT = performance.now();
    let velocity = 0; // px per ms
    let moved = 0;
    let dragging = false;

    const DRAG_THRESHOLD = 6;

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      if (!dragging) {
        if (Math.abs(dx) < DRAG_THRESHOLD) return;
        dragging = true;
        el.setPointerCapture(ev.pointerId);
        el.classList.add("h-marquee-track--dragging");
      }
      const now = performance.now();
      const dt = now - lastT || 1;
      velocity = (ev.clientX - lastX) / dt;
      lastX = ev.clientX;
      lastT = now;
      el.scrollLeft = startScroll - dx;
      moved = Math.abs(dx);
    };

    const onUp = (ev: PointerEvent) => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.classList.remove("h-marquee-track--dragging");
      if (el.hasPointerCapture(ev.pointerId)) {
        el.releasePointerCapture(ev.pointerId);
      }
      if (!dragging) {
        pausedRef.current = false; // a tap, not a drag — resume now
        return;
      }
      // Suppress the click that would otherwise fire on the underlying
      // tile after a real drag.
      if (moved > DRAG_THRESHOLD) {
        const swallow = (clickEv: MouseEvent) => {
          clickEv.preventDefault();
          clickEv.stopPropagation();
          window.removeEventListener("click", swallow, true);
        };
        window.addEventListener("click", swallow, true);
      }
      // Decaying inertia — small freeplay so the row keeps drifting
      // after a flick.
      const DECAY = 0.94;
      const MIN_V = 0.04;
      let raf = 0;
      let lastTickT = performance.now();
      const tick = (t: number) => {
        const dt = t - lastTickT;
        lastTickT = t;
        if (Math.abs(velocity) < MIN_V) {
          cancelAnimationFrame(raf);
          pausedRef.current = false; // inertia done — resume auto-scroll
          return;
        }
        el.scrollLeft -= velocity * dt;
        velocity *= DECAY;
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
  }, []);

  if (events.length === 0) return null;

  const tripled = [...events, ...events, ...events];

  return (
    <section className="h-marquee-sec" aria-label={title}>
      <div className="h-marquee-head">
        <h2>{title}</h2>
        <span className="h-marquee-sub">{events.length} events</span>
      </div>
      <div className="h-marquee" role="region" aria-roledescription="carousel">
        <div
          ref={trackRef}
          className="h-marquee-track"
          onScroll={onScroll}
          onPointerDown={onPointerDown}
          onPointerEnter={() => {
            pausedRef.current = true;
          }}
          onPointerLeave={() => {
            pausedRef.current = false;
          }}
        >
          {tripled.map((e, idx) => (
            <div key={`${e.id}-${idx}`} className="h-marquee-item">
              <EventCard event={e} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
