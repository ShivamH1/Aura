export type Units = "metric" | "imperial";

export type WeatherCondition =
  | "Clear"
  | "Clouds"
  | "Rain"
  | "Drizzle"
  | "Thunderstorm"
  | "Snow"
  | "Mist"
  | "Smoke"
  | "Haze"
  | "Dust"
  | "Fog"
  | "Sand"
  | "Ash"
  | "Squall"
  | "Tornado";

export interface GeoResult {
  name: string;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

export interface CurrentWeather {
  temp: number;
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDeg: number;
  visibility: number;
  clouds: number;
  condition: WeatherCondition;
  description: string;
  icon: string; // e.g. "10d"
  isDay: boolean;
  dt: number; // UTC seconds
  sunrise: number;
  sunset: number;
}

export interface HourlyPoint {
  dt: number;
  temp: number;
  condition: WeatherCondition;
  icon: string;
  pop: number; // probability of precipitation 0..1
  /** local hour label, e.g. "15:00" */
  label: string;
}

export interface DailyPoint {
  dt: number;
  tempMin: number;
  tempMax: number;
  condition: WeatherCondition;
  icon: string;
  pop: number;
  /** local weekday label, e.g. "Mon" */
  label: string;
}

export interface WeatherData {
  location: GeoResult;
  /** seconds shift from UTC for the searched location */
  timezoneOffset: number;
  /** the location's current local hour, 0..23 */
  localHour: number;
  /** ISO-ish local time string for display, e.g. "Tue, 15:42" */
  localTimeLabel: string;
  units: Units;
  current: CurrentWeather;
  hourly: HourlyPoint[];
  daily: DailyPoint[];
}

export type TimeBand = "dawn" | "day" | "golden" | "dusk" | "night";

export type ParticleKind = "rain" | "snow" | null;

export interface Palette {
  top: string;
  mid: string;
  bottom: string;
  accent: string;
  /** text/foreground tone that reads well on this palette */
  fg: string;
}

export interface SceneConfig {
  condition: WeatherCondition;
  timeBand: TimeBand;
  isNight: boolean;
  palette: Palette;
  particle: ParticleKind;
  /** 0..1 strength used for particle counts, fog opacity, etc. */
  intensity: number;
  showCelestial: boolean;
  showClouds: boolean;
  cloudDensity: number; // 0..1
  showFog: boolean;
  showLightning: boolean;
  /** position of the sun/moon along its arc, 0 (rise) .. 1 (set) */
  sunPosition: number;
}

// ---- AI types ----

export interface VibeResult {
  moodLine: string;
  energy: string;
  colorMood: string;
  playlistVibe: string;
}

export interface RecommendationsResult {
  outfit: string;
  activities: string[];
  travel: string;
}

export type AiMode = "vibe" | "recommendations";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
