/**
 * Grounded Gemini AI Engine for VayuPlan.
 *
 * Orchestrates Google Gemini using `@google/genai` with strict factual grounding
 * against verified Stage 2 environmental physics calculations and live CPCB/Open-Meteo telemetry.
 * Automatically falls back to deterministic mathematical planning upon quota exhaustion,
 * timeout, invalid output, or network failure, exposing safe non-secret diagnostics.
 */

import { GoogleGenAI, Type, type Schema } from "@google/genai";
import { z } from "zod";
import {
  AirQualitySnapshot,
  AssistantPlanResponse,
  AssistantPlanResponseSchema,
  FallbackReason,
  HouseholdProfile,
} from "@/types/air-quality";
import { ComputedAnalytics } from "@/lib/ai/types";
import { buildDeterministicPlan } from "@/lib/ai/fallback-plan";
import { getGeminiApiKey, getGeminiModel } from "@/lib/security/env";
import { MemoryCache } from "@/lib/security/cache";
import { sanitizeString } from "@/lib/security/sanitize";

const GEMINI_TIMEOUT_MS = 20000;

const DEFAULT_DISCLAIMER =
  "Disclaimer: VayuPlan provides AI-synthesized environmental risk-mitigation insights grounded in CPCB NAQI telemetry and exposure physics. It is not personal medical advice.";

// 20-minute cache for verified AI plan responses (never caches fallbacks)
const planCache = new MemoryCache<AssistantPlanResponse>(1200000, 100);

export function clearPlanCache(): void {
  planCache.clear();
}

function getPlanCacheKey(
  snapshot: AirQualitySnapshot,
  profile: HouseholdProfile,
  model: string
): string {
  const loc = snapshot.location.name.toLowerCase();
  const naqi = Math.round(snapshot.naqi / 5) * 5; // Group in bins of 5
  const profKey = `${profile.persona}_${profile.hasRespiratorySensitivity}_${profile.commuteDistanceKm}_${profile.currentCommuteMode}_${profile.maskType}_${profile.windowsState}_${profile.hasAirPurifier}_${profile.usesIncenseOrSolidFuel}`;
  return `plan_${model}_${loc}_${naqi}_${profKey}`;
}

const BASE_GROUNDING_RULES = `You are VayuPlan's Expert Urban Air Quality Advisor for India (Google Prompt Wars Challenge 6).

CRITICAL INSTRUCTIONS & GROUNDING RULES:
1. NEVER INVENT OR ALTER ANY METRICS. Use and cite ONLY the verified telemetry, exposure window hours, inhaled PM2.5 doses, and emissions numbers supplied in the user context.
2. Tailor every recommendation specifically to the user's Indian urban environment, their persona, respiratory health status, commute mode, and home setup.
3. For every recommendation, detail the concrete physical mechanism ("whyMechanism") and the exact quantified impact ("directImpact").
4. CRITICAL SAFETY GUARD: When ambient NAQI > 200 (Poor, Very Poor, or Severe), you MUST NEVER advise or encourage outdoor jogging, cycling, or active commuting. Emphasize indoor alternatives and N95 protection.`;

const PLAN_SYSTEM_PROMPT = `${BASE_GROUNDING_RULES}
5. Output ONLY valid JSON adhering strictly to the AssistantPlanResponse schema with mode set to "ai".`;

const CHAT_SYSTEM_PROMPT = `${BASE_GROUNDING_RULES}
5. Answer the user's question concisely (2-4 sentences), factually, and directly using the supplied verified numbers. Output ONLY valid JSON with "answer" and optional "citedMetrics".`;

const ACTION_ITEM_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Short actionable recommendation title" },
    timeframe: { type: Type.STRING, description: "Specific time range or moment of day" },
    action: { type: Type.STRING, description: "Concrete step the user should take" },
    whyMechanism: {
      type: Type.STRING,
      description: "Scientific physical or physiological mechanism explaining why this works",
    },
    directImpact: {
      type: Type.STRING,
      description: "Quantified exposure, dose, or emission impact using verified numbers",
    },
    effortLevel: {
      type: Type.STRING,
      enum: ["zero_cost", "low_cost", "moderate"],
      description: "Effort/cost tier: zero_cost, low_cost, or moderate",
    },
  },
  required: [
    "title",
    "timeframe",
    "action",
    "whyMechanism",
    "directImpact",
    "effortLevel",
  ],
};

