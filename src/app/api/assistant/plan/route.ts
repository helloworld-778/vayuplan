import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  AirQualitySnapshotSchema,
  HouseholdProfileSchema,
} from "@/types/air-quality";
import { optimizeExposureWindows } from "@/lib/calculators/exposure-windows";
import { analyzeCommuteImpact } from "@/lib/calculators/commute-impact";
import { analyzeIndoorAir } from "@/lib/calculators/indoor-air";
import { generatePersonalizedPlan } from "@/lib/ai/gemini-assistant";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { ComputedAnalytics } from "@/lib/ai/types";

const PlanRequestSchema = z.object({
  snapshot: AirQualitySnapshotSchema,
  profile: HouseholdProfileSchema,
});

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(`plan_${clientIp}`, 12, 60000);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Plan generation rate limit reached. Please wait a minute.",
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

  const parsed = PlanRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid request payload. Ensure snapshot and profile meet schema requirements.",
        code: "VALIDATION_FAILED",
      },
      { status: 400 }
    );
  }

  const { snapshot, profile } = parsed.data;

  try {
    // 1. Run ALL Stage 2 calculators server-side
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

    // 2. Generate personalized plan (Gemini with deterministic fallback)
    const plan = await generatePersonalizedPlan(snapshot, profile, analytics);

    return NextResponse.json({
      plan,
      analytics,
    });
  } catch {
    return NextResponse.json(
      {
        error: "Failed to generate air quality plan. Please try again.",
        code: "PLAN_GENERATION_FAILED",
      },
      { status: 500 }
    );
  }
}
