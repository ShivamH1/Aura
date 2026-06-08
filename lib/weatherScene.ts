import type {
  Palette,
  SceneConfig,
  TimeBand,
  WeatherCondition,
  WeatherData,
} from "./types";

export function timeBandFromHour(hour: number): TimeBand {
  if (hour >= 5 && hour < 8) return "dawn";
  if (hour >= 8 && hour < 17) return "day";
  if (hour >= 17 && hour < 19) return "golden";
  if (hour >= 19 && hour < 21) return "dusk";
  return "night";
}

const isNightBand = (b: TimeBand) => b === "night";

/** Base sky palettes per time of day (clear-sky reference). */
const TIME_PALETTES: Record<TimeBand, Palette> = {
  dawn: {
    top: "#1e2a52",
    mid: "#5b6aa8",
    bottom: "#f6b48a",
    accent: "#ffd9a0",
    fg: "#fef6ef",
  },
  day: {
    top: "#1f7fe0",
    mid: "#56a8ef",
    bottom: "#bfe3ff",
    accent: "#ffe27a",
    fg: "#04203f",
  },
  golden: {
    top: "#3a3c8e",
    mid: "#d2654f",
    bottom: "#ffb35c",
    accent: "#ffd27a",
    fg: "#2a160d",
  },
  dusk: {
    top: "#161a40",
    mid: "#5b3a73",
    bottom: "#c2567a",
    accent: "#ffae8f",
    fg: "#fdeef2",
  },
  night: {
    top: "#05060f",
    mid: "#0d1330",
    bottom: "#1a2350",
    accent: "#9fb4ff",
    fg: "#e7ecff",
  },
};

/** Overcast/storm overrides keep the time hue but mute and darken it. */
const RAIN_PALETTE_DAY: Palette = {
  top: "#2e3a47",
  mid: "#48586a",
  bottom: "#7e909f",
  accent: "#9fd0ff",
  fg: "#eef4fa",
};
const RAIN_PALETTE_NIGHT: Palette = {
  top: "#080b12",
  mid: "#14202e",
  bottom: "#243441",
  accent: "#6fa8d8",
  fg: "#dfeaf2",
};
const STORM_PALETTE: Palette = {
  top: "#06070d",
  mid: "#181a2b",
  bottom: "#33324a",
  accent: "#b9a7ff",
  fg: "#eef0fb",
};
const SNOW_PALETTE_DAY: Palette = {
  top: "#6c80a4",
  mid: "#9fb2cf",
  bottom: "#dfe9f5",
  accent: "#ffffff",
  fg: "#1d2a3d",
};
const SNOW_PALETTE_NIGHT: Palette = {
  top: "#0a0f1d",
  mid: "#1c2742",
  bottom: "#3a4a6b",
  accent: "#dce8ff",
  fg: "#eaf1ff",
};
const FOG_PALETTE_DAY: Palette = {
  top: "#8b94a0",
  mid: "#a9b1ba",
  bottom: "#cdd3d9",
  accent: "#eef1f4",
  fg: "#2a2f36",
};
const FOG_PALETTE_NIGHT: Palette = {
  top: "#15181f",
  mid: "#262b35",
  bottom: "#3c424d",
  accent: "#aeb6c0",
  fg: "#e3e6ea",
};

const FOG_CONDITIONS: WeatherCondition[] = [
  "Mist",
  "Smoke",
  "Haze",
  "Dust",
  "Fog",
  "Sand",
  "Ash",
  "Squall",
];

/** How far along its arc the sun/moon sits, based on local hour. */
function sunPosition(hour: number): number {
  // Map 6:00 -> 0 (rise), 18:00 -> 1 (set); clamp outside daylight.
  const p = (hour - 6) / 12;
  return Math.min(1, Math.max(0, p));
}

export function buildScene(data: WeatherData): SceneConfig {
  const band = timeBandFromHour(data.localHour);
  const night = isNightBand(band);
  const condition = data.current.condition;
  const cloudFraction = data.current.clouds / 100;

  let palette = TIME_PALETTES[band];
  let particle: SceneConfig["particle"] = null;
  let intensity = 0.5;
  let showCelestial = false;
  let showClouds = false;
  let cloudDensity = 0;
  let showFog = false;
  let showLightning = false;

  switch (condition) {
    case "Clear":
      showCelestial = true;
      cloudDensity = 0;
      intensity = night ? 0.9 : 0.7; // stars / rays strength
      break;

    case "Clouds":
      showCelestial = cloudFraction < 0.6;
      showClouds = true;
      cloudDensity = Math.max(0.4, cloudFraction);
      // desaturate the time palette slightly
      palette = { ...palette, mid: palette.mid, accent: palette.accent };
      intensity = cloudFraction;
      break;

    case "Rain":
    case "Drizzle":
      particle = "rain";
      showClouds = true;
      cloudDensity = 0.85;
      showFog = true;
      palette = night ? RAIN_PALETTE_NIGHT : RAIN_PALETTE_DAY;
      intensity = condition === "Drizzle" ? 0.45 : 0.85;
      break;

    case "Thunderstorm":
      particle = "rain";
      showClouds = true;
      cloudDensity = 1;
      showLightning = true;
      showFog = true;
      palette = STORM_PALETTE;
      intensity = 1;
      break;

    case "Snow":
      particle = "snow";
      showClouds = true;
      cloudDensity = 0.7;
      palette = night ? SNOW_PALETTE_NIGHT : SNOW_PALETTE_DAY;
      intensity = 0.8;
      break;

    default:
      if (FOG_CONDITIONS.includes(condition)) {
        showFog = true;
        cloudDensity = 0.3;
        palette = night ? FOG_PALETTE_NIGHT : FOG_PALETTE_DAY;
        intensity = 0.7;
      } else {
        showCelestial = true;
      }
  }

  return {
    condition,
    timeBand: band,
    isNight: night,
    palette,
    particle,
    intensity,
    showCelestial,
    showClouds,
    cloudDensity,
    showFog,
    showLightning,
    sunPosition: sunPosition(data.localHour),
  };
}

/** Fallback scene shown before any search (calm twilight). */
export const IDLE_SCENE: SceneConfig = {
  condition: "Clear",
  timeBand: "dusk",
  isNight: true,
  palette: TIME_PALETTES.dusk,
  particle: null,
  intensity: 0.6,
  showCelestial: true,
  showClouds: false,
  cloudDensity: 0,
  showFog: false,
  showLightning: false,
  sunPosition: 0.95,
};
