"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GeoResult, Units, WeatherData } from "@/lib/types";

export interface UseWeatherResult {
  data: WeatherData | null;
  loading: boolean;
  error: string | null;
  units: Units;
  setUnits: (u: Units) => void;
  search: (location: GeoResult) => Promise<void>;
}

function buildWeatherUrl(location: GeoResult, units: Units): string {
  const params = new URLSearchParams({
    lat: String(location.lat),
    lon: String(location.lon),
    units,
    name: location.name,
    country: location.country,
  });
  if (location.state) params.set("state", location.state);
  return `/api/weather?${params.toString()}`;
}

export function useWeather(): UseWeatherResult {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [units, setUnits] = useState<Units>("metric");

  const lastLocationRef = useRef<GeoResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const firstRenderRef = useRef(true);

  const fetchFor = useCallback(async (location: GeoResult, u: Units) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(buildWeatherUrl(location, u), {
        signal: controller.signal,
      });
      const payload = await res.json();

      if (!res.ok || (payload && payload.error)) {
        const message =
          (payload && payload.error) ||
          `Could not load weather (status ${res.status}).`;
        setError(String(message));
        return;
      }

      setData(payload as WeatherData);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        return; // superseded request; leave state to the newer one
      }
      const message =
        e instanceof Error ? e.message : "Could not load weather.";
      setError(message);
    } finally {
      if (abortRef.current === controller) {
        setLoading(false);
      }
    }
  }, []);

  const search = useCallback(
    async (location: GeoResult) => {
      lastLocationRef.current = location;
      await fetchFor(location, units);
    },
    [fetchFor, units],
  );

  // Refetch the last location whenever units change (skip first render and
  // the case where nothing has been searched yet).
  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    const location = lastLocationRef.current;
    if (!location) return;
    void fetchFor(location, units);
  }, [units, fetchFor]);

  // Cancel any in-flight request on unmount.
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  return { data, loading, error, units, setUnits, search };
}
