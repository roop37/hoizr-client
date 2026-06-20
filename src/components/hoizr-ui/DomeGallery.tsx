"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useRouter } from "next/navigation";
import { getArtistDisplayName } from "@/lib/artist-name";
import type { PublicArtistListItem } from "@/types/artist";

type DomeItem = {
  x: number;
  y: number;
  sizeX: number;
  sizeY: number;
  src: string;
  alt: string;
  artist: PublicArtistListItem | null;
};

const DEFAULTS = {
  maxVerticalRotationDeg: 6,
  dragSensitivity: 22,
  segments: 30,
  overlayBlurColor: "#0a0a0e",
};

const FALLBACK_TILES = [
  "linear-gradient(135deg, #FA2D48 0%, #7A1FFF 100%)",
  "linear-gradient(135deg, #FF2E8A 0%, #FFB347 100%)",
  "linear-gradient(135deg, #3FE0FF 0%, #1F62E8 100%)",
  "linear-gradient(135deg, #C5FF3D 0%, #1F8A5B 100%)",
  "linear-gradient(135deg, #2A3550 0%, #060616 100%)",
  "linear-gradient(135deg, #FF7A3D 0%, #C04A0A 100%)",
];

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const wrapAngleSigned = (deg: number) => {
  const a = (((deg + 180) % 360) + 360) % 360;
  return a - 180;
};

function buildItems(pool: PublicArtistListItem[], seg: number): DomeItem[] {
  const xCols = Array.from({ length: seg }, (_, i) => -Math.floor(seg / 2) + i * 2);
  const evenYs = [-4, -2, 0, 2, 4];
  const oddYs = [-3, -1, 1, 3];
  const coords = xCols.flatMap((x, c) => {
    const ys = c % 2 === 0 ? evenYs : oddYs;
    return ys.map((y) => ({ x, y, sizeX: 2, sizeY: 2 }));
  });
  if (pool.length === 0) {
    return coords.map((c) => ({ ...c, src: "", alt: "", artist: null }));
  }
  return coords.map((c, i) => {
    const a = pool[i % pool.length];
    const name = getArtistDisplayName(a);
    return { ...c, src: a.profilePhoto ?? "", alt: name, artist: a };
  });
}

type Props = {
  artists: PublicArtistListItem[];
  fit?: number;
  minRadius?: number;
  maxRadius?: number;
  padFactor?: number;
  segments?: number;
  overlayBlurColor?: string;
};

