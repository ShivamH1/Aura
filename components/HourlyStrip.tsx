"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import type { WeatherData } from "@/lib/types";
import { iconUrl, popPercent, tempUnit } from "@/lib/format";

interface HourlyStripProps {
  data: WeatherData;
  reducedMotion?: boolean;
}

function Droplet() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-3 w-3"
      fill="currentColor"
    >
      <path d="M12 2.5S5 10 5 14.5a7 7 0 0 0 14 0C19 10 12 2.5 12 2.5Z" />
    </svg>
  );
}

export default function HourlyStrip({
  data,
  reducedMotion = false,
}: HourlyStripProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const hourly = data.hourly ?? [];
  const tu = tempUnit(data.units);

  useEffect(() => {
    if (reducedMotion || hourly.length === 0) return;
    const ctx = gsap.context(() => {
      gsap.from(rootRef.current, {
        opacity: 0,
        y: 24,
        duration: 0.7,
        ease: "power3.out",
      });
      gsap.from(rootRef.current!.querySelectorAll("[data-item]"), {
        opacity: 0,
        y: 16,
        duration: 0.6,
        stagger: 0.04,
        ease: "power3.out",
        delay: 0.1,
      });
    }, rootRef);
    return () => ctx.revert();
  }, [data, reducedMotion, hourly.length]);

  return (
    <section
      ref={rootRef}
      className="glass p-6"
      style={{ color: "var(--fg)" }}
    >
      <h2 className="mb-4 text-xs uppercase tracking-wider opacity-60">
        Next hours
      </h2>

      {hourly.length === 0 ? (
        <p className="text-sm opacity-60">No hourly data available.</p>
      ) : (
        <div className="scroll-x flex gap-3 overflow-x-auto pb-2">
          {hourly.map((h, i) => (
            <div
              key={`${h.dt}-${i}`}
              data-item
              className="flex min-w-[4.5rem] flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-3 py-3"
            >
              <span className="text-xs opacity-70">{h.label}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={iconUrl(h.icon)}
                alt={h.condition}
                width={44}
                height={44}
                className="h-11 w-11"
              />
              <span className="text-base font-light">
                {Math.round(h.temp)}
                {tu}
              </span>
              {h.pop > 0 ? (
                <span className="flex items-center gap-1 text-xs opacity-70">
                  <Droplet />
                  {popPercent(h.pop)}
                </span>
              ) : (
                <span className="h-4" aria-hidden />
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