const PLAN_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    mode: { type: Type.STRING, enum: ["ai"], description: "Always 'ai'" },
    summary: {
      type: Type.STRING,
      description: "2-3 sentence executive summary citing live NAQI & profile",
    },
    morningRoutine: { type: Type.ARRAY, items: ACTION_ITEM_SCHEMA },
    afternoonRoutine: { type: Type.ARRAY, items: ACTION_ITEM_SCHEMA },
    eveningRoutine: { type: Type.ARRAY, items: ACTION_ITEM_SCHEMA },
    indoorHacks: { type: Type.ARRAY, items: ACTION_ITEM_SCHEMA },
    sustainableAlternatives: { type: Type.ARRAY, items: ACTION_ITEM_SCHEMA },
    disclaimer: {
      type: Type.STRING,
      description: "Brief non-medical environmental guidance disclaimer",
    },
  },
  required: [
    "mode",
    "summary",
    "morningRoutine",
    "afternoonRoutine",
    "eveningRoutine",
    "indoorHacks",
    "sustainableAlternatives",
    "disclaimer",
  ],
};

const CHAT_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    answer: {
      type: Type.STRING,
      description: "Concise 2-4 sentence factual answer grounded in live telemetry and computed physics",
    },
    citedMetrics: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of verified live telemetry or physics figures referenced",
    },
  },
  required: ["answer"],
};

const ChatJsonSchema = z.object({
  answer: z.string().trim().min(1),
  citedMetrics: z.array(z.string().trim().min(1)).optional(),
});

class InvalidJsonError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidJsonError";
  }
}

/**
 * Redacts API keys and URL query credentials before logging or diagnostics.
 */
function sanitizeErrorMessage(err: unknown, apiKey?: string | null): string {
  let rawMessage = "Unknown error";

  if (err instanceof Error) {
    rawMessage = err.message || err.name || "Unknown error";
  } else if (typeof err === "string") {
    rawMessage = err;
  } else if (err !== null && err !== undefined) {
    try {
      rawMessage = JSON.stringify(err);
    } catch {
      rawMessage = String(err);
    }
  }

  let safe = rawMessage;
  if (apiKey && apiKey.trim().length > 0) {
    safe = safe.split(apiKey.trim()).join("[REDACTED]");
  }
  safe = safe
    .replace(/([?&]key=)[^&\s"']+/gi, "$1[REDACTED]")
    .replace(/AIza[0-9A-Za-z_-]{15,}/g, "[REDACTED_API_KEY]");

  return sanitizeString(safe, 500) || "Unknown error";
}

function classifyGeminiError(err: unknown, sanitizedMessage: string): FallbackReason {
  if (err instanceof InvalidJsonError || err instanceof SyntaxError) {
    return "invalid_json";
  }

  const errObj =
    err && typeof err === "object"
      ? (err as { name?: unknown; status?: unknown; code?: unknown })
      : null;

  if (
    errObj?.name === "AbortError" ||
    /\b(abort(?:ed)?|timed?\s*out|timeout|ETIMEDOUT)\b/i.test(sanitizedMessage)
  ) {
    return "timeout";
  }

  if (
    errObj?.status === 429 ||
    errObj?.code === 429 ||
    /\b429\b|quota|rate[-_\s]?limit|resource[_\s]+(?:has[_\s]+been[_\s]+)?exhausted|too many requests/i.test(
      sanitizedMessage
    )
  ) {
    return "quota_exceeded";
  }

  if (
    errObj?.status === 404 ||
    errObj?.code === 404 ||
    /\b404\b|model.*not found|not found for api version|models\/.+ is not found|unsupported model/i.test(
      sanitizedMessage
    )
  ) {
    return "model_not_found";
  }

  return "upstream_error";
}

/**
 * Extracts text safely from `@google/genai` GenerateContentResponse,
 * falling back cleanly across candidate parts without throwing on empty/missing shapes.
 */
function extractResponseText(response: unknown): string {
  if (!response || typeof response !== "object") {
    return "";
  }

  const resObj = response as {
    text?: unknown;
    output_text?: unknown;
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: unknown;
          thought?: unknown;
        }>;
      };
    }>;
  };

  try {
    if (typeof resObj.text === "string" && resObj.text.trim().length > 0) {
      return resObj.text.trim();
    }
  } catch {
    // Continue to candidate-nested fallback inspection
  }

  if (Array.isArray(resObj.candidates)) {
    for (const candidate of resObj.candidates) {
      const parts = candidate?.content?.parts;
      if (!Array.isArray(parts)) continue;
      const joined = parts
        .filter(
          (part) =>
            part &&
            typeof part.text === "string" &&
            part.thought !== true
        )
        .map((part) => part.text as string)
        .join("")
        .trim();
      if (joined.length > 0) {
        return joined;
      }
    }
  }

  if (typeof resObj.output_text === "string" && resObj.output_text.trim().length > 0) {
    return resObj.output_text.trim();
  }

  return "";
}

