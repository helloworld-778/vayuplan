import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  AirQualitySnapshotSchema,
  HouseholdProfileSchema,
} from "@/types/air-quality";
import { optimizeExposureWindows } from "@/lib/calculators/exposure-windows";
import { analyzeCommuteImpact } from "@/lib/calculators/commute-impact";
import { analyzeIndoorAir } from "@/lib/calculators/indoor-air";
import { answerGroundedQuestion } from "@/lib/ai/gemini-assistant";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { sanitizeString } from "@/lib/security/sanitize";
import { ComputedAnalytics } from "@/lib/ai/types";

const ChatRequestSchema = z.object({
  question: z.string().min(1).max(400),
  snapshot: AirQualitySnapshotSchema,
  profile: HouseholdProfileSchema,
});

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(`chat_${clientIp}`, 12, 60000);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Assistant query limit reached. Please wait a minute.",
        code: "RATE_LIMITED",
      },
      {
        status: 429,
        headers: {
          "Retry-After": rateLimit.retryAfterSeconds.toString(),
        },
      }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Malformed JSON payload.", code: "INVALID_JSON" },
      { status: 400 }
    );
  }

  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid request payload. 'question' (max 400 chars), 'snapshot', and 'profile' are required.",
        code: "VALIDATION_FAILED",
      },
      { status: 400 }
    );
  }

  const { question, snapshot, profile } = parsed.data;
  const sanitizedQuestion = sanitizeString(question, 400);

  try {
    // 1. Run Stage 2 calculations for grounding
    const exposureWindows = optimizeExposureWindows(
      snapshot.hourlyForecast,
      profile
    );
    const pm25Reading = snapshot.pollutants.pm25 ?? 0;
    const commuteImpact = analyzeCommuteImpact(
      profile,
      pm25Reading,
      snapshot.naqi
    );
    const indoorAir = analyzeIndoorAir(profile, pm25Reading, snapshot.naqi);

    const analytics: ComputedAnalytics = {
      exposureWindows,
      commuteImpact,
      indoorAir,
    };

    // 2. Query Grounded AI Engine
    const result = await answerGroundedQuestion(
      sanitizedQuestion,
      snapshot,
      profile,
      analytics
    );

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      {
        error: "Assistant was unable to answer the question.",
        code: "CHAT_FAILED",
      },
      { status: 500 }
    );
  }
}
