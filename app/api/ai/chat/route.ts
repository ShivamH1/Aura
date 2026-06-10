import { NextRequest, NextResponse } from "next/server";
import { getModel, buildChatMessages } from "@/lib/mistral";
import type { ChatMessage, WeatherData } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChatRequestBody {
  weather?: WeatherData;
  messages?: ChatMessage[];
}

export async function POST(req: NextRequest) {
  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { weather, messages } = body;
  if (!weather || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "Request must include 'weather' and a non-empty 'messages' array." },
      { status: 400 },
    );
  }

  let stream: Awaited<ReturnType<ReturnType<typeof getModel>["stream"]>>;
  try {
    const lcMessages = buildChatMessages(weather, messages);
    stream = await getModel(0.5).stream(lcMessages);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Aura could not start the conversation.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const content =
            typeof chunk.content === "string" ? chunk.content : "";
          if (content) {
            controller.enqueue(encoder.encode(content));
          }
        }
      } catch {
        controller.enqueue(
          encoder.encode("\n[Aura lost the thread for a moment.]"),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
