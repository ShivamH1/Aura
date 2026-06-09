"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import type { WeatherData } from "@/lib/types";
import { iconUrl, locationLabel, speedUnit, tempUnit } from "@/lib/format";

interface WeatherHudProps {
  data: WeatherData;
  reducedMotion?: boolean;
}

interface Tile {
  label: string;
  value: string;
}

export default function WeatherHud({
  data,
  reducedMotion = false,
}: WeatherHudProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const tempRef = useRef<HTMLSpanElement>(null);
  const prevTemp = useRef<number>(Math.round(data.current.temp));

  const { current, units, location } = data;
  const tu = tempUnit(units);
  const place = locationLabel(location.name, location.country, location.state);

  const tiles: Tile[] = [
    { label: "Humidity", value: `${current.humidity}%` },
    {
      label: "Wind",
      value: `${Math.round(current.windSpeed)} ${speedUnit(units)}`,
    },
    { label: "Pressure", value: `${current.pressure} hPa` },
    { label: "Visibility", value: `${(current.visibility / 1000).toFixed(1)} km` },
    { label: "Cloudiness", value: `${current.clouds}%` },
  ];

  useEffect(() => {
    const target = Math.round(current.temp);

    if (reducedMotion) {
      if (tempRef.current) tempRef.current.textContent = String(target);
      prevTemp.current = target;
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(rootRef.current, {
        opacity: 0,
        y: 24,
        duration: 0.7,
        ease: "power3.out",
      });
      gsap.from(rootRef.current!.querySelectorAll("[data-stagger]"), {
        opacity: 0,
        y: 16,
        duration: 0.6,
        stagger: 0.06,
        ease: "power3.out",
        delay: 0.1,
      });

      const counter = { v: prevTemp.current };
      gsap.to(counter, {
        v: target,
        duration: 0.8,
        ease: "power2.out",
        onUpdate: () => {
          if (tempRef.current) {
            tempRef.current.textContent = String(Math.round(counter.v));
          }
        },
      });
    }, rootRef);

    prevTemp.current = target;
    return () => ctx.revert();
  }, [current.temp, reducedMotion]);

  return (
    <section
      ref={rootRef}
      className="glass p-7 sm:p-9"
      style={{ color: "var(--fg)" }}
    >
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4" data-stagger>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={iconUrl(current.icon, true)}
            alt={current.description}
            width={140}
            height={140}
            className="h-32 w-32 drop-shadow-[0_8px_24px_rgba(0,0,0,0.35)] sm:h-36 sm:w-36"
          />
          <div className="flex items-start">
            <span
              ref={tempRef}
              className="text-7xl font-extralight leading-none tracking-tight sm:text-8xl"
            >
              {Math.round(current.temp)}
            </span>
            <span className="mt-2 text-2xl font-light opacity-70">{tu}</span>
          </div>
        </div>

        <div className="text-center sm:text-right" data-stagger>
          <p className="text-2xl font-light capitalize">
            {current.description}
          </p>
          <p className="mt-1 text-base opacity-70">{place}</p>
          <p className="mt-3 text-sm opacity-70">
            Feels like {Math.round(current.feelsLike)}
            {tu}
          </p>
          <p className="mt-3 text-xs uppercase tracking-wider opacity-60">
            Local time
          </p>
          <p className="text-sm opacity-80">{data.localTimeLabel}</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((t) => (
          <div
            key={t.label}
            data-stagger
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center"
          >
            <p className="text-xs uppercase tracking-wider opacity-60">
              {t.label}
            </p>
            <p className="mt-1 text-lg font-light">{t.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
