"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import gsap from "gsap";

interface CloudLayerProps {
  density: number;
  reducedMotion: boolean;
}

interface CloudDef {
  id: number;
  top: number; // %
  scale: number;
  opacity: number;
  duration: number; // seconds across screen
  startProgress: number; // 0..1 offset along the path
  grey: number; // 0 (white) .. 1 (dark grey)
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function CloudLayer({ density, reducedMotion }: CloudLayerProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  const clouds = useMemo<CloudDef[]>(() => {
    const d = Math.min(1, Math.max(0, density));
    const count = Math.round(3 + d * 5); // 3..8
    const rand = mulberry32(0xc10d + Math.round(d * 100));
    return Array.from({ length: count }, (_, id) => ({
      id,
      top: rand() * 60, // upper 2/3
      scale: rand() * 0.7 + 0.7,
      opacity: (rand() * 0.25 + 0.45) * (0.7 + d * 0.5),
      duration: rand() * 80 + 40, // 40..120s
      startProgress: rand(),
      grey: d * (rand() * 0.5 + 0.5),
    }));
  }, [density]);

  useLayoutEffect(() => {
    if (reducedMotion) return;
    const el = rootRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const cloudEls = el.querySelectorAll<HTMLElement>("[data-cloud]");
      cloudEls.forEach((c) => {
        const dur = Number(c.dataset.dur) || 80;
        const start = Number(c.dataset.start) || 0;
        // Drift from off-screen left to off-screen right, wrapping.
        gsap.fromTo(
          c,
          { xPercent: -130 },
          {
            xPercent: 230,
            duration: dur,
            ease: "none",
            repeat: -1,
            delay: -dur * start, // negative delay = staggered start mid-path
          }
        );
      });
    }, el);

    return () => ctx.revert();
  }, [reducedMotion, clouds]);

  return (
    <div
      ref={rootRef}
      aria-hidden
      className="fixed inset-0 -z-8 pointer-events-none overflow-hidden"
    >
      {clouds.map((c) => {
        const tint = Math.round(255 - c.grey * 90);
        const color = `rgb(${tint},${tint},${Math.min(255, tint + 6)})`;
        const w = 260 * c.scale;
        const h = 90 * c.scale;
        const initialX = reducedMotion
          ? `${-130 + c.startProgress * 360}%`
          : undefined;
        return (
          <div
            key={c.id}
            data-cloud
            data-dur={c.duration}
            data-start={c.startProgress}
            className="absolute"
            style={{
              top: `${c.top}%`,
              left: 0,
              width: `${w}px`,
              height: `${h}px`,
              opacity: c.opacity,
              filter: "blur(14px)",
              transform: initialX ? `translateX(${initialX})` : undefined,
            }}
          >
            {/* Overlapping blobs forming a soft cloud */}
            <div
              className="absolute rounded-full"
              style={{
                left: "0%",
                top: "30%",
                width: "55%",
                height: "70%",
                background: color,
              }}
            />
            <div
              className="absolute rounded-full"
              style={{
                left: "25%",
                top: "0%",
                width: "55%",
                height: "100%",
                background: color,
              }}
            />
            <div
              className="absolute rounded-full"
              style={{
                left: "50%",
                top: "25%",
                width: "55%",
                height: "75%",
                background: color,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
