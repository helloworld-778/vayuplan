import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import {
  generatePersonalizedPlan,
  answerGroundedQuestion,
  clearPlanCache,
} from "@/lib/ai/gemini-assistant";
import { buildDeterministicPlan } from "@/lib/ai/fallback-plan";
import { POST as planRoute } from "@/app/api/assistant/plan/route";
import { POST as chatRoute } from "@/app/api/assistant/chat/route";
import { GET as healthRoute } from "@/app/api/health/route";
import {
  getGeminiCandidateModels,
  getGeminiFallbackModels,
  getGeminiModel,
} from "@/lib/security/env";
import {
  AirQualitySnapshot,
  HouseholdProfile,
} from "@/types/air-quality";
import { ComputedAnalytics } from "@/lib/ai/types";
import { optimizeExposureWindows } from "@/lib/calculators/exposure-windows";
import { analyzeCommuteImpact } from "@/lib/calculators/commute-impact";
import { analyzeIndoorAir } from "@/lib/calculators/indoor-air";
import { globalRateLimiter } from "@/lib/security/rate-limit";

const mockGenerateContent = vi.fn();
const mockGoogleGenAIOptions = vi.fn();

vi.mock("@google/genai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@google/genai")>();
  return {
    ...actual,
    GoogleGenAI: class {
      constructor(options?: unknown) {
        mockGoogleGenAIOptions(options);
      }
      models = {
        generateContent: mockGenerateContent,
      };
    },
  };
});

