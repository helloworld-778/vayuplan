import { z } from "zod";

// ─── Location ────────────────────────────────────────────────────────

export interface LocationQuery {
  name: string;
  state?: string;
  country?: string;
}

export const LocationQuerySchema = z.object({
  name: z.string().min(1),
  state: z.string().optional(),
  country: z.string().optional(),
});

export interface ResolvedLocation {
  name: string;
  state: string;
  country: string;
  lat: number;
  lon: number;
}

export const ResolvedLocationSchema = z.object({
  name: z.string().min(1),
  state: z.string().min(1),
  country: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
});

// ─── Pollutant Readings ──────────────────────────────────────────────

export interface PollutantReadings {
  pm25: number | null; // µg/m³
  pm10: number | null;
  no2: number | null;
  o3: number | null;
  co: number | null;
  so2: number | null;
}

export const PollutantReadingsSchema = z.object({
  pm25: z.number().nullable(),
  pm10: z.number().nullable(),
  no2: z.number().nullable(),
  o3: z.number().nullable(),
  co: z.number().nullable(),
  so2: z.number().nullable(),
});

// ─── NAQI Category ──────────────────────────────────────────────────

export type NaqiCategory =
  | "Good"
  | "Satisfactory"
  | "Moderate"
  | "Poor"
  | "Very Poor"
  | "Severe";

export const NaqiCategorySchema = z.enum([
  "Good",
  "Satisfactory",
  "Moderate",
  "Poor",
  "Very Poor",
  "Severe",
]);

// ─── Hourly Air Point ────────────────────────────────────────────────

export interface HourlyAirPoint {
  timeIso: string;
  pm25: number | null;
  pm10: number | null;
  estimatedNaqi: number;
  category: NaqiCategory;
}

export const HourlyAirPointSchema = z.object({
  timeIso: z.string().min(1),
  pm25: z.number().nullable(),
  pm10: z.number().nullable(),
  estimatedNaqi: z.number().nonnegative(),
  category: NaqiCategorySchema,
});

// ─── Air Quality Snapshot ────────────────────────────────────────────

export interface AirQualitySnapshot {
  location: ResolvedLocation;
  naqi: number;
  dominantPollutant: string;
  category: NaqiCategory;
  pollutants: PollutantReadings;
  hourlyForecast: HourlyAirPoint[];
  source: string;
  stationName: string;
  fetchedAt: string;
  isFallback: boolean;
}

export const AirQualitySnapshotSchema = z.object({
  location: ResolvedLocationSchema,
  naqi: z.number().nonnegative(),
  dominantPollutant: z.string().min(1),
  category: NaqiCategorySchema,
  pollutants: PollutantReadingsSchema,
  hourlyForecast: z.array(HourlyAirPointSchema),
  source: z.string().min(1),
  stationName: z.string().min(1),
  fetchedAt: z.string().min(1),
  isFallback: z.boolean(),
});

// ─── Persona & Household ────────────────────────────────────────────

export type PersonaType =
  | "commuter"
  | "family_with_kids"
  | "senior_citizen"
  | "student_athlete";

export const PersonaTypeSchema = z.enum([
  "commuter",
  "family_with_kids",
  "senior_citizen",
  "student_athlete",
]);

export type CommuteMode =
  | "petrol_car"
  | "two_wheeler"
  | "metro_transit"
  | "carpool"
  | "bicycle_walk"
  | "work_from_home";

export const CommuteModeSchema = z.enum([
  "petrol_car",
  "two_wheeler",
  "metro_transit",
  "carpool",
  "bicycle_walk",
  "work_from_home",
]);

export type MaskType = "none" | "cloth" | "surgical" | "n95";

export const MaskTypeSchema = z.enum(["none", "cloth", "surgical", "n95"]);

export type WindowsState = "open" | "cracked" | "sealed";

export const WindowsStateSchema = z.enum(["open", "cracked", "sealed"]);

export interface HouseholdProfile {
  persona: PersonaType;
  hasRespiratorySensitivity: boolean;
  commuteDistanceKm: number;
  currentCommuteMode: CommuteMode;
  maskType: MaskType;
  hasAirPurifier: boolean;
  windowsState: WindowsState;
  usesIncenseOrSolidFuel: boolean;
}

export const HouseholdProfileSchema = z.object({
  persona: PersonaTypeSchema,
  hasRespiratorySensitivity: z.boolean(),
  commuteDistanceKm: z.number().nonnegative(),
  currentCommuteMode: CommuteModeSchema,
  maskType: MaskTypeSchema,
  hasAirPurifier: z.boolean(),
  windowsState: WindowsStateSchema,
  usesIncenseOrSolidFuel: z.boolean(),
});

// ─── Action Recommendation ──────────────────────────────────────────

export type EffortLevel = "zero_cost" | "low_cost" | "moderate";

export const EffortLevelSchema = z.enum(["zero_cost", "low_cost", "moderate"]);

export interface ActionRecommendation {
  title: string;
  timeframe: string;
  action: string;
  whyMechanism: string;
  directImpact: string;
  effortLevel: EffortLevel;
}

export const ActionRecommendationSchema = z.object({
  title: z.string().min(1),
  timeframe: z.string().min(1),
  action: z.string().min(1),
  whyMechanism: z.string().min(1),
  directImpact: z.string().min(1),
  effortLevel: EffortLevelSchema,
});

// ─── Assistant Plan Response ─────────────────────────────────────────

export type AssistantMode = "ai" | "deterministic_fallback";

export const AssistantModeSchema = z.enum(["ai", "deterministic_fallback"]);

export type FallbackReason =
  | "missing_api_key"
  | "quota_exceeded"
  | "model_not_found"
  | "timeout"
  | "invalid_json"
  | "upstream_error";

export const FallbackReasonSchema = z.enum([
  "missing_api_key",
  "quota_exceeded",
  "model_not_found",
  "timeout",
  "invalid_json",
  "upstream_error",
]);

export interface AssistantPlanResponse {
  mode: AssistantMode;
  fallbackReason?: FallbackReason;
  modelUsed?: string;
  summary: string;
  morningRoutine: ActionRecommendation[];
  afternoonRoutine: ActionRecommendation[];
  eveningRoutine: ActionRecommendation[];
  indoorHacks: ActionRecommendation[];
  sustainableAlternatives: ActionRecommendation[];
  disclaimer: string;
}

export const AssistantPlanResponseSchema = z.object({
  mode: AssistantModeSchema,
  fallbackReason: FallbackReasonSchema.optional(),
  modelUsed: z.string().min(1).optional(),
  summary: z.string().min(1),
  morningRoutine: z.array(ActionRecommendationSchema),
  afternoonRoutine: z.array(ActionRecommendationSchema),
  eveningRoutine: z.array(ActionRecommendationSchema),
  indoorHacks: z.array(ActionRecommendationSchema),
  sustainableAlternatives: z.array(ActionRecommendationSchema),
  disclaimer: z.string().min(1),
});