/**
 * Strips leading/trailing markdown code fences (e.g. ```json ... ```).
 */
export function stripCodeFences(rawText: string): string {
  const trimmed = rawText.trim();
  const fenced = trimmed.match(/^```(?:json|JSON)?\s*\r?\n?([\s\S]*?)\r?\n?```$/);
  if (fenced) {
    return fenced[1].trim();
  }
  return trimmed
    .replace(/^```(?:json|JSON)?\s*\r?\n?/i, "")
    .replace(/\r?\n?```\s*$/, "")
    .trim();
}

function parseJsonPayload(rawText: string): unknown {
  const cleaned = stripCodeFences(rawText);

  try {
    return JSON.parse(cleaned);
  } catch {
    const innerFence = rawText.match(/```(?:json|JSON)?\s*\r?\n?([\s\S]*?)\r?\n?```/);
    if (innerFence) {
      try {
        return JSON.parse(innerFence[1].trim());
      } catch {
        // Fall through to brace extraction
      }
    }

    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
      } catch {
        // Fall through to error
      }
    }

    throw new InvalidJsonError("Unable to parse valid JSON object from Gemini response.");
  }
}

function normalizeLookupKey(key: string): string {
  return key.toLowerCase().replace(/[_\s-]+/g, "");
}

function remapObjectKeys(
  raw: unknown,
  keyMap: Record<string, string>
): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const canonical = keyMap[normalizeLookupKey(k)] || k.trim();
    if (!(canonical in out) || out[canonical] === undefined || out[canonical] === null) {
      out[canonical] = v;
    }
  }
  return out;
}

function normalizeEffortLevel(val: unknown): unknown {
  if (typeof val !== "string") return val;
  const normalized = val.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (/^(zero|free|none|0|no)(_cost|_effort)?$/.test(normalized)) {
    return "zero_cost";
  }
  if (/^(low|minimal|minor|cheap)(_cost|_effort)?$/.test(normalized)) {
    return "low_cost";
  }
  if (/^(moderate|medium|mid)(_cost|_investment|_effort)?$/.test(normalized)) {
    return "moderate";
  }
  return normalized;
}

const ACTION_KEY_MAP: Record<string, string> = {
  title: "title",
  timeframe: "timeframe",
  action: "action",
  whymechanism: "whyMechanism",
  mechanism: "whyMechanism",
  why: "whyMechanism",
  directimpact: "directImpact",
  impact: "directImpact",
  effortlevel: "effortLevel",
  effort: "effortLevel",
};

