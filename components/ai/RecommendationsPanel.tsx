"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import type { RecommendationsResult, WeatherData } from "@/lib/types";

interface RecommendationsPanelProps {
  data: WeatherData;
}

type Status = "loading" | "ready" | "error";

export default function RecommendationsPanel({
  data,
}: RecommendationsPanelProps) {
  const [status, setStatus] = useState<Status>("loading");
  const [recs, setRecs] = useState<RecommendationsResult | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setStatus("loading");
    setRecs(null);

    fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "recommendations", weather: data }),
      signal: ctrl.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("recommendations failed");
        return (await res.json()) as RecommendationsResult;
      })
      .then((result) => {
        setRecs(result);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setStatus("error");
      });

    return () => ctrl.abort();
  }, [data]);

  useEffect(() => {
    if (status !== "ready" || !contentRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(contentRef.current!.querySelectorAll("[data-reveal]"), {
        opacity: 0,
        y: 14,
        duration: 0.6,
        stagger: 0.08,
        ease: "power3.out",
      });
    }, contentRef);
    return () => ctx.revert();
  }, [status, recs]);

  const activities = recs?.activities ?? [];

  return (
    <section className="glass p-6" style={{ color: "var(--fg)" }}>
      <header className="mb-4">
        <span className="text-xs uppercase tracking-wider opacity-60">
          Smart picks
        </span>
      </header>

      {status === "loading" && (
        <div className="flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="h-4 w-20 animate-pulse rounded-full bg-white/10" />
              <div className="h-5 w-3/4 animate-pulse rounded-full bg-white/15" />
            </div>
          ))}
        </div>
      )}

      {status === "error" && (
        <p className="text-sm opacity-60">No recommendations available yet.</p>
      )}

      {status === "ready" && recs && (
        <div ref={contentRef} className="flex flex-col gap-5">
          <div data-reveal className="flex gap-3">
            <span aria-hidden className="text-lg leading-none">
              👕
            </span>
            <div>
              <p className="text-xs uppercase tracking-wider opacity-60">
                Outfit
              </p>
              <p className="mt-0.5 text-sm opacity-90">{recs.outfit}</p>
            </div>
          </div>

          <div data-reveal className="flex gap-3">
            <span aria-hidden className="text-lg leading-none">
              ✦
            </span>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wider opacity-60">
                Activities
              </p>
              {activities.length === 0 ? (
                <p className="mt-0.5 text-sm opacity-60">Nothing in particular.</p>
              ) : (
                <ul className="mt-1 flex flex-col gap-1">
                  {activities.map((a, i) => (
                    <li
                      key={`${i}-${a}`}
                      className="flex items-start gap-2 text-sm opacity-90"
                    >
                      <span aria-hidden className="opacity-60">
                        ✦
                      </span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div data-reveal className="flex gap-3">
            <span aria-hidden className="text-lg leading-none">
              🧭
            </span>
            <div>
              <p className="text-xs uppercase tracking-wider opacity-60">
                Travel
              </p>
              <p className="mt-0.5 text-sm opacity-90">{recs.travel}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
