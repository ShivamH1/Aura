"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import type { VibeResult, WeatherData } from "@/lib/types";

interface VibePanelProps {
  data: WeatherData;
}

type Status = "loading" | "ready" | "error";

const HEX_RE = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/;

function extractHex(text: string): string | null {
  const m = text.match(HEX_RE);
  return m ? m[0] : null;
}

export default function VibePanel({ data }: VibePanelProps) {
  const [status, setStatus] = useState<Status>("loading");
  const [vibe, setVibe] = useState<VibeResult | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setStatus("loading");
    setVibe(null);

    fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "vibe", weather: data }),
      signal: ctrl.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("vibe failed");
        return (await res.json()) as VibeResult;
      })
      .then((result) => {
        setVibe(result);
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
  }, [status, vibe]);

  const swatch = vibe ? extractHex(vibe.colorMood) : null;

  return (
    <section className="glass p-6" style={{ color: "var(--fg)" }}>
      <header className="mb-4 flex items-center gap-2">
        <span className="text-xs uppercase tracking-wider opacity-60">
          Today&apos;s vibe
        </span>
        <span aria-hidden className="text-sm">
          ✨
        </span>
      </header>

      {status === "loading" && (
        <div className="flex flex-col gap-4">
          <div className="h-7 w-3/4 animate-pulse rounded-full bg-white/15" />
          <div className="h-7 w-1/2 animate-pulse rounded-full bg-white/12" />
          <div className="mt-2 flex gap-3">
            <div className="h-5 w-24 animate-pulse rounded-full bg-white/10" />
            <div className="h-5 w-28 animate-pulse rounded-full bg-white/10" />
          </div>
        </div>
      )}

      {status === "error" && (
        <p className="text-sm opacity-60">
          Couldn&apos;t read the vibe right now.
        </p>
      )}

      {status === "ready" && vibe && (
        <div ref={contentRef} className="flex flex-col gap-5">
          <p
            data-reveal
            className="text-2xl font-light italic leading-snug sm:text-3xl"
          >
            {vibe.moodLine}
          </p>

          <div data-reveal className="flex flex-col gap-2">
            <p className="text-sm">
              <span className="text-xs uppercase tracking-wider opacity-60">
                Energy{" "}
              </span>
              <span className="opacity-90">{vibe.energy}</span>
            </p>

            <p className="flex items-center gap-2 text-sm">
              <span className="text-xs uppercase tracking-wider opacity-60">
                Color mood
              </span>
              {swatch && (
                <span
                  aria-hidden
                  className="inline-block h-4 w-4 rounded-full border border-white/30"
                  style={{ background: swatch }}
                />
              )}
              <span className="opacity-90">{vibe.colorMood}</span>
            </p>
          </div>

          <span
            data-reveal
            className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-sm"
          >
            <span aria-hidden>🎵</span>
            {vibe.playlistVibe}
          </span>
        </div>
      )}
    </section>
  );
}
