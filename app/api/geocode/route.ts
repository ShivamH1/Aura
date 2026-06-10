import { NextRequest, NextResponse } from "next/server";
import { geocode, OpenWeatherError } from "@/lib/openweather";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json([]);
  }

  try {
    const results = await geocode(q);
    return NextResponse.json(results);
  } catch (e) {
    if (e instanceof OpenWeatherError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    const message = e instanceof Error ? e.message : "Geocoding failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
