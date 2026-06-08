import type { DailyPoint, HourlyPoint, WeatherCondition } from "./types";

/** Minimal shape of an OpenWeather /forecast list entry that we rely on. */
export interface ForecastEntry {
  dt: number;
  main: { temp: number; temp_min: number; temp_max: number };
  weather: { main: string; icon: string }[];
  pop?: number;
}

function hourLabel(dt: number, offset: number): string {
  const d = new Date((dt + offset) * 1000);
  return `${String(d.getUTCHours()).padStart(2, "0")}:00`;
}

function dayKey(dt: number, offset: number): string {
  const d = new Date((dt + offset) * 1000);
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
}

function weekdayLabel(dt: number, offset: number): string {
  const d = new Date((dt + offset) * 1000);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getUTCDay()];
}

/** Next ~24h of the 3-hour forecast (8 entries). */
export function buildHourly(list: ForecastEntry[], offset: number): HourlyPoint[] {
  return list.slice(0, 8).map((e) => ({
    dt: e.dt,
    temp: e.main.temp,
    condition: (e.weather[0]?.main ?? "Clear") as WeatherCondition,
    icon: e.weather[0]?.icon ?? "01d",
    pop: e.pop ?? 0,
    label: hourLabel(e.dt, offset),
  }));
}

/**
 * Group the 3-hour forecast into per-day points (min/max + a representative
 * midday-ish condition). Returns up to 5 days.
 */
export function buildDaily(list: ForecastEntry[], offset: number): DailyPoint[] {
  const groups = new Map<string, ForecastEntry[]>();
  for (const e of list) {
    const k = dayKey(e.dt, offset);
    const arr = groups.get(k);
    if (arr) arr.push(e);
    else groups.set(k, [e]);
  }

  const days: DailyPoint[] = [];
  for (const entries of groups.values()) {
    let tempMin = Infinity;
    let tempMax = -Infinity;
    let pop = 0;
    for (const e of entries) {
      tempMin = Math.min(tempMin, e.main.temp_min, e.main.temp);
      tempMax = Math.max(tempMax, e.main.temp_max, e.main.temp);
      pop = Math.max(pop, e.pop ?? 0);
    }
    // Representative entry: the one closest to local noon, else the middle one.
    const rep =
      entries.reduce<{ entry: ForecastEntry; dist: number } | null>((best, e) => {
        const h = new Date((e.dt + offset) * 1000).getUTCHours();
        const dist = Math.abs(h - 12);
        if (!best || dist < best.dist) return { entry: e, dist };
        return best;
      }, null)?.entry ?? entries[Math.floor(entries.length / 2)];

    days.push({
      dt: rep.dt,
      tempMin: Math.round(tempMin),
      tempMax: Math.round(tempMax),
      condition: (rep.weather[0]?.main ?? "Clear") as WeatherCondition,
      icon: rep.weather[0]?.icon ?? "01d",
      pop,
      label: weekdayLabel(rep.dt, offset),
    });
  }

  return days.slice(0, 5);
}
