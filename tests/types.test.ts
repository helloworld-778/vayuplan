import { describe, it, expect } from "vitest";
import {
  LocationQuerySchema,
  ResolvedLocationSchema,
  PollutantReadingsSchema,
  NaqiCategorySchema,
  HourlyAirPointSchema,
  AirQualitySnapshotSchema,
  PersonaTypeSchema,
  CommuteModeSchema,
  MaskTypeSchema,
  HouseholdProfileSchema,
  ActionRecommendationSchema,
  AssistantPlanResponseSchema,
} from "@/types/air-quality";

// ─── Fixtures ────────────────────────────────────────────────────────

const validLocation = {
  name: "Delhi",
  state: "Delhi",
  country: "India",
  lat: 28.6139,
  lon: 77.209,
};

const validPollutants = {
  pm25: 85.3,
  pm10: 140.0,
  no2: 42.1,
  o3: null,
  co: 1.2,
  so2: null,
};

const validHourlyPoint = {
  timeIso: "2026-11-20T08:00:00+05:30",
  pm25: 72.0,
  pm10: 120.0,
  estimatedNaqi: 180,
  category: "Poor" as const,
};

const validAction = {
  title: "Use N95 mask outdoors",
  timeframe: "Morning commute",
  action: "Wear an N95 mask when stepping outside before 10 AM.",
  whyMechanism: "N95 filters ≥95% of PM2.5 particles.",
  directImpact: "Reduces inhaled PM2.5 by ~95%.",
  effortLevel: "low_cost" as const,
};

const validSnapshot = {
  location: validLocation,
  naqi: 210,
  dominantPollutant: "pm25",
  category: "Poor" as const,
  pollutants: validPollutants,
  hourlyForecast: [validHourlyPoint],
  source: "CPCB",
  stationName: "ITO, Delhi",
  fetchedAt: "2026-11-20T07:30:00Z",
  isFallback: false,
};

const validHousehold = {
  persona: "commuter" as const,
  hasRespiratorySensitivity: false,
  commuteDistanceKm: 12,
  currentCommuteMode: "two_wheeler" as const,
  maskType: "none" as const,
  hasAirPurifier: false,
  windowsState: "open" as const,
  usesIncenseOrSolidFuel: true,
};

const validPlanResponse = {
  mode: "ai" as const,
  summary: "Air quality is Poor today in Delhi.",
  morningRoutine: [validAction],
  afternoonRoutine: [],
  eveningRoutine: [],
  indoorHacks: [],
  sustainableAlternatives: [],
  disclaimer: "This is not medical advice.",
};

// ─── Tests ───────────────────────────────────────────────────────────

describe("Domain Zod schemas", () => {
  // ── Accept valid payloads ──

  it("accepts a valid LocationQuery", () => {
    expect(LocationQuerySchema.parse({ name: "Mumbai" })).toBeTruthy();
  });

  it("accepts a valid ResolvedLocation", () => {
    expect(ResolvedLocationSchema.parse(validLocation)).toEqual(validLocation);
  });

  it("accepts a valid PollutantReadings with nulls", () => {
    expect(PollutantReadingsSchema.parse(validPollutants)).toEqual(
      validPollutants
    );
  });

  it("accepts all NaqiCategory values", () => {
    for (const cat of [
      "Good",
      "Satisfactory",
      "Moderate",
      "Poor",
      "Very Poor",
      "Severe",
    ]) {
      expect(NaqiCategorySchema.parse(cat)).toBe(cat);
    }
  });

  it("accepts a valid HourlyAirPoint", () => {
    expect(HourlyAirPointSchema.parse(validHourlyPoint)).toEqual(
      validHourlyPoint
    );
  });

  it("accepts a valid AirQualitySnapshot", () => {
    expect(AirQualitySnapshotSchema.parse(validSnapshot)).toEqual(
      validSnapshot
    );
  });

  it("accepts all PersonaType values", () => {
    for (const p of [
      "commuter",
      "family_with_kids",
      "senior_citizen",
      "student_athlete",
    ]) {
      expect(PersonaTypeSchema.parse(p)).toBe(p);
    }
  });

  it("accepts all CommuteMode values", () => {
    for (const m of [
      "petrol_car",
      "two_wheeler",
      "metro_transit",
      "carpool",
      "bicycle_walk",
      "work_from_home",
    ]) {
      expect(CommuteModeSchema.parse(m)).toBe(m);
    }
  });

  it("accepts all MaskType values", () => {
    for (const m of ["none", "cloth", "surgical", "n95"]) {
      expect(MaskTypeSchema.parse(m)).toBe(m);
    }
  });

  it("accepts a valid HouseholdProfile", () => {
    expect(HouseholdProfileSchema.parse(validHousehold)).toEqual(
      validHousehold
    );
  });

  it("accepts a valid ActionRecommendation", () => {
    expect(ActionRecommendationSchema.parse(validAction)).toEqual(validAction);
  });

  it("accepts a valid AssistantPlanResponse", () => {
    expect(AssistantPlanResponseSchema.parse(validPlanResponse)).toEqual(
      validPlanResponse
    );
  });

  // ── Reject malformed payloads ──

  it("rejects LocationQuery with empty name", () => {
    expect(() => LocationQuerySchema.parse({ name: "" })).toThrow();
  });

  it("rejects ResolvedLocation with lat out of range", () => {
    expect(() =>
      ResolvedLocationSchema.parse({ ...validLocation, lat: 999 })
    ).toThrow();
  });

  it("rejects PollutantReadings with string instead of number", () => {
    expect(() =>
      PollutantReadingsSchema.parse({ ...validPollutants, pm25: "high" })
    ).toThrow();
  });

  it("rejects invalid NaqiCategory", () => {
    expect(() => NaqiCategorySchema.parse("Terrible")).toThrow();
  });

  it("rejects HourlyAirPoint with negative estimatedNaqi", () => {
    expect(() =>
      HourlyAirPointSchema.parse({ ...validHourlyPoint, estimatedNaqi: -5 })
    ).toThrow();
  });

  it("rejects AirQualitySnapshot missing required fields", () => {
    expect(() =>
      AirQualitySnapshotSchema.parse({ location: validLocation })
    ).toThrow();
  });

  it("rejects invalid PersonaType", () => {
    expect(() => PersonaTypeSchema.parse("tourist")).toThrow();
  });

  it("rejects HouseholdProfile with invalid windowsState", () => {
    expect(() =>
      HouseholdProfileSchema.parse({
        ...validHousehold,
        windowsState: "broken",
      })
    ).toThrow();
  });

  it("rejects ActionRecommendation with invalid effortLevel", () => {
    expect(() =>
      ActionRecommendationSchema.parse({
        ...validAction,
        effortLevel: "expensive",
      })
    ).toThrow();
  });

  it("rejects AssistantPlanResponse with invalid mode", () => {
    expect(() =>
      AssistantPlanResponseSchema.parse({
        ...validPlanResponse,
        mode: "magic",
      })
    ).toThrow();
  });
});