describe("Grounded AI Assistant & API Routes", () => {
  const sampleSnapshot: AirQualitySnapshot = {
    location: {
      name: "New Delhi",
      state: "Delhi",
      country: "India",
      lat: 28.6139,
      lon: 77.209,
    },
    naqi: 280,
    dominantPollutant: "pm25",
    category: "Poor",
    pollutants: {
      pm25: 110.0,
      pm10: 190.0,
      no2: 45.0,
      o3: null,
      co: 1.2,
      so2: null,
    },
    hourlyForecast: [
      {
        timeIso: "2026-11-20T08:00:00+05:30",
        pm25: 120,
        pm10: 200,
        estimatedNaqi: 300,
        category: "Poor",
      },
      {
        timeIso: "2026-11-20T14:00:00+05:30",
        pm25: 55,
        pm10: 90,
        estimatedNaqi: 95,
        category: "Satisfactory",
      },
    ],
    source: "CPCB/WAQI Ground Station",
    stationName: "ITO Delhi",
    fetchedAt: "2026-11-20T08:00:00Z",
    isFallback: false,
  };

  const sampleProfile: HouseholdProfile = {
    persona: "commuter",
    hasRespiratorySensitivity: false,
    commuteDistanceKm: 12,
    currentCommuteMode: "petrol_car",
    maskType: "surgical",
    hasAirPurifier: false,
    windowsState: "cracked",
    usesIncenseOrSolidFuel: false,
  };

  let analytics: ComputedAnalytics;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    mockGenerateContent.mockReset();
    mockGoogleGenAIOptions.mockReset();
    clearPlanCache();
    globalRateLimiter.clear();
    process.env.GEMINI_API_KEY = "test_gemini_secret_key_12345";
    delete process.env.GEMINI_MODEL;
    delete process.env.GEMINI_FALLBACK_MODELS;
    delete process.env.WAQI_API_TOKEN;

    const exposureWindows = optimizeExposureWindows(
      sampleSnapshot.hourlyForecast,
      sampleProfile
    );
    const commuteImpact = analyzeCommuteImpact(
      sampleProfile,
      sampleSnapshot.pollutants.pm25 || 0,
      sampleSnapshot.naqi
    );
    const indoorAir = analyzeIndoorAir(
      sampleProfile,
      sampleSnapshot.pollutants.pm25 || 0,
      sampleSnapshot.naqi
    );

    analytics = { exposureWindows, commuteImpact, indoorAir };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  // ─── Model Default & Candidate Cascade Diagnostics ──────────────────
  it("defaults GEMINI_MODEL to gemini-4-hydrogen and excludes gemini-2.5-flash-lite from cascade", () => {
    expect(getGeminiModel()).toBe("gemini-4-hydrogen");
    expect(getGeminiFallbackModels()).toEqual([
      "gemini-3.8-flash",
      "gemini-3.5-flash-lite",
      "gemini-3.6-flash",
      "gemini-3.1-flash-lite",
    ]);
    expect(getGeminiFallbackModels()).not.toContain("gemini-2.5-flash-lite");
    expect(getGeminiCandidateModels()).toEqual([
      "gemini-4-hydrogen",
      "gemini-3.8-flash",
      "gemini-3.5-flash-lite",
      "gemini-3.6-flash",
      "gemini-3.1-flash-lite",
    ]);
    expect(getGeminiCandidateModels()).not.toContain("gemini-2.5-flash-lite");

    process.env.GEMINI_MODEL = "   ";
    expect(getGeminiModel()).toBe("gemini-4-hydrogen");

    process.env.GEMINI_MODEL = "gemini-3.8-flash";
    process.env.GEMINI_FALLBACK_MODELS = "gemini-3.8-flash, gemini-4-hydrogen , ";
    expect(getGeminiFallbackModels()).toEqual([
      "gemini-3.8-flash",
      "gemini-4-hydrogen",
    ]);
    expect(getGeminiCandidateModels()).toEqual([
      "gemini-3.8-flash",
      "gemini-4-hydrogen",
    ]);
  });

  // ─── Multi-Model Cascade on 503/400/429/404/Timeout ─────────────────
  it("cascades to model #2 when model #1 throws 503 UNAVAILABLE or 400 INVALID_ARGUMENT and records modelUsed", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const planPayload = {
      mode: "ai",
      summary: "Resilient AI plan served by fallback model #2.",
      morningRoutine: [
        {
          title: "Mask Protection",
          timeframe: "08:00 AM",
          action: "Use N95 mask.",
          whyMechanism: "Filtration blocks fine particles.",
          directImpact: "Saves 40 µg inhaled PM2.5.",
          effortLevel: "low_cost",
        },
      ],
      afternoonRoutine: [],
      eveningRoutine: [],
      indoorHacks: [],
      sustainableAlternatives: [],
      disclaimer: "Environmental advisory only.",
    };

    // Plan cascade: model #1 fails with 503 UNAVAILABLE, model #2 succeeds
    mockGenerateContent
      .mockRejectedValueOnce(
        new Error(
          "503 UNAVAILABLE: This model is currently experiencing high demand at ?key=test_gemini_secret_key_12345"
        )
      )
      .mockResolvedValueOnce({
        text: JSON.stringify(planPayload),
      });

    const planResult = await generatePersonalizedPlan(
      { ...sampleSnapshot, location: { ...sampleSnapshot.location, name: "Vasant Kunj" } },
      sampleProfile,
      analytics
    );

    expect(planResult.mode).toBe("ai");
    expect(planResult.modelUsed).toBe("gemini-3.8-flash");
    expect(planResult.fallbackReason).toBeUndefined();
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    expect(mockGenerateContent.mock.calls[0][0].model).toBe("gemini-4-hydrogen");
    expect(mockGenerateContent.mock.calls[1][0].model).toBe("gemini-3.8-flash");

    const warnLogs = JSON.stringify(warnSpy.mock.calls);
    expect(warnLogs).toContain("[VayuPlan Gemini]");
    expect(warnLogs).not.toContain("test_gemini_secret_key_12345");

    // Chat cascade: model #1 fails with 400 INVALID_ARGUMENT, model #2 succeeds
    mockGenerateContent.mockReset();
    mockGenerateContent
      .mockRejectedValueOnce(
        new Error("400 INVALID_ARGUMENT: Developer instruction is not enabled")
      )
      .mockResolvedValueOnce({
        text: JSON.stringify({
          answer: "Use an N95 mask in Vasant Kunj where NAQI is 280.",
        }),
      });

    const chatResult = await answerGroundedQuestion(
      "Should I wear a mask?",
      sampleSnapshot,
      sampleProfile,
      analytics
    );

    expect(chatResult.mode).toBe("ai");
    expect(chatResult.modelUsed).toBe("gemini-3.8-flash");
    expect(chatResult.fallbackReason).toBeUndefined();
    expect(chatResult.answer).toContain("N95 mask");
    expect(mockGoogleGenAIOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        httpOptions: { apiVersion: "v1beta" },
      })
    );
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({
          thinkingConfig: { thinkingLevel: "LOW" },
        }),
      })
    );
  });

  it("returns deterministic_fallback with fallbackReason: 'upstream_error' when all models fail with 503", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    mockGenerateContent.mockRejectedValue(
      new Error("503 UNAVAILABLE: This model is currently experiencing high demand.")
    );

    const planResult = await generatePersonalizedPlan(
      { ...sampleSnapshot, location: { ...sampleSnapshot.location, name: "Pitampura" } },
      sampleProfile,
      analytics
    );

    expect(planResult.mode).toBe("deterministic_fallback");
    expect(planResult.fallbackReason).toBe("upstream_error");
    expect(planResult.modelUsed).toBeUndefined();
    expect(mockGenerateContent).toHaveBeenCalledTimes(5);

    mockGenerateContent.mockClear();
    const chatResult = await answerGroundedQuestion(
      "Is it safe to commute?",
      sampleSnapshot,
      sampleProfile,
      analytics
    );

    expect(chatResult.mode).toBe("deterministic_fallback");
    expect(chatResult.fallbackReason).toBe("upstream_error");
    expect(chatResult.modelUsed).toBeUndefined();
    expect(mockGenerateContent).toHaveBeenCalledTimes(5);
    expect(errorSpy).toHaveBeenCalledWith(
      "[VayuPlan Gemini]",
      expect.objectContaining({ fallbackReason: "upstream_error" })
    );
  });

  // ─── Gemini Valid JSON Path (mode: 'ai') ────────────────────────────
  it("returns mode: 'ai' with v1beta client, thinkingLevel LOW, responseSchema, and abortSignal", async () => {
    const validAiResponse = {
      mode: "ai",
      summary: "Grounded AI plan for Delhi commuter.",
      morningRoutine: [
        {
          title: "Wear N95 for Morning Drive",
          timeframe: "08:00 - 09:00 AM",
          action: "Equip sealed N95 respirator.",
          whyMechanism: "Filters 95% of fine particles.",
          directImpact: "Reduces inhaled dose by 78%.",
          effortLevel: "low_cost",
        },
      ],
      afternoonRoutine: [],
      eveningRoutine: [],
      indoorHacks: [],
      sustainableAlternatives: [],
      disclaimer: "Non-medical air quality guidelines.",
    };

    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify(validAiResponse),
    });

    const result = await generatePersonalizedPlan(
      { ...sampleSnapshot, location: { ...sampleSnapshot.location, name: "Dwarka" } },
      sampleProfile,
      analytics
    );

    expect(result.mode).toBe("ai");
    expect(result.modelUsed).toBe("gemini-4-hydrogen");
    expect(result.fallbackReason).toBeUndefined();
    expect(result.summary).toContain("Grounded AI plan");
    expect(result.morningRoutine[0].title).toBe("Wear N95 for Morning Drive");

    expect(mockGoogleGenAIOptions).toHaveBeenCalledWith({
      apiKey: "test_gemini_secret_key_12345",
      httpOptions: { apiVersion: "v1beta" },
    });

    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gemini-4-hydrogen",
        config: expect.objectContaining({
          responseMimeType: "application/json",
          responseSchema: expect.any(Object),
          thinkingConfig: { thinkingLevel: "LOW" },
          abortSignal: expect.any(AbortSignal),
        }),
      })
    );
  });

  // ─── Markdown-Fenced JSON, Key/Enum Normalization & Candidate Parts ──
  it("parses markdown-fenced JSON and normalizes whitespace, keys, and enum casing", async () => {
    const fencedPayload = [
      "```json",
      JSON.stringify({
        mode: "AI ",
        Summary: "  Cleanly normalized plan for Delhi.  ",
        morning_routine: [
          {
            Title: "  Sealed N95 Commute  ",
            Timeframe: "08:30 AM",
            Action: "Wear a fitted N95 mask.",
            why_mechanism: "Electrostatic filtration blocks PM2.5.",
            direct_impact: "Saves 42 µg per trip.",
            effort_level: "LOW COST",
          },
        ],
        afternoon_routine: null,
        evening_routine: [
          {
            title: "Close Windows at Dusk",
            timeframe: "17:30 PM",
            action: "Seal windows before evening inversion.",
            whyMechanism: "Prevents outdoor smog accumulation.",
            directImpact: "Cuts indoor PM2.5 infiltration.",
            effortLevel: "ZERO-COST",
          },
        ],
        indoor_hacks: [],
        sustainable_alternatives: [],
        disclaimer: "   ",
      }),
      "```",
    ].join("\n");

    // Simulate candidate-nested response without .text property
    mockGenerateContent.mockResolvedValueOnce({
      candidates: [
        {
          content: {
            parts: [{ text: fencedPayload }],
          },
        },
      ],
    });

    const result = await generatePersonalizedPlan(
      { ...sampleSnapshot, location: { ...sampleSnapshot.location, name: "Saket" } },
      sampleProfile,
      analytics
    );

    expect(result.mode).toBe("ai");
    expect(result.summary).toBe("Cleanly normalized plan for Delhi.");
    expect(result.morningRoutine[0].title).toBe("Sealed N95 Commute");
    expect(result.morningRoutine[0].effortLevel).toBe("low_cost");
    expect(result.afternoonRoutine).toEqual([]);
    expect(result.eveningRoutine[0].effortLevel).toBe("zero_cost");
    expect(result.disclaimer.length).toBeGreaterThan(10);
  });

  // ─── Fallback Diagnostics Tests ──────────────────────────────────────
  it("reports fallbackReason: 'missing_api_key' when GEMINI_API_KEY is unset", async () => {
    delete process.env.GEMINI_API_KEY;
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const planResult = await generatePersonalizedPlan(
      sampleSnapshot,
      sampleProfile,
      analytics
    );
    expect(planResult.mode).toBe("deterministic_fallback");
    expect(planResult.fallbackReason).toBe("missing_api_key");

    const chatResult = await answerGroundedQuestion(
      "Is it safe outside?",
      sampleSnapshot,
      sampleProfile,
      analytics
    );
    expect(chatResult.mode).toBe("deterministic_fallback");
    expect(chatResult.fallbackReason).toBe("missing_api_key");
    expect(errorSpy).toHaveBeenCalledWith(
      "[VayuPlan Gemini]",
      expect.objectContaining({ fallbackReason: "missing_api_key" })
    );
  });

  it("reports fallbackReason: 'quota_exceeded' and redacts API key from server logs", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGenerateContent.mockRejectedValue(
      new Error(
        "429 Resource has been exhausted (e.g. check quota) at https://generativelanguage.googleapis.com?key=test_gemini_secret_key_12345"
      )
    );

    const result = await generatePersonalizedPlan(
      { ...sampleSnapshot, location: { ...sampleSnapshot.location, name: "Rohini" } },
      sampleProfile,
      analytics
    );

    expect(result.mode).toBe("deterministic_fallback");
    expect(result.fallbackReason).toBe("quota_exceeded");
    expect(result.summary).toContain("Air quality in Rohini is currently");
    expect(result.morningRoutine.length).toBeGreaterThan(0);

    const serializedLogs = JSON.stringify(errorSpy.mock.calls);
    expect(serializedLogs).toContain("[VayuPlan Gemini]");
    expect(serializedLogs).not.toContain("test_gemini_secret_key_12345");
  });

  it("reports fallbackReason: 'model_not_found', 'timeout', and 'invalid_json'", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    // 1. model_not_found across all candidates
    mockGenerateContent.mockRejectedValue(
      new Error("404 models/bad-model is not found for API version v1beta")
    );
    const modelErrPlan = await generatePersonalizedPlan(
      { ...sampleSnapshot, location: { ...sampleSnapshot.location, name: "Noida" } },
      sampleProfile,
      analytics
    );
    expect(modelErrPlan.mode).toBe("deterministic_fallback");
    expect(modelErrPlan.fallbackReason).toBe("model_not_found");

    // 2. timeout across all candidates
    const abortErr = new Error("The operation was aborted");
    abortErr.name = "AbortError";
    mockGenerateContent.mockRejectedValue(abortErr);
    const timeoutPlan = await generatePersonalizedPlan(
      { ...sampleSnapshot, location: { ...sampleSnapshot.location, name: "Gurugram" } },
      sampleProfile,
      analytics
    );
    expect(timeoutPlan.mode).toBe("deterministic_fallback");
    expect(timeoutPlan.fallbackReason).toBe("timeout");

    // 3. invalid_json
    mockGenerateContent.mockReset();
    mockGenerateContent.mockResolvedValueOnce({
      text: "```json\n{ malformed json without closing brace",
    });
    const invalidJsonPlan = await generatePersonalizedPlan(
      { ...sampleSnapshot, location: { ...sampleSnapshot.location, name: "Faridabad" } },
      sampleProfile,
      analytics
    );
    expect(invalidJsonPlan.mode).toBe("deterministic_fallback");
    expect(invalidJsonPlan.fallbackReason).toBe("invalid_json");
  });

  // ─── Deterministic Plan Verification ────────────────────────────────
  it("buildDeterministicPlan generates rich, numbers-grounded action recommendations", () => {
    const fallback = buildDeterministicPlan(sampleSnapshot, sampleProfile, analytics);
    expect(fallback.mode).toBe("deterministic_fallback");
    expect(fallback.morningRoutine.length).toBeGreaterThan(0);
    expect(fallback.afternoonRoutine.length).toBeGreaterThan(0);
    expect(fallback.indoorHacks.length).toBeGreaterThan(0);
    expect(fallback.sustainableAlternatives.length).toBeGreaterThan(0);

    const morningAction = fallback.morningRoutine.find((r) => r.directImpact.includes("µg"));
    expect(morningAction).toBeDefined();
  });

  // ─── Grounded Chat Q&A (JSON Fenced, Plain Text & Safe Fallback) ────
  it("answerGroundedQuestion parses markdown-fenced JSON, plain text, and falls back safely", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    // 1. Markdown-fenced JSON response with key casing variation
    mockGenerateContent.mockResolvedValueOnce({
      text: '```json\n{\n  "Answer": "Keep windows sealed in New Delhi (NAQI 280) and wear an N95 mask.",\n  "cited_metrics": ["NAQI 280"]\n}\n```',
    });

    const jsonChatResult = await answerGroundedQuestion(
      "Should I open windows?",
      sampleSnapshot,
      sampleProfile,
      analytics
    );
    expect(jsonChatResult.mode).toBe("ai");
    expect(jsonChatResult.fallbackReason).toBeUndefined();
    expect(jsonChatResult.answer).toContain("Keep windows sealed in New Delhi");
    expect(jsonChatResult.citedMetrics[0]).toContain("Current NAQI: 280");

    // 2. Direct prose response
    mockGenerateContent.mockResolvedValueOnce({
      text: "In New Delhi, current NAQI is 280 (Poor). You should keep windows sealed and use an N95 mask.",
    });

    const textChatResult = await answerGroundedQuestion(
      "Can I go for a jog right now?",
      sampleSnapshot,
      sampleProfile,
      analytics
    );
    expect(textChatResult.mode).toBe("ai");
    expect(textChatResult.answer).toContain("New Delhi");

    // 3. Invalid JSON starting with '{' triggers invalid_json fallback
    mockGenerateContent.mockResolvedValueOnce({
      text: '{"answer": ',
    });

    const invalidChatResult = await answerGroundedQuestion(
      "What mask should I wear?",
      sampleSnapshot,
      sampleProfile,
      analytics
    );
    expect(invalidChatResult.mode).toBe("deterministic_fallback");
    expect(invalidChatResult.fallbackReason).toBe("invalid_json");

    // 4. Undefined SDK response triggers upstream_error fallback without throwing
    mockGenerateContent.mockResolvedValueOnce(undefined);

    const emptyChatResult = await answerGroundedQuestion(
      "How polluted is it?",
      sampleSnapshot,
      sampleProfile,
      analytics
    );
    expect(emptyChatResult.mode).toBe("deterministic_fallback");
    expect(emptyChatResult.fallbackReason).toBe("upstream_error");
  });

  // ─── Route API Tests: Health, Validation & Rate Limits ──────────────
  describe("API Route Integration", () => {
    it("GET /api/health returns safe non-secret diagnostics", async () => {
      process.env.GEMINI_API_KEY = "super_secret_do_not_expose";
      process.env.WAQI_API_TOKEN = "secret_waqi_token";

      const res = await healthRoute();
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json).toEqual({
        hasGeminiKey: true,
        geminiModel: "gemini-4-hydrogen",
        hasWaqiToken: true,
      });
      const serialized = JSON.stringify(json);
      expect(serialized).not.toContain("super_secret_do_not_expose");
      expect(serialized).not.toContain("secret_waqi_token");
    });

    it("returns 400 for malformed payload in plan route", async () => {
      const badReq = new NextRequest("http://localhost:3000/api/assistant/plan", {
        method: "POST",
        body: JSON.stringify({ snapshot: "invalid", profile: {} }),
      });

      const res = await planRoute(badReq);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code).toBe("VALIDATION_FAILED");
    });

    it("returns 429 when plan route rate limit is exceeded", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const validPayload = {
        snapshot: sampleSnapshot,
        profile: sampleProfile,
      };

      for (let i = 0; i < 12; i++) {
        const req = new NextRequest("http://localhost:3000/api/assistant/plan", {
          method: "POST",
          body: JSON.stringify(validPayload),
          headers: { "x-forwarded-for": "192.168.1.100" },
        });
        await planRoute(req);
      }

      const blockedReq = new NextRequest("http://localhost:3000/api/assistant/plan", {
        method: "POST",
        body: JSON.stringify(validPayload),
        headers: { "x-forwarded-for": "192.168.1.100" },
      });

      const blockedRes = await planRoute(blockedReq);
      expect(blockedRes.status).toBe(429);
      const json = await blockedRes.json();
      expect(json.code).toBe("RATE_LIMITED");
      expect(blockedRes.headers.get("Retry-After")).toBeDefined();
    });

    it("returns 400 for chat route with overly long question (>400 chars)", async () => {
      const longQuestion = "a".repeat(450);
      const req = new NextRequest("http://localhost:3000/api/assistant/chat", {
        method: "POST",
        body: JSON.stringify({
          question: longQuestion,
          snapshot: sampleSnapshot,
          profile: sampleProfile,
        }),
      });

      const res = await chatRoute(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code).toBe("VALIDATION_FAILED");
    });
  });
});
