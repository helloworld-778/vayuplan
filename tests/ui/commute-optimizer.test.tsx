import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CommuteOptimizer } from "@/components/CommuteOptimizer";
import { AirQualitySnapshot, HouseholdProfile, AssistantPlanResponse } from "@/types/air-quality";
import { ComputedAnalytics } from "@/lib/ai/types";

const createMockSnapshot = (naqi: number): AirQualitySnapshot => ({
  location: { name: "Bengaluru", state: "Karnataka", country: "India", lat: 12.97, lon: 77.59 },
  naqi,
  dominantPollutant: "pm25",
  category: naqi > 200 ? "Poor" : "Moderate",
  pollutants: { pm25: 75, pm10: 120, no2: 45, o3: 35, co: 900, so2: 15 },
  hourlyForecast: [],
  source: "CPCB",
  stationName: "BTM Layout, Bengaluru",
  fetchedAt: "2026-11-20T10:00:00Z",
  isFallback: false,
});

const mockProfile: HouseholdProfile = {
  persona: "commuter",
  hasRespiratorySensitivity: false,
  commuteDistanceKm: 10,
  currentCommuteMode: "two_wheeler",
  maskType: "cloth",
  hasAirPurifier: false,
  windowsState: "open",
  usesIncenseOrSolidFuel: false,
};

const mockPlan: AssistantPlanResponse = {
  mode: "ai",
  summary: "Commute optimization guidance.",
  morningRoutine: [],
  afternoonRoutine: [],
  eveningRoutine: [],
  indoorHacks: [],
  sustainableAlternatives: [
    {
      title: "Shared Metro Shift",
      timeframe: "Daily Commute",
      action: "Use purple line metro instead of two-wheeler.",
      whyMechanism: "In-train HEPA filtration reduces inhaled PM2.5 by 65%.",
      directImpact: "Saves 35 µg inhaled PM2.5 per day",
      effortLevel: "low_cost",
    },
  ],
  disclaimer: "Advisory only.",
};

const mockAnalytics: ComputedAnalytics = {
  exposureWindows: {} as any,
  indoorAir: {} as any,
  commuteImpact: {
    roundTripKm: 20,
    currentMode: "two_wheeler",
    outdoorPm25: 75,
    outdoorNaqi: 140,
    modes: [
      { mode: "petrol_car", label: "Solo Car", roundTripKm: 20, durationHours: 0.83, roundTripMinutes: 50, inhaledPm25Ug: 22.5, dailyCo2Grams: 3800, dailyPm25EmittedGrams: 0.9, deltaInhaledPm25Percent: -58.3, monthlyCo2SavedKg: -17.6, monthlyPm25SavedGrams: -13.2, healthAdvisory: "Comfortable but high carbon.", isViableAlternative: true },
      { mode: "two_wheeler", label: "Two-Wheeler", roundTripKm: 20, durationHours: 0.67, roundTripMinutes: 40, inhaledPm25Ug: 54.0, dailyCo2Grams: 900, dailyPm25EmittedGrams: 0.6, deltaInhaledPm25Percent: 0, monthlyCo2SavedKg: 0, monthlyPm25SavedGrams: 0, healthAdvisory: "Direct road exhaust.", isViableAlternative: false },
      { mode: "metro_transit", label: "Metro Rail", roundTripKm: 20, durationHours: 0.6, roundTripMinutes: 36, inhaledPm25Ug: 12.3, dailyCo2Grams: 280, dailyPm25EmittedGrams: 0.1, deltaInhaledPm25Percent: -77.2, monthlyCo2SavedKg: 13.6, monthlyPm25SavedGrams: 11.0, healthAdvisory: "Clean and fast.", isViableAlternative: true },
      { mode: "carpool", label: "Carpool", roundTripKm: 20, durationHours: 0.83, roundTripMinutes: 50, inhaledPm25Ug: 22.5, dailyCo2Grams: 1267, dailyPm25EmittedGrams: 0.3, deltaInhaledPm25Percent: -58.3, monthlyCo2SavedKg: -8.1, monthlyPm25SavedGrams: 6.6, healthAdvisory: "Moderate emissions.", isViableAlternative: true },
      { mode: "bicycle_walk", label: "Bicycle / Walk", roundTripKm: 20, durationHours: 1.33, roundTripMinutes: 80, inhaledPm25Ug: 180.0, dailyCo2Grams: 0, dailyPm25EmittedGrams: 0, deltaInhaledPm25Percent: 233.3, monthlyCo2SavedKg: 19.8, monthlyPm25SavedGrams: 13.2, healthAdvisory: "Zero emissions.", isViableAlternative: false },
      { mode: "work_from_home", label: "Remote / WFH", roundTripKm: 0, durationHours: 0, roundTripMinutes: 0, inhaledPm25Ug: 0, dailyCo2Grams: 0, dailyPm25EmittedGrams: 0, deltaInhaledPm25Percent: -100, monthlyCo2SavedKg: 19.8, monthlyPm25SavedGrams: 13.2, healthAdvisory: "Zero exposure.", isViableAlternative: true },
    ],
    recommendedAlternative: {
      mode: "metro_transit",
      label: "Metro Rail",
      roundTripKm: 20,
      durationHours: 0.6,
      roundTripMinutes: 36,
      inhaledPm25Ug: 12.3,
      dailyCo2Grams: 280,
      dailyPm25EmittedGrams: 0.1,
      deltaInhaledPm25Percent: -77.2,
      monthlyCo2SavedKg: 13.6,
      monthlyPm25SavedGrams: 11.0,
      healthAdvisory: "Switching to Metro Rail cuts your inhaled PM2.5 by 77%.",
      isViableAlternative: true,
    },
    maskUpgradeImpact: {
      currentMask: "cloth",
      upgradedMask: "n95",
      currentInhaledUg: 54.0,
      upgradedInhaledUg: 16.2,
      percentSaved: 70,
      savedInhaledUg: 37.8,
      explanation: "Upgrading from Cloth (~25%) to N95 (≥95%) prevents 37.8 µg of fine particulate deposition per trip.",
    },
  },
};

