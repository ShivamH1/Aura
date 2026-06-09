"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

interface LightningLayerProps {
  active: boolean;
  reducedMotion: boolean;
}

export default function LightningLayer({ active, reducedMotion }: LightningLayerProps) {
  const flashRef = useRef<HTMLDivElement>(null);
  const boltRef = useRef<SVGSVGElement>(null);

  useLayoutEffect(() => {
    if (!active) return;
    const flash = flashRef.current;
    if (!flash) return;

    // Tracks the pending delayedCall so it can be cancelled on cleanup.
    let killed = false;
    let pending: gsap.core.Tween | null = null;

    const ctx = gsap.context(() => {
      if (reducedMotion) {
        // A single subtle, infrequent flash — no rapid strobing.
        gsap.fromTo(
          flash,
          { opacity: 0 },
          {
            opacity: 0.18,
            duration: 0.4,
            ease: "sine.inOut",
            yoyo: true,
            repeat: 1,
            repeatDelay: 0,
            delay: 6,
          }
        );
        return;
      }

      // Recursive scheduler: double-flash, then random 3–9s gap, repeat.
      const strike = () => {
        if (killed) return;
        const tl = gsap.timeline({
          onComplete: () => {
            if (killed) return;
            pending = gsap.delayedCall(gsap.utils.random(3, 9), strike);
          },
        });

        if (boltRef.current) {
          tl.set(boltRef.current, { opacity: 0 }, 0);
        }

        tl.set(flash, { opacity: 0 })
          .to(flash, { opacity: 0.7, duration: 0.06, ease: "power2.out" })
          .to(flash, { opacity: 0.1, duration: 0.08, ease: "power2.in" });

        if (boltRef.current) {
          tl.to(boltRef.current, { opacity: 0.85, duration: 0.05 }, "<");
        }

        tl.to(flash, { opacity: 0.5, duration: 0.06, ease: "power2.out" });

        if (boltRef.current) {
          tl.to(boltRef.current, { opacity: 0, duration: 0.12 }, "<");
        }

        tl.to(flash, { opacity: 0, duration: 0.22, ease: "power2.in" });
      };

      // Initial delay before the first strike.
      pending = gsap.delayedCall(gsap.utils.random(1.2, 3.5), strike);
    });

    return () => {
      killed = true;
      pending?.kill();
      ctx.revert();
    };
  }, [active, reducedMotion]);

  if (!active) return null;

  return (
    <div aria-hidden className="fixed inset-0 -z-5 pointer-events-none">
      <div
        ref={flashRef}
        className="absolute inset-0 bg-white"
        style={{ opacity: 0 }}
      />
      <svg
        ref={boltRef}
        className="absolute"
        style={{
          left: "58%",
          top: "0%",
          height: "62%",
          opacity: 0,
          filter: "drop-shadow(0 0 12px rgba(220,235,255,0.9))",
        }}
        viewBox="0 0 60 200"
        fill="none"
        preserveAspectRatio="xMidYMin meet"
      >
        <path
          d="M34 0 L14 86 L30 86 L8 200 L52 78 L34 78 L48 0 Z"
          fill="rgba(235,244,255,0.95)"
        />
      </svg>
    </div>
  );
}
