"use client";

import { useMemo } from "react";
import { useWeather } from "@/hooks/useWeather";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { buildScene, IDLE_SCENE } from "@/lib/weatherScene";
import type { GeoResult, Units } from "@/lib/types";

import AtmosphereScene from "@/components/AtmosphereScene";
import SearchBar from "@/components/SearchBar";
import WeatherHud from "@/components/WeatherHud";
import HourlyStrip from "@/components/HourlyStrip";
import FiveDayForecast from "@/components/FiveDayForecast";
import VibePanel from "@/components/ai/VibePanel";
import RecommendationsPanel from "@/components/ai/RecommendationsPanel";
import ChatPanel from "@/components/ai/ChatPanel";

const QUICK_CITIES = [
  "Reykjavik",
  "Bergen",
  "Edinburgh",
  "Zurich",
  "Oklahoma",
  "Chicago",
  "Seattle",
];

export default function Home() {
  const { data, loading, error, units, setUnits, search } = useWeather();
  const reducedMotion = useReducedMotion();

  const scene = useMemo(() => (data ? buildScene(data) : IDLE_SCENE), [data]);

  const handleSelect = (location: GeoResult) => {
    void search(location);
  };

  const handleQuick = async (name: string) => {
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(name)}`);
      const list = (await res.json()) as GeoResult[];
      if (Array.isArray(list) && list[0]) void search(list[0]);
    } catch {
      /* ignore — surfaced via the weather fetch if it proceeds */
    }
  };

  return (
    <div className="relative min-h-screen" style={{ color: "var(--fg)" }}>
      <AtmosphereScene scene={scene} reducedMotion={reducedMotion} />

      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
        {/* Header */}
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Aura
            </span>
            <span className="hidden text-sm opacity-60 sm:inline">
              feel the weather
            </span>
          </div>
          <UnitsToggle units={units} onChange={setUnits} />
        </header>

        {/* Search */}
        <div className="mx-auto w-full max-w-xl">
          <SearchBar onSelect={handleSelect} loading={loading} />
        </div>

        {/* States */}
        {error && (
          <div
            className="glass mx-auto w-full max-w-xl px-5 py-4 text-center text-sm"
            role="alert"
          >
            {error}
          </div>
        )}

        {!data && !loading && !error && (
          <section className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
            <div className="max-w-md space-y-3">
              <h1 className="text-3xl font-light leading-tight sm:text-4xl">
                Search a city to step inside its sky.
              </h1>
              <p className="text-sm opacity-70">
                Live conditions, a 5-day forecast, and an AI that turns the
                weather into a feeling.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {QUICK_CITIES.map((city) => (
                <button
                  key={city}
                  onClick={() => handleQuick(city)}
                  className="glass glass-hover rounded-full px-4 py-2 text-sm hover:-translate-y-0.5"
                  style={{
                    borderColor:
                      "color-mix(in srgb, var(--accent) 40%, transparent)",
                  }}
                >
                  {city}
                </button>
              ))}
            </div>
          </section>
        )}

        {loading && !data && (
          <div className="flex flex-1 items-center justify-center">
            <div
              className="h-10 w-10 animate-spin rounded-full border-2 border-white/20"
              style={{ borderTopColor: "var(--accent)" }}
              aria-label="Loading weather"
            />
          </div>
        )}

        {/* Results */}
        {data && (
          <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <WeatherHud data={data} reducedMotion={reducedMotion} />
            </div>
            <div className="lg:col-span-1">
              <VibePanel data={data} />
            </div>

            <div className="lg:col-span-3">
              <HourlyStrip data={data} reducedMotion={reducedMotion} />
            </div>

            <div className="lg:col-span-1">
              <FiveDayForecast data={data} reducedMotion={reducedMotion} />
            </div>
            <div className="lg:col-span-1">
              <RecommendationsPanel data={data} />
            </div>
            <div className="lg:col-span-1">
              <ChatPanel data={data} />
            </div>
          </section>
        )}

        <footer className="mt-auto w-full pt-8 pb-4">
          <div className="mb-6 h-px w-full bg-linear-to-r from-transparent via-white/10 to-transparent" />
          <div className="flex flex-col items-center justify-between gap-4 text-xs sm:flex-row">
            {/* Data Source */}
            <a
              href="https://openweathermap.org"
              target="_blank"
              rel="noopener noreferrer"
              className="glass glass-hover group flex items-center gap-2 px-4 py-2 hover:bg-white/12 hover:border-white/25 hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 opacity-60 group-hover:opacity-100 group-hover:text-(--accent) transition-all"
              >
                <path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.47-.04-.89-.24-1.22-.56C14.12 9.4 12.22 8 10 8c-3.13 0-6 2.3-6 5.5C4 16.5 6.5 19 9.5 19h8Z" />
              </svg>
              <span className="opacity-50 group-hover:opacity-80 transition-opacity">
                Data by
              </span>
              <span className="font-medium group-hover:text-(--accent) transition-colors">
                OpenWeather
              </span>
            </a>

            {/* AI Engine Info */}
            <div className="relative group">
              <div
                className="glass flex items-center gap-2 px-4 py-2 cursor-help transition-all duration-300"
                style={{
                  background:
                    "color-mix(in srgb, var(--accent) 6%, rgba(255,255,255,0.06))",
                  borderColor:
                    "color-mix(in srgb, var(--accent) 20%, rgba(255,255,255,0.14))",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 text-(--accent) animate-pulse"
                >
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                  <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5 5 3Z" />
                </svg>
                <span className="opacity-50">AI Supported</span>
                <span className="font-semibold text-(--accent)">Aura Vibe</span>
              </div>

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-60 p-3 bg-[#0d0e1b]/95 backdrop-blur-xl border border-white/10 rounded-2xl text-[10px] text-white/90 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all duration-300 shadow-xl z-50 text-center">
                <p className="font-semibold mb-1 text-(--accent)">
                  Intelligent Weather Vibe
                </p>
                <p className="opacity-70 leading-normal">
                  Generates real-time visual mood gradients, playlists, and
                  recommendations based on local sky conditions.
                </p>
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#0d0e1b]/95"></div>
              </div>
            </div>

            {/* Developer Credits */}
            <a
              href="https://github.com/ShivamH1"
              target="_blank"
              rel="noopener noreferrer"
              className="glass glass-hover group flex items-center gap-2 px-4 py-2 hover:bg-white/12 hover:border-white/25 hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 opacity-60 group-hover:opacity-100 group-hover:text-(--accent) transition-all"
              >
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                <path d="M9 18c-4.51 2-5-2-7-2" />
              </svg>
              <span className="opacity-50 group-hover:opacity-80 transition-opacity">
                Built by
              </span>
              <span className="font-medium group-hover:text-(--accent) transition-colors">
                Shivam Honrao
              </span>
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}

function UnitsToggle({
  units,
  onChange,
}: {
  units: Units;
  onChange: (u: Units) => void;
}) {
  return (
    <div className="glass flex items-center gap-1 rounded-full p-1 text-sm">
      {(["metric", "imperial"] as Units[]).map((u) => {
        const active = units === u;
        return (
          <button
            key={u}
            onClick={() => onChange(u)}
            className="rounded-full px-3 py-1 transition"
            style={
              active
                ? {
                    background:
                      "color-mix(in srgb, var(--accent) 30%, transparent)",
                    color: "var(--fg)",
                  }
                : { opacity: 0.6 }
            }
            aria-pressed={active}
          >
            {u === "metric" ? "°C" : "°F"}
          </button>
        );
      })}
    </div>
  );
}