function normalizeActionArray(raw: unknown): unknown {
  if (raw === null || raw === undefined) return [];
  if (!Array.isArray(raw)) return raw;

  return raw.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return item;
    }
    const mapped = remapObjectKeys(item, ACTION_KEY_MAP);
    return {
      title: typeof mapped.title === "string" ? mapped.title.trim() : mapped.title,
      timeframe:
        typeof mapped.timeframe === "string"
          ? mapped.timeframe.trim() || "Today"
          : mapped.timeframe,
      action: typeof mapped.action === "string" ? mapped.action.trim() : mapped.action,
      whyMechanism:
        typeof mapped.whyMechanism === "string"
          ? mapped.whyMechanism.trim()
          : mapped.whyMechanism,
      directImpact:
        typeof mapped.directImpact === "string"
          ? mapped.directImpact.trim()
          : mapped.directImpact,
      effortLevel: normalizeEffortLevel(mapped.effortLevel),
    };
  });
}

const PLAN_KEY_MAP: Record<string, string> = {
  mode: "mode",
  summary: "summary",
  morningroutine: "morningRoutine",
  afternoonroutine: "afternoonRoutine",
  eveningroutine: "eveningRoutine",
  indoorhacks: "indoorHacks",
  sustainablealternatives: "sustainableAlternatives",
  disclaimer: "disclaimer",
};

function normalizePlanPayload(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new InvalidJsonError("Plan payload must be a JSON object.");
  }

  const mapped = remapObjectKeys(raw, PLAN_KEY_MAP);
  const summary =
    typeof mapped.summary === "string" ? mapped.summary.trim() : mapped.summary;
  const disclaimer =
    typeof mapped.disclaimer === "string" && mapped.disclaimer.trim().length > 0
      ? mapped.disclaimer.trim()
      : DEFAULT_DISCLAIMER;

  return {
    mode: "ai",
    summary,
    morningRoutine: normalizeActionArray(mapped.morningRoutine),
    afternoonRoutine: normalizeActionArray(mapped.afternoonRoutine),
    eveningRoutine: normalizeActionArray(mapped.eveningRoutine),
    indoorHacks: normalizeActionArray(mapped.indoorHacks),
    sustainableAlternatives: normalizeActionArray(mapped.sustainableAlternatives),
    disclaimer,
  };
}

const CHAT_KEY_MAP: Record<string, string> = {
  answer: "answer",
  response: "answer",
  reply: "answer",
  summary: "answer",
  text: "answer",
  citedmetrics: "citedMetrics",
};

function normalizeChatPayload(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new InvalidJsonError("Chat payload must be a JSON object.");
  }

  const mapped = remapObjectKeys(raw, CHAT_KEY_MAP);
  return {
    answer: typeof mapped.answer === "string" ? mapped.answer.trim() : mapped.answer,
    citedMetrics: Array.isArray(mapped.citedMetrics)
      ? mapped.citedMetrics
          .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
          .map((item) => item.trim())
      : undefined,
  };
}

/**
 * Generates an AI-synthesized, grounded daily air quality action plan.
 * Returns deterministic fallback if Gemini is unconfigured, rate-limited, times out, or fails validation.
 */
export async function generatePersonalizedPlan(
  snapshot: AirQualitySnapshot,
  profile: HouseholdProfile,
  analytics: ComputedAnalytics
): Promise<AssistantPlanResponse> {
  const model = getGeminiModel();
  const cacheKey = getPlanCacheKey(snapshot, profile, model);
  const cached = planCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    console.error("[VayuPlan Gemini]", {
      context: "plan",
      model,
      fallbackReason: "missing_api_key",
      error: "GEMINI_API_KEY is unset or empty.",
    });
    return buildDeterministicPlan(snapshot, profile, analytics, "missing_api_key");
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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model,
      contents: userPrompt,
      config: {
        systemInstruction: PLAN_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: PLAN_RESPONSE_SCHEMA,
        abortSignal: controller.signal,
      },
    });

    const rawText = extractResponseText(response);
    if (!rawText) {
      throw new Error("Empty response text received from Gemini model.");
    }

    const parsedJson = parseJsonPayload(rawText);
    const normalized = normalizePlanPayload(parsedJson);
    const validation = AssistantPlanResponseSchema.safeParse(normalized);

    if (validation.success) {
      planCache.set(cacheKey, validation.data);
      return validation.data;
    }

    const schemaErrMsg = sanitizeErrorMessage(validation.error.message, apiKey);
    console.error("[VayuPlan Gemini]", {
      context: "plan",
      model,
      fallbackReason: "invalid_json",
      error: `Schema validation failed: ${schemaErrMsg}`,
    });
    return buildDeterministicPlan(snapshot, profile, analytics, "invalid_json");
  } catch (err) {
    const sanitizedMsg = sanitizeErrorMessage(err, apiKey);
    const fallbackReason = classifyGeminiError(err, sanitizedMsg);
    console.error("[VayuPlan Gemini]", {
      context: "plan",
      model,
      fallbackReason,
      error: sanitizedMsg,
    });
    return buildDeterministicPlan(snapshot, profile, analytics, fallbackReason);
  } finally {
    clearTimeout(timeoutId);
  }
}

