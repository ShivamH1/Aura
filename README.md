# Aura — Feel the Weather

An immersive, AI-powered weather experience built with **Next.js 15**, **GSAP**, **LangChain.js + Mistral AI**, and the **OpenWeather API**.

Search any city and the entire screen *becomes* that city's sky — rain streaks, drifting snow, a sun or moon arcing across a star-flecked night, rolling fog, thunderstorm flashes — all color-graded to the city's **real local time** (dawn / day / golden hour / dusk / night). On top of live data, Mistral gives the weather a soul: a **mood/vibe**, **smart recommendations**, and a **conversational assistant** grounded in the current conditions.

## Features

- **Living atmosphere** — full-viewport GSAP + Canvas scene that cross-fades when you switch cities, with `prefers-reduced-motion` fallbacks.
- **Live data** — current conditions, a next-24h hourly strip, and a 5-day forecast (OpenWeather free tier).
- **AI (Mistral via LangChain)**
  - **Today's vibe** — an evocative mood line, energy, color mood, and a music vibe.
  - **Smart picks** — outfit, activities, and travel suggestions tailored to conditions + local time.
  - **Ask Aura** — a streaming chat assistant that answers using the live weather data.
- **Premium glassmorphism UI**, metric/imperial toggle, city autocomplete.

## Setup

1. Install dependencies (already done if you cloned with `node_modules`):

   ```bash
   npm install
   ```

2. Add your API keys to **`.env.local`** (already created in the project root):

   ```env
   OPENWEATHER_API_KEY=your_openweather_key_here
   MISTRAL_API_KEY=your_mistral_key_here
   ```

   - Get a free OpenWeather key at <https://home.openweathermap.org/api_keys> (the free tier covers Geocoding + Current Weather + 5-day/3-hour Forecast). New keys can take a few minutes to activate.
   - The Mistral key is pre-filled from your existing environment.

3. Run the dev server:

   ```bash
   npm run dev
   ```

   Open <http://localhost:3000> and search a city (try **London**, **Tokyo**, **Reykjavik**, **Dubai**).

## Architecture

```
app/
  page.tsx              # client orchestrator: search + scene + panels
  layout.tsx            # Outfit font, base theme
  globals.css           # Tailwind v4 + scene CSS variables + glass utilities
  api/
    geocode/route.ts    # city autocomplete (OpenWeather geocoding)
    weather/route.ts    # current + forecast -> normalized WeatherData
    ai/route.ts         # POST mode=vibe|recommendations (structured output)
    ai/chat/route.ts    # POST streaming conversational assistant
components/
  AtmosphereScene.tsx   # composes the animated layers from a SceneConfig
  layers/               # SkyGradient, CelestialLayer, CloudLayer,
                        # PrecipitationCanvas, FogLayer, LightningLayer
  SearchBar, WeatherHud, HourlyStrip, FiveDayForecast
  ai/                   # VibePanel, RecommendationsPanel, ChatPanel
lib/
  openweather.ts        # fetch + normalize OpenWeather responses
  forecast.ts           # group 3h forecast into hourly + 5-day
  weatherScene.ts       # condition + local time -> SceneConfig (palettes, particles)
  mistral.ts            # ChatMistralAI factory, prompts, zod schemas
  format.ts, types.ts
hooks/
  useWeather.ts         # search -> fetch -> state, units refetch
  useReducedMotion.ts
```

API keys stay **server-side** — the browser only talks to same-origin `/api/*` routes.

## Notes

- AI model defaults to `mistral-small-latest` (fast/cheap); swap it in `lib/mistral.ts`.
- The hourly strip and 5-day view both derive from the single free 5-day/3-hour forecast endpoint — no paid plan needed.
- "Music vibe" is an AI-described mood, not a live music integration.

Built with Next.js, GSAP, LangChain, Mistral AI, and OpenWeather.
