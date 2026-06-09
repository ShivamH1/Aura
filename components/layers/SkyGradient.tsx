"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import type { Palette } from "@/lib/types";

interface SkyGradientProps {
  palette: Palette;
  reducedMotion: boolean;
}

const VAR_MAP: Array<[keyof Palette, string]> = [
  ["top", "--sky-top"],
  ["mid", "--sky-mid"],
  ["bottom", "--sky-bottom"],
  ["accent", "--accent"],
  ["fg", "--fg"],
];

function applyPalette(p: Palette): void {
  const root = document.documentElement;
  for (const [key, cssVar] of VAR_MAP) {
    root.style.setProperty(cssVar, p[key]);
  }
}

export default function SkyGradient({ palette, reducedMotion }: SkyGradientProps) {
  // The palette currently displayed (interpolation source).
  const currentRef = useRef<Palette>(palette);
  const didMountRef = useRef(false);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const from = currentRef.current;
    const to = palette;

    // First mount or reduced motion: snap instantly.
    if (!didMountRef.current || reducedMotion) {
      didMountRef.current = true;
      applyPalette(to);
      currentRef.current = to;
      return;
    }

    // No change — nothing to animate.
    if (
      from.top === to.top &&
      from.mid === to.mid &&
      from.bottom === to.bottom &&
      from.accent === to.accent &&
      from.fg === to.fg
    ) {
      return;
    }

    const ctx = gsap.context(() => {
      const proxy = { t: 0 };
      gsap.to(proxy, {
        t: 1,
        duration: 1.2,
        ease: "power2.inOut",
        onUpdate: () => {
          for (const [key, cssVar] of VAR_MAP) {
            const value = gsap.utils.interpolate(from[key], to[key], proxy.t);
            root.style.setProperty(cssVar, value);
          }
        },
        onComplete: () => {
          applyPalette(to);
          currentRef.current = to;
        },
      });
    });

    return () => ctx.revert();
  }, [palette, reducedMotion]);

  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{
        background:
          "linear-gradient(to bottom, var(--sky-top) 0%, var(--sky-mid) 50%, var(--sky-bottom) 100%)",
      }}
    >
      {/* Soft radial overlay for depth / atmospheric glow. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 18%, color-mix(in srgb, var(--accent) 22%, transparent) 0%, transparent 55%)",
        }}
      />
    </div>
  );
}
