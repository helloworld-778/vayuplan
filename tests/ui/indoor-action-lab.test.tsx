import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { IndoorActionLab } from "@/components/IndoorActionLab";
import { AirQualitySnapshot, HouseholdProfile, AssistantPlanResponse } from "@/types/air-quality";
import { ComputedAnalytics } from "@/lib/ai/types";

const mockSnapshot: AirQualitySnapshot = {
  location: { name: "Mumbai", state: "Maharashtra", country: "India", lat: 19.07, lon: 72.87 },
  naqi: 220,
  dominantPollutant: "pm25",
  category: "Poor",
  pollutants: { pm25: 95, pm10: 160, no2: 55, o3: 30, co: 1100, so2: 18 },
  hourlyForecast: [],
  source: "CPCB",
  stationName: "Bandra, Mumbai",
  fetchedAt: "2026-11-20T10:00:00Z",
  isFallback: false,
};

const mockProfile: HouseholdProfile = {
  persona: "family_with_kids",
  hasRespiratorySensitivity: true,
  commuteDistanceKm: 6,
  currentCommuteMode: "carpool",
  maskType: "surgical",
  hasAirPurifier: true,
  windowsState: "cracked",
  usesIncenseOrSolidFuel: true,
};

const mockPlan: AssistantPlanResponse = {
  mode: "ai",
  summary: "Indoor air quality intervention plan.",
  morningRoutine: [],
  afternoonRoutine: [],
  eveningRoutine: [],
  indoorHacks: [
    {
      title: "Eliminate Agarbatti Smoke",
      timeframe: "Daily",
      action: "Avoid burning incense or dhoop sticks indoors.",
      whyMechanism: "Incense combustion emits ultra-fine particulate mass (>45 µg/m³).",
      directImpact: "Reduces indoor PM2.5 by up to 45 µg/m³.",
      effortLevel: "zero_cost",
    },
  ],
  sustainableAlternatives: [],
  disclaimer: "Indoor health guidance.",
};

const createMockAnalytics = (directive: "SEAL_WINDOWS" | "OPEN_WINDOWS"): ComputedAnalytics => ({
  exposureWindows: {
    dayparts: {} as any,
    bestOutdoorWindow: null,
    worstSmogWindow: null,
    pm25ReductionPercent: 30,
    bestVentilationWindow: directive === "OPEN_WINDOWS" ? {
      startTimeIso: "2026-11-20T13:00:00Z",
      endTimeIso: "2026-11-20T15:00:00Z",
      startHour: 13,
      endHour: 15,
      avgPm25: 35,
      avgNaqi: 75,
      category: "Satisfactory",
    } : null,
    ventilationReason: directive === "OPEN_WINDOWS" ? "Clean solar window" : "Heavy ambient smog",
    forecastCount: 24,
  },
  commuteImpact: {} as any,
  indoorAir: {
    outdoorPm25: 95,
    outdoorNaqi: 220,
    estimatedIndoorPm25: directive === "SEAL_WINDOWS" ? 57 : 28,
    estimatedIndoorNaqi: directive === "SEAL_WINDOWS" ? 114 : 45,
    estimatedIndoorCategory: directive === "SEAL_WINDOWS" ? "Moderate" : "Good",
    ventilationDirective: directive,
    ventilationAdvisory:
      directive === "SEAL_WINDOWS"
        ? "Keep windows sealed to prevent infiltration of external smog."
        : "Air outside is clean. Open windows for 2 hours to aerate living spaces.",
    interventions: [
      {
        id: "add_purifier",
        title: "Operate HEPA Air Purifier",
        projectedIndoorPm25: 28.5,
        percentReduction: 50,
        pm25SavedUgM3: 28.5,
        explanation: "Active HEPA filtration captures fine particulate mass.",
      },
      {
        id: "stop_incense",
        title: "Eliminate Incense / Mosquito Coil",
        projectedIndoorPm25: 12.0,
        percentReduction: 79,
        pm25SavedUgM3: 45.0,
        explanation: "Extinguishing smoldering combustion eliminates 45 µg/m³ of internal emission.",
      },
    ],
  },
});

describe("IndoorActionLab Component", () => {
  it("renders outdoor vs. indoor PM2.5 comparison boxes", () => {
    const analytics = createMockAnalytics("SEAL_WINDOWS");
    render(
      <IndoorActionLab
        snapshot={mockSnapshot}
        profile={mockProfile}
        plan={mockPlan}
        analytics={analytics}
      />
    );

    // Ambient Outdoor
    expect(screen.getByText("Ambient Outdoor Atmosphere")).toBeInTheDocument();
    expect(screen.getByText("220")).toBeInTheDocument();
    expect(screen.getByText(/95 µg\/m³/)).toBeInTheDocument();

    // Estimated Indoor
    expect(screen.getByText("Estimated Indoor Microenvironment")).toBeInTheDocument();
    expect(screen.getByText("114")).toBeInTheDocument();
    expect(screen.getAllByText(/57 µg\/m³/).length).toBeGreaterThanOrEqual(1);
  });

  it("renders SEAL_WINDOWS directive banner when outdoor air is polluted", () => {
    const analytics = createMockAnalytics("SEAL_WINDOWS");
    render(
      <IndoorActionLab
        snapshot={mockSnapshot}
        profile={mockProfile}
        plan={mockPlan}
        analytics={analytics}
      />
    );

    expect(screen.getByText("Seal All External Windows & Balconies")).toBeInTheDocument();
    expect(screen.getByText(/Keep windows sealed to prevent infiltration/i)).toBeInTheDocument();
  });

  it("renders OPEN_WINDOWS directive banner when outdoor air is clean", () => {
    const cleanSnapshot: AirQualitySnapshot = {
      ...mockSnapshot,
      naqi: 45,
      category: "Good",
      pollutants: { ...mockSnapshot.pollutants, pm25: 25 },
    };
    const analytics = createMockAnalytics("OPEN_WINDOWS");

    render(
      <IndoorActionLab
        snapshot={cleanSnapshot}
        profile={mockProfile}
        plan={mockPlan}
        analytics={analytics}
      />
    );

    expect(screen.getByText("Open Windows for Natural Aeration")).toBeInTheDocument();
    expect(screen.getByText(/Air outside is clean. Open windows for 2 hours/i)).toBeInTheDocument();
    expect(screen.getByText("Optimal Aeration Window")).toBeInTheDocument();
  });

  it("renders what-if intervention simulator cards with quantified reductions", () => {
    const analytics = createMockAnalytics("SEAL_WINDOWS");
    render(
      <IndoorActionLab
        snapshot={mockSnapshot}
        profile={mockProfile}
        plan={mockPlan}
        analytics={analytics}
      />
    );

    expect(screen.getByText("Simulated Home Air Interventions")).toBeInTheDocument();
    expect(screen.getByText("Operate HEPA Air Purifier")).toBeInTheDocument();
    expect(screen.getByText("Eliminate Incense / Mosquito Coil")).toBeInTheDocument();
    expect(screen.getByText("45 µg/m³")).toBeInTheDocument();
  });
});
