/**
 * Grounded Gemini AI Engine for VayuPlan.
 *
 * Orchestrates Google Gemini using `@google/genai` with strict factual grounding
 * against verified Stage 2 environmental physics calculations and live CPCB/Open-Meteo telemetry.
 * Automatically falls back to deterministic mathematical planning upon quota exhaustion or network failure.
 */

import { GoogleGenAI } from "@google/genai";
import {
  AirQualitySnapshot,
  AssistantPlanResponse,
  AssistantPlanResponseSchema,
  HouseholdProfile,
} from "@/types/air-quality";
import { ComputedAnalytics } from "@/lib/ai/types";
import { buildDeterministicPlan } from "@/lib/ai/fallback-plan";
import { getGeminiApiKey, getGeminiModel } from "@/lib/security/env";
import { MemoryCache } from "@/lib/security/cache";
import { sanitizeString } from "@/lib/security/sanitize";

// 20-minute cache for identical plan requests
const planCache = new MemoryCache<AssistantPlanResponse>(1200000, 100);

function getPlanCacheKey(
  snapshot: AirQualitySnapshot,
  profile: HouseholdProfile
): string {
  const loc = snapshot.location.name.toLowerCase();
  const naqi = Math.round(snapshot.naqi / 5) * 5; // Group in bins of 5
  const profKey = `${profile.persona}_${profile.hasRespiratorySensitivity}_${profile.currentCommuteMode}_${profile.maskType}_${profile.windowsState}_${profile.hasAirPurifier}_${profile.usesIncenseOrSolidFuel}`;
  return `plan_${loc}_${naqi}_${profKey}`;
}

const SYSTEM_PROMPT = `You are VayuPlan's Expert Urban Air Quality Advisor for India (Google Prompt Wars Challenge 6).
Your job is to generate a deeply personalized, scientifically grounded, actionable daily air quality plan for an Indian resident.

CRITICAL INSTRUCTIONS & GROUNDING RULES:
1. NEVER INVENT OR ALTER ANY METRICS. Use and cite ONLY the verified telemetry, exposure window hours, inhaled PM2.5 doses, and emissions numbers supplied in the user context.
2. Tailor every recommendation specifically to the user's Indian urban environment, their persona, respiratory health status, commute mode, and home setup.
3. For every recommendation, detail the concrete physical mechanism ("whyMechanism") and the exact quantified impact ("directImpact").
4. CRITICAL SAFETY GUARD: When ambient NAQI > 200 (Poor, Very Poor, or Severe), you MUST NEVER advise or encourage outdoor jogging, cycling, or active commuting. Emphasize indoor alternatives and N95 protection.
5. Response MUST be valid JSON adhering exactly to the AssistantPlanResponse structure with mode set to "ai".`;

/**
 * Generates an AI-synthesized, grounded daily air quality action plan.
 * Returns deterministic fallback if Gemini is unconfigured, rate-limited, or fails validation.
 */
export async function generatePersonalizedPlan(
  snapshot: AirQualitySnapshot,
  profile: HouseholdProfile,
  analytics: ComputedAnalytics
): Promise<AssistantPlanResponse> {
  const cacheKey = getPlanCacheKey(snapshot, profile);
  const cached = planCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    console.info("[gemini-assistant] GEMINI_API_KEY unset. Using deterministic mathematical plan.");
    return buildDeterministicPlan(snapshot, profile, analytics);
  }

  const contextData = {
    location: snapshot.location,
    liveTelemetry: {
      naqi: snapshot.naqi,
      category: snapshot.category,
      dominantPollutant: snapshot.dominantPollutant,
      pollutants: snapshot.pollutants,
      source: snapshot.source,
    },
    userProfile: profile,
    computedPhysics: {
      exposureWindows: {
        dayparts: analytics.exposureWindows.dayparts,
        bestOutdoorWindow: analytics.exposureWindows.bestOutdoorWindow,
        worstSmogWindow: analytics.exposureWindows.worstSmogWindow,
        pm25ReductionPercent: analytics.exposureWindows.pm25ReductionPercent,
        bestVentilationWindow: analytics.exposureWindows.bestVentilationWindow,
        ventilationReason: analytics.exposureWindows.ventilationReason,
      },
      commuteImpact: {
        roundTripKm: analytics.commuteImpact.roundTripKm,
        currentMode: analytics.commuteImpact.currentMode,
        recommendedAlternative: analytics.commuteImpact.recommendedAlternative,
        maskUpgradeImpact: analytics.commuteImpact.maskUpgradeImpact,
      },
      indoorAir: {
        estimatedIndoorPm25: analytics.indoorAir.estimatedIndoorPm25,
        estimatedIndoorCategory: analytics.indoorAir.estimatedIndoorCategory,
        ventilationDirective: analytics.indoorAir.ventilationDirective,
        interventions: analytics.indoorAir.interventions,
      },
    },
  };

  const userPrompt = `Create a personalized daily air quality action plan based on this verified live telemetry and calculated environmental physics data:
\`\`\`json
${JSON.stringify(contextData, null, 2)}
\`\`\`

Generate a comprehensive JSON response adhering strictly to the AssistantPlanResponse schema with mode: "ai".`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = getGeminiModel();

    // Enforce 12-second abort timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await ai.models.generateContent({
      model,
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
      },
    });

    clearTimeout(timeoutId);

    const rawText = response.text || "";
    const parsedJson = JSON.parse(rawText);

    // Validate with Zod schema
    const validation = AssistantPlanResponseSchema.safeParse({
      ...parsedJson,
      mode: "ai",
    });

    if (validation.success) {
      planCache.set(cacheKey, validation.data);
      return validation.data;
    }

    console.warn(
      "[gemini-assistant] LLM response schema validation failed:",
      validation.error.message
    );
    return buildDeterministicPlan(snapshot, profile, analytics);
  } catch (err) {
    const errorMsg = (err as Error).message || "Unknown error";
    console.warn(`[gemini-assistant] Gemini API call failed (${errorMsg}). Falling back to deterministic plan.`);
    return buildDeterministicPlan(snapshot, profile, analytics);
  }
}