export interface GroundedQuestionResult {
  answer: string;
  mode: "ai" | "deterministic_fallback";
  fallbackReason?: FallbackReason;
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
  const model = getGeminiModel();

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

  const buildFallbackChat = (fallbackReason: FallbackReason): GroundedQuestionResult => ({
    answer: `Based on live measurements in ${snapshot.location.name}, the ambient NAQI is ${snapshot.naqi} (${snapshot.category}, dominant pollutant: ${snapshot.dominantPollutant.toUpperCase()}). Your estimated indoor PM2.5 is ${analytics.indoorAir.estimatedIndoorPm25} µg/m³ (${analytics.indoorAir.estimatedIndoorCategory}; directive: ${analytics.indoorAir.ventilationDirective}). Upgrading to an N95 mask saves ${analytics.commuteImpact.maskUpgradeImpact.savedInhaledUg} µg of PM2.5 per commute round-trip.`,
    mode: "deterministic_fallback",
    fallbackReason,
    citedMetrics,
  });

  if (!apiKey) {
    console.error("[VayuPlan Gemini]", {
      context: "chat",
      model,
      fallbackReason: "missing_api_key",
      error: "GEMINI_API_KEY is unset or empty.",
    });
    return buildFallbackChat("missing_api_key");
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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: CHAT_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: CHAT_RESPONSE_SCHEMA,
        abortSignal: controller.signal,
      },
    });

    const rawText = extractResponseText(response);
    if (!rawText) {
      throw new Error("Empty answer received from Gemini model.");
    }

    const cleaned = stripCodeFences(rawText);

    // Handle structured JSON responses cleanly (with fence/key normalization),
    // while still supporting direct plain-text prose responses gracefully.
    if (cleaned.startsWith("{") || cleaned.startsWith("[")) {
      const parsedJson = parseJsonPayload(rawText);
      const normalized = normalizeChatPayload(parsedJson);
      const validation = ChatJsonSchema.safeParse(normalized);

      if (!validation.success) {
        throw new InvalidJsonError(
          `Chat JSON validation failed: ${validation.error.message}`
        );
      }

      return {
        answer: validation.data.answer,
        mode: "ai",
        citedMetrics,
      };
    }

    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      try {
        const unwrapped = JSON.parse(cleaned);
        if (typeof unwrapped === "string" && unwrapped.trim().length > 0) {
          return {
            answer: unwrapped.trim(),
            mode: "ai",
            citedMetrics,
          };
        }
      } catch {
        // Treat as plain text below if unwrapping quotes fails
      }
    }

    if (cleaned.length > 0) {
      return {
        answer: cleaned,
        mode: "ai",
        citedMetrics,
      };
    }

    throw new Error("Empty answer text after normalization.");
  } catch (err) {
    const sanitizedMsg = sanitizeErrorMessage(err, apiKey);
    const fallbackReason = classifyGeminiError(err, sanitizedMsg);
    console.error("[VayuPlan Gemini]", {
      context: "chat",
      model,
      fallbackReason,
      error: sanitizedMsg,
    });
    return buildFallbackChat(fallbackReason);
  } finally {
    clearTimeout(timeoutId);
  }
}