describe("CommuteOptimizer Component", () => {
  it("renders 6-mode transit comparison table with headers and data", () => {
    const snapshot = createMockSnapshot(140);
    render(
      <CommuteOptimizer
        snapshot={snapshot}
        profile={mockProfile}
        plan={mockPlan}
        analytics={mockAnalytics}
      />
    );

    // Verify all 6 modes are rendered
    expect(screen.getByText("Solo Car")).toBeInTheDocument();
    expect(screen.getByText("Two-Wheeler")).toBeInTheDocument();
    expect(screen.getByText("Metro Rail")).toBeInTheDocument();
    expect(screen.getByText("Carpool")).toBeInTheDocument();
    expect(screen.getByText("Bicycle / Walk")).toBeInTheDocument();
    expect(screen.getByText("Remote / WFH")).toBeInTheDocument();

    // Verify current indicator
    expect(screen.getByText("CURRENT")).toBeInTheDocument();

    // Verify recommended pick badge
    expect(screen.getByText("PICK")).toBeInTheDocument();
  });

  it("renders N95 respirator upgrade savings card", () => {
    const snapshot = createMockSnapshot(140);
    render(
      <CommuteOptimizer
        snapshot={snapshot}
        profile={mockProfile}
        plan={mockPlan}
        analytics={mockAnalytics}
      />
    );

    expect(screen.getByText(/N95 Respirator Upgrade Impact/i)).toBeInTheDocument();
    expect(screen.getByText("70%")).toBeInTheDocument();
    expect(screen.getByText("37.8 µg")).toBeInTheDocument();
    expect(screen.getByText(/Cloth → N95/i)).toBeInTheDocument();
  });

  it("displays critical active transit warning when outdoor NAQI > 200", () => {
    const severeSnapshot = createMockSnapshot(280);
    render(
      <CommuteOptimizer
        snapshot={severeSnapshot}
        profile={mockProfile}
        plan={mockPlan}
        analytics={mockAnalytics}
      />
    );

    expect(screen.getByText(/Critical Active Transit Safety Warning/i)).toBeInTheDocument();
    expect(screen.getByText(/Walking or cycling in NAQI > 200 dramatically multiplies/i)).toBeInTheDocument();
  });

  it("omits active transit warning when outdoor NAQI <= 200", () => {
    const moderateSnapshot = createMockSnapshot(140);
    render(
      <CommuteOptimizer
        snapshot={moderateSnapshot}
        profile={mockProfile}
        plan={mockPlan}
        analytics={mockAnalytics}
      />
    );

    expect(screen.queryByText(/Critical Active Transit Safety Warning/i)).not.toBeInTheDocument();
  });
});
