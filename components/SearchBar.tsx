"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import type { GeoResult } from "@/lib/types";
import { locationLabel } from "@/lib/format";

interface SearchBarProps {
  onSelect: (location: GeoResult) => void;
  loading: boolean;
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70"
    />
  );
}

export default function SearchBar({ onSelect, loading }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [open, setOpen] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [active, setActive] = useState(0);
  const [focused, setFocused] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Debounced geocode fetch.
  useEffect(() => {
    const q = query.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      setFetching(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setFetching(true);

      fetch(`/api/geocode?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
        .then(async (res) => {
          if (!res.ok) throw new Error("geocode failed");
          return (await res.json()) as GeoResult[];
        })
        .then((data) => {
          setResults(Array.isArray(data) ? data : []);
          setActive(0);
          setOpen(true);
        })
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          setResults([]);
          setOpen(false);
        })
        .finally(() => {
          if (!ctrl.signal.aborted) setFetching(false);
        });
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Cleanup any in-flight request on unmount.
  useEffect(() => () => abortRef.current?.abort(), []);

  // Animate dropdown open.
  useEffect(() => {
    if (!open || !dropdownRef.current || results.length === 0) return;
    const ctx = gsap.context(() => {
      gsap.from(dropdownRef.current, {
        opacity: 0,
        y: -8,
        duration: 0.25,
        ease: "power3.out",
      });
      gsap.from(dropdownRef.current!.querySelectorAll("li"), {
        opacity: 0,
        y: -6,
        duration: 0.25,
        stagger: 0.03,
        ease: "power3.out",
      });
    }, dropdownRef);
    return () => ctx.revert();
  }, [open, results]);

  // Outside-click closes dropdown.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const choose = useCallback(
    (geo: GeoResult) => {
      onSelect(geo);
      setOpen(false);
      setQuery(locationLabel(geo.name, geo.country, geo.state));
    },
    [onSelect],
  );

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open || results.length === 0) {
      if (e.key === "Enter" && results.length > 0) choose(results[0]);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = results[active] ?? results[0];
      if (pick) choose(pick);
    }
  }

  const showSpinner = loading || fetching;

  return (
    <div ref={rootRef} className="relative w-full">
      <div
        className={`glass glass-hover flex items-center gap-3 px-5 py-3.5 ${
          focused ? "ring-2" : "ring-0"
        }`}
        style={{
          color: "var(--fg)",
          // @ts-expect-error -- CSS custom prop for the focus ring color
          "--tw-ring-color": "var(--accent)",
          boxShadow: focused
            ? "0 0 0 1px var(--accent), 0 8px 40px rgb(0 0 0 / 0.28)"
            : undefined,
        }}
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-5 w-5 shrink-0 opacity-70"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => {
            setFocused(true);
            if (results.length > 0) setOpen(true);
          }}
          onBlur={() => setFocused(false)}
          placeholder="Search any city…"
          role="combobox"
          aria-expanded={open}
          aria-controls="search-listbox"
          aria-autocomplete="list"
          autoComplete="off"
          spellCheck={false}
          className="w-full bg-transparent text-lg font-light outline-none placeholder:opacity-50"
          style={{ color: "var(--fg)" }}
        />

        {showSpinner && <Spinner />}
      </div>

      {open && results.length > 0 && (
        <ul
          ref={dropdownRef}
          id="search-listbox"
          role="listbox"
          className="glass scroll-x absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 max-h-72 overflow-y-auto py-2"
          style={{ color: "var(--fg)" }}
        >
          {results.map((geo, i) => {
            const key = `${geo.lat},${geo.lon},${i}`;
            return (
              <li
                key={key}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(geo);
                }}
                className={`mx-2 cursor-pointer rounded-2xl px-4 py-2.5 text-base transition-colors ${
                  i === active ? "bg-white/15" : "bg-transparent"
                }`}
              >
                <span className="font-light">
                  {locationLabel(geo.name, geo.country, geo.state)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
