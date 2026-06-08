import { ChatMistralAI } from "@langchain/mistralai";
import {
  SystemMessage,
  HumanMessage,
  AIMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import { z } from "zod";
import type {
  WeatherData,
  VibeResult,
  RecommendationsResult,
  ChatMessage,
} from "@/lib/types";

export function getModel(temperature = 0.6): ChatMistralAI {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Mistral API key is not configured. Add MISTRAL_API_KEY to .env.local.",
    );
  }
  return new ChatMistralAI({
    model: "mistral-small-latest",
    apiKey,
    temperature,
  });
}

export function weatherContext(weather: WeatherData): string {
  const unit = weather.units === "imperial" ? "°F" : "°C";
  const speedUnit = weather.units === "imperial" ? "mph" : "m/s";
  const { location, current } = weather;
  const place = [location.name, location.state, location.country]
    .filter(Boolean)
    .join(", ");
  const today = weather.daily[0];
  const forecastNote = today
    ? `Today's forecast: high ${Math.round(today.tempMax)}${unit}, low ${Math.round(
        today.tempMin,
      )}${unit}, ${today.condition.toLowerCase()}.`
    : "";

  return [
    `Location: ${place}.`,
    `Local time: ${weather.localTimeLabel} (hour ${weather.localHour}).`,
    `Condition: ${current.condition} — ${current.description}.`,
    `Temperature: ${Math.round(current.temp)}${unit} (feels like ${Math.round(
      current.feelsLike,
    )}${unit}).`,
    `Humidity: ${current.humidity}%.`,
    `Wind: ${Math.round(current.windSpeed)} ${speedUnit}.`,
    forecastNote,
  ]
    .filter(Boolean)
    .join(" ");
}

const vibeSchema = z.object({
  moodLine: z
    .string()
    .describe("One evocative sentence about how the weather feels."),
  energy: z.string().describe("The energy of the moment in 2-4 words."),
  colorMood: z
    .string()
    .describe("A short phrase plus a hex color suggestion, e.g. 'soft amber calm #f0c987'."),
  playlistVibe: z
    .string()
    .describe("A music mood or genre (NOT real song names)."),
});

const recommendationsSchema = z.object({
  outfit: z.string().describe("One practical sentence about what to wear."),
  activities: z
    .array(z.string())
    .describe("Exactly 3 short activity suggestions suited to the conditions and local time."),
  travel: z.string().describe("One short commute or travel tip."),
});

export async function generateVibe(weather: WeatherData): Promise<VibeResult> {
  const model = getModel(0.8).withStructuredOutput(vibeSchema);
  const messages: BaseMessage[] = [
    new SystemMessage(
      "You are Aura, an atmospheric guide who turns weather into feeling. You speak in vivid, sensory, emotionally resonant language.",
    ),
    new HumanMessage(
      `Here are the live conditions:\n${weatherContext(weather)}\n\n` +
        "Capture the vibe of this moment. moodLine should be one evocative sentence about how the weather feels. energy should be 2-4 words. colorMood should be a short phrase with a hex color suggestion. playlistVibe should be a music mood or genre, never real song names.",
    ),
  ];
  const result = await model.invoke(messages);
  return result as VibeResult;
}

export async function generateRecommendations(
  weather: WeatherData,
): Promise<RecommendationsResult> {
  const model = getModel(0.4).withStructuredOutput(recommendationsSchema);
  const messages: BaseMessage[] = [
    new SystemMessage(
      "You are Aura, an atmospheric guide who turns weather into feeling. When giving recommendations you stay practical, warm, and grounded in the live conditions.",
    ),
    new HumanMessage(
      `Here are the live conditions:\n${weatherContext(weather)}\n\n` +
        "Give recommendations. outfit should be one practical sentence. activities should be exactly 3 short suggestions appropriate to the conditions and local time. travel should be one short commute or travel tip.",
    ),
  ];
  const result = await model.invoke(messages);
  return result as RecommendationsResult;
}

export function buildChatMessages(
  weather: WeatherData,
  history: ChatMessage[],
): BaseMessage[] {
  const messages: BaseMessage[] = [
    new SystemMessage(
      "You are Aura, a warm, concise atmospheric guide. Answer the user's weather questions using ONLY the live data provided below. " +
        "If a question asks for something that isn't in this data, say so plainly rather than guessing. Keep replies short and friendly.\n\n" +
        `Live data:\n${weatherContext(weather)}`,
    ),
  ];
  for (const m of history) {
    if (m.role === "user") {
      messages.push(new HumanMessage(m.content));
    } else {
      messages.push(new AIMessage(m.content));
    }
  }
  return messages;
}
