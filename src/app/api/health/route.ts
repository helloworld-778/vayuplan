import { NextResponse } from "next/server";
import {
  getGeminiModel,
  hasGeminiApiKey,
  hasWaqiApiToken,
} from "@/lib/security/env";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      hasGeminiKey: hasGeminiApiKey(),
      geminiModel: getGeminiModel(),
      hasWaqiToken: hasWaqiApiToken(),
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
