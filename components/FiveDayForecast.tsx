"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import type { WeatherData } from "@/lib/types";
import { iconUrl, popPercent, tempUnit } from "@/lib/format";

interface FiveDayForecastProps {
  data: WeatherData;
  reducedMotion?: boolean;
}

export default function FiveDayForecast({
  data,
  reducedMotion = false,
}: FiveDayForecastProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const daily = data.daily ?? [];
  const tu = tempUnit(data.units);

  // Week-wide min/max for relative range bars.
  const weekMin = daily.length
    ? Math.min(...daily.map((d) => d.tempMin))
    : 0;
  const weekMax = daily.length
    ? Math.max(...daily.map((d) => d.tempMax))
    : 1;
  const span = Math.max(weekMax - weekMin, 1);

  useEffect(() => {
    if (reducedMotion || daily.length === 0) return;
    const ctx = gsap.context(() => {
      gsap.from(rootRef.current, {
        opacity: 0,
        y: 24,
        duration: 0.7,
        ease: "power3.out",
      });
      gsap.from(rootRef.current!.querySelectorAll("[data-row]"), {
        opacity: 0,
        y: 14,
        duration: 0.6,
        stagger: 0.06,
        ease: "power3.out",
        delay: 0.1,
      });
    }, rootRef);
    return () => ctx.revert();
  }, [data, reducedMotion, daily.length]);

  return (
    <section
      ref={rootRef}
      className="glass p-6"
      style={{ color: "var(--fg)" }}
    >
      <h2 className="mb-4 text-xs uppercase tracking-wider opacity-60">
        5-day forecast
      </h2>

      {daily.length === 0 ? (
        <p className="text-sm opacity-60">No forecast data available.</p>
      ) : (
        <ul className="flex flex-col">
          {daily.map((d, i) => {
            const leftPct = ((d.tempMin - weekMin) / span) * 100;
            const widthPct = ((d.tempMax - d.tempMin) / span) * 100;
            return (
              <li
                key={`${d.dt}-${i}`}
                data-row
                className="grid grid-cols-[3rem_2.5rem_1fr_auto] items-center gap-3 border-b border-white/10 py-3 last:border-b-0"
              >
                <span className="text-sm font-light">{d.label}</span>

                <div className="flex items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={iconUrl(d.icon)}
                    alt={d.condition}
                    width={36}
                    height={36}
                    className="h-9 w-9"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  {d.pop > 0 && (
                    <span className="text-xs opacity-70">
                      {popPercent(d.pop)}
                    </span>
                  )}
                  <div className="relative h-1.5 w-full rounded-full bg-white/12">
                    <span
                      className="absolute top-0 h-full rounded-full"
                      style={{
                        left: `${leftPct}%`,
                        width: `${Math.max(widthPct, 6)}%`,
                        background:
                          "linear-gradient(90deg, color-mix(in srgb, var(--accent) 55%, transparent), var(--accent))",
                      }}
                    />
                  </div>
                </div>

                <div className="flex w-20 items-center justify-end gap-2 text-sm">
                  <span className="opacity-60">
                    {Math.round(d.tempMin)}
                    {tu}
                  </span>
                  <span className="font-light">
                    {Math.round(d.tempMax)}
                    {tu}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