export const DomeGallery = ({
  artists,
  fit = 0.42,
  minRadius = 520,
  maxRadius = 900,
  padFactor = 0.18,
  segments = DEFAULTS.segments,
  overlayBlurColor = DEFAULTS.overlayBlurColor,
}: Props) => {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const sphereRef = useRef<HTMLDivElement | null>(null);
  const rotationRef = useRef({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const startPosRef = useRef<
    | {
        x: number;
        y: number;
        lastX: number;
        lastY: number;
        vx?: number;
        vy?: number;
      }
    | null
  >(null);
  const startRotRef = useRef({ x: 0, y: 0 });
  const inertiaRAF = useRef<number | null>(null);
  const idleRAF = useRef<number | null>(null);
  const lastDragEndAt = useRef(0);

  const items = useMemo(() => buildItems(artists, segments), [artists, segments]);

  const applyTransform = useCallback((x: number, y: number) => {
    const el = sphereRef.current;
    if (el) el.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${x}deg) rotateY(${y}deg)`;
  }, []);

  useEffect(() => {
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      if (!draggingRef.current && !inertiaRAF.current) {
        rotationRef.current.y = wrapAngleSigned(rotationRef.current.y + dt * 0.005);
        applyTransform(rotationRef.current.x, rotationRef.current.y);
      }
      idleRAF.current = requestAnimationFrame(tick);
    };
    idleRAF.current = requestAnimationFrame(tick);
    return () => {
      if (idleRAF.current) cancelAnimationFrame(idleRAF.current);
    };
  }, [applyTransform]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0].contentRect;
      const w = Math.max(1, cr.width);
      const h = Math.max(1, cr.height);
      const basis = Math.max(w, h);
      let radius = basis * fit;
      radius = clamp(radius, minRadius, maxRadius);
      const minDim = Math.min(w, h);
      const viewerPad = Math.max(8, Math.round(minDim * padFactor));
      root.style.setProperty("--radius", `${Math.round(radius)}px`);
      root.style.setProperty("--viewer-pad", `${viewerPad}px`);
      root.style.setProperty("--overlay-blur-color", overlayBlurColor);
      applyTransform(rotationRef.current.x, rotationRef.current.y);
    });
    ro.observe(root);
    return () => ro.disconnect();
  }, [fit, minRadius, maxRadius, padFactor, overlayBlurColor, applyTransform]);

  const stopInertia = useCallback(() => {
    if (inertiaRAF.current) {
      cancelAnimationFrame(inertiaRAF.current);
      inertiaRAF.current = null;
    }
  }, []);

  const startInertia = useCallback(
    (vx: number, vy: number) => {
      let vX = clamp(vx, -1.6, 1.6) * 70;
      let vY = clamp(vy, -1.6, 1.6) * 70;
      const friction = 0.96;
      const step = () => {
        vX *= friction;
        vY *= friction;
        if (Math.abs(vX) < 0.03 && Math.abs(vY) < 0.03) {
          inertiaRAF.current = null;
          return;
        }
        rotationRef.current.x = clamp(
          rotationRef.current.x - vY / 200,
          -DEFAULTS.maxVerticalRotationDeg,
          DEFAULTS.maxVerticalRotationDeg,
        );
        rotationRef.current.y = wrapAngleSigned(rotationRef.current.y + vX / 200);
        applyTransform(rotationRef.current.x, rotationRef.current.y);
        inertiaRAF.current = requestAnimationFrame(step);
      };
      stopInertia();
      inertiaRAF.current = requestAnimationFrame(step);
    },
    [applyTransform, stopInertia],
  );

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    stopInertia();
    draggingRef.current = true;
    startRotRef.current = { ...rotationRef.current };
    startPosRef.current = { x: e.clientX, y: e.clientY, lastX: e.clientX, lastY: e.clientY };
    stageRef.current?.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || !startPosRef.current) return;
    const dx = e.clientX - startPosRef.current.x;
    const dy = e.clientY - startPosRef.current.y;
    rotationRef.current.x = clamp(
      startRotRef.current.x - dy / DEFAULTS.dragSensitivity,
      -DEFAULTS.maxVerticalRotationDeg,
      DEFAULTS.maxVerticalRotationDeg,
    );
    rotationRef.current.y = wrapAngleSigned(startRotRef.current.y + dx / DEFAULTS.dragSensitivity);
    applyTransform(rotationRef.current.x, rotationRef.current.y);
    startPosRef.current.vx = e.clientX - startPosRef.current.lastX;
    startPosRef.current.vy = e.clientY - startPosRef.current.lastY;
    startPosRef.current.lastX = e.clientX;
    startPosRef.current.lastY = e.clientY;
  };

  const onPointerUp = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const sp = startPosRef.current;
    if (sp && (Math.abs(sp.vx ?? 0) > 1.5 || Math.abs(sp.vy ?? 0) > 1.5)) {
      startInertia((sp.vx ?? 0) / 40, (sp.vy ?? 0) / 40);
    }
    lastDragEndAt.current = performance.now();
  };

  const onTileClick = (artist: PublicArtistListItem | null) => {
    if (performance.now() - lastDragEndAt.current < 120) return;
    if (!artist) return;
    const href = artist.slug ? `/artist/${artist.slug}` : `/artist?id=${artist._id}`;
    router.push(href);
  };

  return (
    <div ref={rootRef} className="dome-root">
      <div
        ref={stageRef}
        className="dome-stage"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div className="dome-perspective">
          <div ref={sphereRef} className="dome-sphere">
            {items.map((it, i) => {
              const style: CSSProperties = {
                ["--offset-x" as never]: it.x,
                ["--offset-y" as never]: it.y,
                ["--item-size-x" as never]: it.sizeX,
                ["--item-size-y" as never]: it.sizeY,
              };
              const fallback = FALLBACK_TILES[i % FALLBACK_TILES.length];
              return (
                <div key={`${it.x},${it.y},${i}`} className="dome-item" style={style}>
                  <button
                    type="button"
                    className="dome-tile"
                    aria-label={it.alt || "Artist"}
                    title={it.alt}
                    onClick={() => onTileClick(it.artist)}
                  >
                    {it.src ? (
                      <img src={it.src} alt={it.alt} draggable={false} />
                    ) : (
                      <div style={{ position: "absolute", inset: 0, background: fallback }} />
                    )}
                    {it.artist ? (
                      <span className="dome-name">
                        {getArtistDisplayName(it.artist)}
                      </span>
                    ) : null}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        <div className="dome-overlay" />
        <div className="dome-edge dome-edge--top" />
        <div className="dome-edge dome-edge--bottom" />
      </div>
    </div>
  );
};
