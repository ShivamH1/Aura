"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import type { SceneConfig } from "@/lib/types";

interface CelestialLayerProps {
  scene: SceneConfig;
  reducedMotion: boolean;
}

interface Star {
  id: number;
  x: number; // %
  y: number; // %
  size: number; // px
  baseOpacity: number;
  twinkleDelay: number;
  twinkleDur: number;
}

// Tiny deterministic PRNG so the starfield is stable across renders.
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

const STAR_COUNT = 60;

export default function CelestialLayer({ scene, reducedMotion }: CelestialLayerProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  const stars = useMemo<Star[]>(() => {
    const rand = mulberry32(0x5eed1234);
    return Array.from({ length: STAR_COUNT }, (_, id) => ({
      id,
      x: rand() * 100,
      y: rand() * 62, // keep stars mostly in the upper sky
      size: rand() * 1.8 + 0.6,
      baseOpacity: rand() * 0.5 + 0.4,
      twinkleDelay: rand() * 4,
      twinkleDur: rand() * 2 + 1.6,
    }));
  }, []);

  // Sun/moon arc position derived from sunPosition (0 rise .. 1 set).
  const { cx, cy } = useMemo(() => {
    const pos = Math.min(1, Math.max(0, scene.sunPosition));
    const x = 15 + pos * 70; // 15% .. 85%
    const peakTop = 8; // highest point (%)
    const range = 42; // how far it dips toward the horizon (%)
    const y = peakTop + (1 - Math.sin(pos * Math.PI)) * range;
    return { cx: x, cy: y };
  }, [scene.sunPosition]);

  useLayoutEffect(() => {
    if (reducedMotion) return;
    const el = rootRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      // Slow ray rotation (daytime only).
      const rays = el.querySelector<HTMLElement>("[data-rays]");
      if (rays) {
        gsap.to(rays, {
          rotate: 360,
          duration: 60,
          ease: "none",
          repeat: -1,
          transformOrigin: "50% 50%",
        });
      }

      // Star twinkle.
      const starEls = el.querySelectorAll<HTMLElement>("[data-star]");
      starEls.forEach((s) => {
        const dur = Number(s.dataset.twdur) || 2;
        const delay = Number(s.dataset.twdelay) || 0;
        const base = Number(s.dataset.base) || 0.6;
        gsap.to(s, {
          opacity: base * 0.25,
          duration: dur,
          delay,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      });
    }, el);

    return () => ctx.revert();
  }, [reducedMotion, scene.isNight, scene.showCelestial]);

  // Stars may render at night even if showCelestial is false; otherwise nothing.
  if (!scene.showCelestial && !scene.isNight) return null;

  return (
    <div
      ref={rootRef}
      aria-hidden
      className="fixed inset-0 -z-9 pointer-events-none overflow-hidden"
    >
      {scene.isNight ? (
        <>
          {/* Starfield */}
          {stars.map((s) => (
            <span
              key={s.id}
              data-star
              data-twdur={s.twinkleDur}
              data-twdelay={s.twinkleDelay}
              data-base={s.baseOpacity}
              className="absolute rounded-full bg-white"
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: `${s.size}px`,
                height: `${s.size}px`,
                opacity: s.baseOpacity,
                boxShadow: "0 0 4px rgba(255,255,255,0.7)",
              }}
            />
          ))}
          {/* Moon */}
          {scene.showCelestial && (
            <div
              className="absolute"
              style={{
                left: `${cx}%`,
                top: `${cy}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div
                className="rounded-full"
                style={{
                  width: "92px",
                  height: "92px",
                  background:
                    "radial-gradient(circle at 38% 35%, #fdfdf6 0%, #e9ecf2 55%, #c7ccd8 100%)",
                  boxShadow:
                    "0 0 60px 18px rgba(220,228,245,0.45), 0 0 140px 40px rgba(180,195,235,0.22)",
                }}
              />
            </div>
          )}
        </>
      ) : (
        scene.showCelestial && (
          <div
            className="absolute"
            style={{
              left: `${cx}%`,
              top: `${cy}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* Rotating rays */}
            <div
              data-rays
              className="absolute left-1/2 top-1/2"
              style={{
                width: "320px",
                height: "320px",
                marginLeft: "-160px",
                marginTop: "-160px",
                background:
                  "conic-gradient(from 0deg, color-mix(in srgb, var(--accent) 35%, transparent) 0deg, transparent 14deg, color-mix(in srgb, var(--accent) 35%, transparent) 30deg, transparent 44deg, color-mix(in srgb, var(--accent) 35%, transparent) 60deg, transparent 74deg, color-mix(in srgb, var(--accent) 35%, transparent) 90deg, transparent 104deg, color-mix(in srgb, var(--accent) 35%, transparent) 120deg, transparent 134deg, color-mix(in srgb, var(--accent) 35%, transparent) 150deg, transparent 164deg, color-mix(in srgb, var(--accent) 35%, transparent) 180deg, transparent 194deg, color-mix(in srgb, var(--accent) 35%, transparent) 210deg, transparent 224deg, color-mix(in srgb, var(--accent) 35%, transparent) 240deg, transparent 254deg, color-mix(in srgb, var(--accent) 35%, transparent) 270deg, transparent 284deg, color-mix(in srgb, var(--accent) 35%, transparent) 300deg, transparent 314deg, color-mix(in srgb, var(--accent) 35%, transparent) 330deg, transparent 344deg, color-mix(in srgb, var(--accent) 35%, transparent) 360deg)",
                maskImage:
                  "radial-gradient(circle, transparent 28%, #000 40%, transparent 72%)",
                WebkitMaskImage:
                  "radial-gradient(circle, transparent 28%, #000 40%, transparent 72%)",
                opacity: 0.5,
              }}
            />
            {/* Halo */}
            <div
              className="absolute left-1/2 top-1/2 rounded-full"
              style={{
                width: "220px",
                height: "220px",
                marginLeft: "-110px",
                marginTop: "-110px",
                background:
                  "radial-gradient(circle, color-mix(in srgb, var(--accent) 45%, transparent) 0%, transparent 65%)",
                filter: "blur(6px)",
              }}
            />
            {/* Sun disc */}
            <div
              className="relative rounded-full"
              style={{
                width: "104px",
                height: "104px",
                background:
                  "radial-gradient(circle at 42% 40%, #fffdf3 0%, var(--accent) 60%, color-mix(in srgb, var(--accent) 70%, #000) 100%)",
                boxShadow:
                  "0 0 70px 24px color-mix(in srgb, var(--accent) 55%, transparent)",
              }}
            />
          </div>
        )
      )}
    </div>
  );
}
