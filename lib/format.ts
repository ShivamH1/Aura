import type { Units } from "./types";

/** OpenWeather icon bitmap URL (e.g. "10d" -> .../10d@2x.png). */
export function iconUrl(icon: string, big = false): string {
  return `https://openweathermap.org/img/wn/${icon}@${big ? "4x" : "2x"}.png`;
}

export function tempUnit(units: Units): string {
  return units === "metric" ? "°C" : "°F";
}

export function speedUnit(units: Units): string {
  return units === "metric" ? "m/s" : "mph";
}

export function formatTemp(value: number, units: Units): string {
  return `${Math.round(value)}${tempUnit(units)}`;
}

/** Short label for a location, e.g. "Paris, FR" or "Paris, Île-de-France, FR". */
export function locationLabel(
  name: string,
  country: string,
  state?: string,
): string {
  return [name, state, country].filter(Boolean).join(", ");
}

export function popPercent(pop: number): string {
  return `${Math.round(pop * 100)}%`;
}
