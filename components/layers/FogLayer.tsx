"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import gsap from "gsap";

interface FogLayerProps {
  intensity: number;
  reducedMotion: boolean;
}

interface Band {
  id: number;
  top: number; // %
  height: number; // px
  opacity: number;
  duration: number;
  dir: 1 | -1;
  blur: number;
}

export default function FogLayer({ intensity, reducedMotion }: FogLayerProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  const bands = useMemo<Band[]>(() => {
    const d = Math.min(1, Math.max(0, intensity));
    const defs: Array<{ top: number; height: number; dur: number; dir: 1 | -1 }> = [
      { top: 18, height: 220, dur: 70, dir: 1 },
      { top: 42, height: 260, dur: 52, dir: -1 },
      { top: 64, height: 300, dur: 80, dir: 1 },
      { top: 80, height: 340, dur: 38, dir: -1 },
    ];
    return defs.map((b, id) => ({
      id,
      top: b.top,
      height: b.height,
      opacity: (0.12 + d * 0.4) * (1 - id * 0.08),
      duration: b.dur,
      dir: b.dir,
      blur: 50 + id * 8,
    }));
  }, [intensity]);

  useLayoutEffect(() => {
    if (reducedMotion) return;
    const el = rootRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const bandEls = el.querySelectorAll<HTMLElement>("[data-band]");
      bandEls.forEach((b) => {
        const dur = Number(b.dataset.dur) || 60;
        const dir = Number(b.dataset.dir) || 1;
        gsap.fromTo(
          b,
          { xPercent: -12 * dir },
          {
            xPercent: 12 * dir,
            duration: dur,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          }
        );
      });
    }, el);

    return () => ctx.revert();
  }, [reducedMotion, bands]);

  return (
    <div
      ref={rootRef}
      aria-hidden
      className="fixed inset-0 -z-6 pointer-events-none overflow-hidden"
    >
      {bands.map((b) => (
        <div
          key={b.id}
          data-band
          data-dur={b.duration}
          data-dir={b.dir}
          className="absolute"
          style={{
            top: `${b.top}%`,
            left: "-25%",
            width: "150%",
            height: `${b.height}px`,
            opacity: b.opacity,
            filter: `blur(${b.blur}px)`,
            background:
              "linear-gradient(90deg, transparent 0%, rgba(225,228,235,0.9) 25%, rgba(235,238,244,0.95) 50%, rgba(225,228,235,0.9) 75%, transparent 100%)",
            borderRadius: "50%",
          }}
        />
      ))}
    </div>
  );
}