export interface GroundedQuestionResult {
  answer: string;
  mode: "ai" | "deterministic_fallback";
  citedMetrics: string[];
}

/**
 * Answers a specific user query grounded strictly in live telemetry and computed physics.
 */
export async function answerGroundedQuestion(
  question: string,
  snapshot: AirQualitySnapshot,
  profile: HouseholdProfile,
  analytics: ComputedAnalytics
): Promise<GroundedQuestionResult> {
  const sanitizedQuestion = sanitizeString(question, 400);
  if (!sanitizedQuestion) {
    return {
      answer: "Please ask a question regarding your air quality plan or environment.",
      mode: "deterministic_fallback",
      citedMetrics: [],
    };
  }

  const apiKey = getGeminiApiKey();
  const citedMetrics: string[] = [
    `Current NAQI: ${snapshot.naqi} (${snapshot.category})`,
    `PM2.5: ${snapshot.pollutants.pm25 ?? 0} µg/m³`,
    `Estimated Indoor PM2.5: ${analytics.indoorAir.estimatedIndoorPm25} µg/m³`,
  ];

  if (analytics.exposureWindows.bestOutdoorWindow) {
    citedMetrics.push(
      `Cleanest daytime window: ${analytics.exposureWindows.bestOutdoorWindow.startHour}:00–${analytics.exposureWindows.bestOutdoorWindow.endHour}:00 (${analytics.exposureWindows.bestOutdoorWindow.avgPm25} µg/m³)`
    );
  }

  if (analytics.commuteImpact.recommendedAlternative) {
    citedMetrics.push(
      `Recommended transit switch: ${analytics.commuteImpact.recommendedAlternative.label} (saves ${analytics.commuteImpact.recommendedAlternative.monthlyCo2SavedKg} kg CO2/mo)`
    );
  }

  if (!apiKey) {
    // Grounded deterministic fallback answer
    return {
      answer: `Based on current telemetry in ${snapshot.location.name}, the ambient NAQI is ${snapshot.naqi} (${snapshot.category}, dominant pollutant: ${snapshot.dominantPollutant.toUpperCase()}). Your estimated indoor PM2.5 is ${analytics.indoorAir.estimatedIndoorPm25} µg/m³ (${analytics.indoorAir.estimatedIndoorCategory}). For your ${profile.persona.replace(/_/g, " ")} profile, ${snapshot.naqi > 200 ? "outdoor physical exertion is strictly discouraged." : "outdoor activity is best conducted during the solar clearing window."} Upgrading to an N95 mask saves ${analytics.commuteImpact.maskUpgradeImpact.savedInhaledUg} µg of PM2.5 per commute round-trip.`,
      mode: "deterministic_fallback",
      citedMetrics,
    };
  }

  const prompt = `User question: "${sanitizedQuestion}"

Live context:
- City: ${snapshot.location.name}, ${snapshot.location.state}
- NAQI: ${snapshot.naqi} (${snapshot.category}), Dominant: ${snapshot.dominantPollutant}
- PM2.5: ${snapshot.pollutants.pm25} µg/m³
- Indoor PM2.5: ${analytics.indoorAir.estimatedIndoorPm25} µg/m³ (directive: ${analytics.indoorAir.ventilationDirective})
- Cleanest window: ${analytics.exposureWindows.bestOutdoorWindow ? `${analytics.exposureWindows.bestOutdoorWindow.startHour}:00–${analytics.exposureWindows.bestOutdoorWindow.endHour}:00 (${analytics.exposureWindows.bestOutdoorWindow.avgPm25} µg/m³)` : "None"}
- Commute: ${profile.currentCommuteMode} (${profile.commuteDistanceKm} km), Mask: ${profile.maskType}
- Recommended switch: ${analytics.commuteImpact.recommendedAlternative ? `${analytics.commuteImpact.recommendedAlternative.label} (saves ${analytics.commuteImpact.recommendedAlternative.monthlyCo2SavedKg} kg CO2/month)` : "None"}

Provide a concise (2-4 sentences), factual, and directly actionable answer citing these real numbers.`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = getGeminiModel();

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
      },
    });

    const answer = response.text?.trim() || "";
    if (answer) {
      return {
        answer,
        mode: "ai",
        citedMetrics,
      };
    }
    throw new Error("Empty answer received from model");
  } catch (err) {
    console.warn(`[gemini-assistant] Chat error (${(err as Error).message}). Using fallback answer.`);
    return {
      answer: `Based on live measurements in ${snapshot.location.name}, the ambient NAQI is ${snapshot.naqi} (${snapshot.category}). Your estimated indoor PM2.5 is ${analytics.indoorAir.estimatedIndoorPm25} µg/m³. Ventilation directive is ${analytics.indoorAir.ventilationDirective}. Upgrading to an N95 mask saves ${analytics.commuteImpact.maskUpgradeImpact.savedInhaledUg} µg of PM2.5 per commute round-trip.`,
      mode: "deterministic_fallback",
      citedMetrics,
    };
  }
}
