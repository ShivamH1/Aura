import type {
  CurrentWeather,
  GeoResult,
  Units,
  WeatherCondition,
  WeatherData,
} from "./types";
import { buildHourly, buildDaily } from "./forecast";

const GEO_BASE = "https://api.openweathermap.org/geo/1.0";
const DATA_BASE = "https://api.openweathermap.org/data/2.5";

export class OpenWeatherError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = "OpenWeatherError";
    this.status = status;
  }
}

function apiKey(): string {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) {
    throw new OpenWeatherError(
      "OpenWeather API key is not configured. Add OPENWEATHER_API_KEY to .env.local.",
      500,
    );
  }
  return key;
}

async function getJson<T>(url: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store" });
  } catch {
    throw new OpenWeatherError("Could not reach the weather service.", 502);
  }
  if (res.status === 401) {
    throw new OpenWeatherError(
      "OpenWeather rejected the API key (401). Check OPENWEATHER_API_KEY.",
      401,
    );
  }
  if (!res.ok) {
    throw new OpenWeatherError(
      `Weather service returned ${res.status}.`,
      res.status,
    );
  }
  return (await res.json()) as T;
}

// ---- Geocoding ----

interface RawGeo {
  name: string;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

export async function geocode(query: string, limit = 5): Promise<GeoResult[]> {
  const q = query.trim();
  if (!q) return [];
  const url = `${GEO_BASE}/direct?q=${encodeURIComponent(q)}&limit=${limit}&appid=${apiKey()}`;
  const raw = await getJson<RawGeo[]>(url);
  return raw.map((r) => ({
    name: r.name,
    lat: r.lat,
    lon: r.lon,
    country: r.country,
    state: r.state,
  }));
}

export async function reverseGeocode(lat: number, lon: number): Promise<GeoResult | null> {
  const url = `${GEO_BASE}/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey()}`;
  const raw = await getJson<RawGeo[]>(url);
  const r = raw[0];
  if (!r) return null;
  return { name: r.name, lat: r.lat, lon: r.lon, country: r.country, state: r.state };
}

// ---- Current weather + forecast ----

interface RawWeatherEntry {
  weather: { id: number; main: string; description: string; icon: string }[];
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  wind: { speed: number; deg: number };
  clouds: { all: number };
  visibility?: number;
  pop?: number;
  dt: number;
}

interface RawCurrent extends RawWeatherEntry {
  sys: { sunrise: number; sunset: number };
  timezone: number;
  name: string;
}

interface RawForecast {
  list: RawWeatherEntry[];
  city: { timezone: number; sunrise: number; sunset: number };
}

function localTimeLabel(dt: number, offset: number): string {
  const d = new Date((dt + offset) * 1000);
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getUTCDay()];
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${weekday}, ${hh}:${mm}`;
}

function localHour(dt: number, offset: number): number {
  return new Date((dt + offset) * 1000).getUTCHours();
}

function normalizeCurrent(raw: RawCurrent): CurrentWeather {
  const w = raw.weather[0];
  return {
    temp: raw.main.temp,
    feelsLike: raw.main.feels_like,
    tempMin: raw.main.temp_min,
    tempMax: raw.main.temp_max,
    humidity: raw.main.humidity,
    pressure: raw.main.pressure,
    windSpeed: raw.wind?.speed ?? 0,
    windDeg: raw.wind?.deg ?? 0,
    visibility: raw.visibility ?? 10000,
    clouds: raw.clouds?.all ?? 0,
    condition: (w?.main ?? "Clear") as WeatherCondition,
    description: w?.description ?? "",
    icon: w?.icon ?? "01d",
    isDay: (w?.icon ?? "01d").endsWith("d"),
    dt: raw.dt,
    sunrise: raw.sys.sunrise,
    sunset: raw.sys.sunset,
  };
}

export async function getWeather(
  lat: number,
  lon: number,
  units: Units,
  location: GeoResult,
): Promise<WeatherData> {
  const key = apiKey();
  const currentUrl = `${DATA_BASE}/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${key}`;
  const forecastUrl = `${DATA_BASE}/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${key}`;

  const [rawCurrent, rawForecast] = await Promise.all([
    getJson<RawCurrent>(currentUrl),
    getJson<RawForecast>(forecastUrl),
  ]);

  const offset = rawCurrent.timezone ?? rawForecast.city.timezone ?? 0;
  const current = normalizeCurrent(rawCurrent);

  return {
    location,
    timezoneOffset: offset,
    localHour: localHour(rawCurrent.dt, offset),
    localTimeLabel: localTimeLabel(rawCurrent.dt, offset),
    units,
    current,
    hourly: buildHourly(rawForecast.list, offset),
    daily: buildDaily(rawForecast.list, offset),
  };
}
