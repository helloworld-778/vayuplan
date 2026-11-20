import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import {
  generatePersonalizedPlan,
  answerGroundedQuestion,
} from "@/lib/ai/gemini-assistant";
import { buildDeterministicPlan } from "@/lib/ai/fallback-plan";
import { POST as planRoute } from "@/app/api/assistant/plan/route";
import { POST as chatRoute } from "@/app/api/assistant/chat/route";
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

vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: class {
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

  beforeEach(() => {
    mockGenerateContent.mockReset();
    globalRateLimiter.clear();
    process.env.GEMINI_API_KEY = "test_gemini_key";

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
    vi.unstubAllGlobals();
  });

  // ─── Gemini Valid JSON Path (mode: 'ai') ────────────────────────────
  it("returns mode: 'ai' when Gemini returns valid JSON adhering to schema", async () => {
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
    expect(result.summary).toContain("Grounded AI plan");
    expect(result.morningRoutine[0].title).toBe("Wear N95 for Morning Drive");
  });

  // ─── Gemini 429 / Malformed Fallback Path ───────────────────────────
  it("falls back cleanly to deterministic plan on Gemini 429 quota exhaustion or invalid JSON", async () => {
    mockGenerateContent.mockRejectedValueOnce(
      new Error("429 Resource has been exhausted (e.g. check quota).")
    );

    const result = await generatePersonalizedPlan(
      { ...sampleSnapshot, location: { ...sampleSnapshot.location, name: "Rohini" } },
      sampleProfile,
      analytics
    );

    // Should return deterministic fallback
    expect(result.mode).toBe("deterministic_fallback");
    expect(result.summary).toContain("Air quality in Rohini is currently");
    expect(result.morningRoutine.length).toBeGreaterThan(0);
    expect(result.disclaimer).toContain("deterministic environmental risk-mitigation insights");
  });

  // ─── Deterministic Plan Verification ────────────────────────────────
  it("buildDeterministicPlan generates rich, numbers-grounded action recommendations", () => {
    const fallback = buildDeterministicPlan(sampleSnapshot, sampleProfile, analytics);
    expect(fallback.mode).toBe("deterministic_fallback");
    expect(fallback.morningRoutine.length).toBeGreaterThan(0);
    expect(fallback.afternoonRoutine.length).toBeGreaterThan(0);
    expect(fallback.indoorHacks.length).toBeGreaterThan(0);
    expect(fallback.sustainableAlternatives.length).toBeGreaterThan(0);

    // Verify concrete numbers are present
    const morningAction = fallback.morningRoutine.find((r) => r.directImpact.includes("µg"));
    expect(morningAction).toBeDefined();
  });

  // ─── Grounded Chat Q&A ──────────────────────────────────────────────
  it("answerGroundedQuestion cites real metrics and falls back gracefully", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: "In New Delhi, current NAQI is 280 (Poor). You should keep windows sealed and use an N95 mask.",
    });

    const result = await answerGroundedQuestion(
      "Can I go for a jog right now?",
      sampleSnapshot,
      sampleProfile,
      analytics
    );

    expect(result.mode).toBe("ai");
    expect(result.answer).toContain("New Delhi");
    expect(result.citedMetrics.length).toBeGreaterThan(0);
    expect(result.citedMetrics[0]).toContain("Current NAQI: 280");
  });

  // ─── Route API Tests: Validation & Rate Limits ──────────────────────
  describe("API Route Integration", () => {
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
      // Limit is 12 req/min
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

      // 13th request should be blocked
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
