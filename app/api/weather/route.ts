import { NextRequest, NextResponse } from "next/server";
import { getWeather, OpenWeatherError } from "@/lib/openweather";
import type { GeoResult, Units } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const lat = Number(params.get("lat"));
  const lon = Number(params.get("lon"));
  const unitsParam = params.get("units");
  const units: Units = unitsParam === "imperial" ? "imperial" : "metric";

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json(
      { error: "Valid 'lat' and 'lon' query parameters are required." },
      { status: 400 },
    );
  }

  const name = params.get("name") ?? "";
  const country = params.get("country") ?? "";
  const state = params.get("state") ?? undefined;

  const location: GeoResult = {
    name,
    lat,
    lon,
    country,
    ...(state ? { state } : {}),
  };

  try {
    const data = await getWeather(lat, lon, units, location);
    return NextResponse.json(data);
  } catch (e) {
    if (e instanceof OpenWeatherError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    const message = e instanceof Error ? e.message : "Failed to load weather.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
