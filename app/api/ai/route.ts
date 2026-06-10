import { NextRequest, NextResponse } from "next/server";
import { generateVibe, generateRecommendations } from "@/lib/mistral";
import type { AiMode, WeatherData } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AiRequestBody {
  mode?: AiMode;
  weather?: WeatherData;
}

export async function POST(req: NextRequest) {
  let body: AiRequestBody;
  try {
    body = (await req.json()) as AiRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { mode, weather } = body;
  if (!weather || (mode !== "vibe" && mode !== "recommendations")) {
    return NextResponse.json(
      { error: "Request must include a valid 'mode' and 'weather'." },
      { status: 400 },
    );
  }

  try {
    const result =
      mode === "vibe"
        ? await generateVibe(weather)
        : await generateRecommendations(weather);
    return NextResponse.json(result);
  } catch (e) {
    const message =
      e instanceof Error
        ? e.message
        : "Aura could not read the atmosphere right now.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
