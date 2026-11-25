import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { WorkspaceTabs } from "@/components/WorkspaceTabs";
import { AirQualitySnapshot, HouseholdProfile, AssistantPlanResponse } from "@/types/air-quality";
import { ComputedAnalytics } from "@/lib/ai/types";

const mockSnapshot: AirQualitySnapshot = {
  location: { name: "Delhi", state: "Delhi", country: "India", lat: 28.6, lon: 77.2 },
  naqi: 240,
  dominantPollutant: "pm25",
  category: "Poor",
  pollutants: { pm25: 110, pm10: 180, no2: 50, o3: 30, co: 1200, so2: 20 },
  hourlyForecast: [],
  source: "CPCB",
  stationName: "Delhi Central",
  fetchedAt: "2026-11-20T10:00:00Z",
  isFallback: false,
};

const mockProfile: HouseholdProfile = {
  persona: "commuter",
  hasRespiratorySensitivity: false,
  commuteDistanceKm: 12,
  currentCommuteMode: "petrol_car",
  maskType: "cloth",
  hasAirPurifier: true,
  windowsState: "cracked",
  usesIncenseOrSolidFuel: false,
};

const mockPlan: AssistantPlanResponse = {
  mode: "deterministic_fallback",
  summary: "Comprehensive urban air protection plan.",
  morningRoutine: [],
  afternoonRoutine: [],
  eveningRoutine: [],
  indoorHacks: [],
  sustainableAlternatives: [],
  disclaimer: "Health advisory note.",
};

const mockAnalytics: ComputedAnalytics = {
  exposureWindows: {
    dayparts: {
      morning: { daypart: "morning", label: "Morning", hoursRange: "06:00 – 11:59", avgPm25: 120, maxNaqi: 240, dominantCategory: "Poor", safetyStatus: "avoid_outdoors", advisory: "Stay indoors", pointCount: 6 },
      afternoon: { daypart: "afternoon", label: "Afternoon", hoursRange: "12:00 – 16:59", avgPm25: 60, maxNaqi: 120, dominantCategory: "Moderate", safetyStatus: "caution", advisory: "Caution", pointCount: 5 },
      evening: { daypart: "evening", label: "Evening", hoursRange: "17:00 – 21:59", avgPm25: 140, maxNaqi: 260, dominantCategory: "Poor", safetyStatus: "avoid_outdoors", advisory: "Avoid", pointCount: 5 },
      night: { daypart: "night", label: "Night", hoursRange: "22:00 – 05:59", avgPm25: 180, maxNaqi: 310, dominantCategory: "Very Poor", safetyStatus: "avoid_outdoors", advisory: "Seal windows", pointCount: 8 },
    },
    bestOutdoorWindow: null,
    worstSmogWindow: null,
    pm25ReductionPercent: 45,
    bestVentilationWindow: null,
    ventilationReason: "Outdoor air too polluted",
    forecastCount: 24,
  },
  commuteImpact: {
    roundTripKm: 24,
    currentMode: "petrol_car",
    outdoorPm25: 110,
    outdoorNaqi: 240,
    modes: [
      { mode: "petrol_car", label: "Solo Car", roundTripKm: 24, durationHours: 1.0, roundTripMinutes: 60, inhaledPm25Ug: 39.6, dailyCo2Grams: 4560, dailyPm25EmittedGrams: 1.08, deltaInhaledPm25Percent: 0, monthlyCo2SavedKg: 0, monthlyPm25SavedGrams: 0, healthAdvisory: "High carbon.", isViableAlternative: false },
      { mode: "metro_transit", label: "Metro Rail", roundTripKm: 24, durationHours: 0.73, roundTripMinutes: 44, inhaledPm25Ug: 22.0, dailyCo2Grams: 336, dailyPm25EmittedGrams: 0.12, deltaInhaledPm25Percent: -44.4, monthlyCo2SavedKg: 92.9, monthlyPm25SavedGrams: 21.1, healthAdvisory: "Best clean transit.", isViableAlternative: true },
    ],
    recommendedAlternative: {
      mode: "metro_transit",
      label: "Metro Rail",
      roundTripKm: 24,
      durationHours: 0.73,
      roundTripMinutes: 44,
      inhaledPm25Ug: 22.0,
      dailyCo2Grams: 336,
      dailyPm25EmittedGrams: 0.12,
      deltaInhaledPm25Percent: -44.4,
      monthlyCo2SavedKg: 92.9,
      monthlyPm25SavedGrams: 21.1,
      healthAdvisory: "Cuts inhaled PM2.5 and emissions.",
      isViableAlternative: true,
    },
    maskUpgradeImpact: {
      currentMask: "cloth",
      upgradedMask: "n95",
      currentInhaledUg: 39.6,
      upgradedInhaledUg: 11.9,
      percentSaved: 70,
      savedInhaledUg: 27.7,
      explanation: "N95 cuts particulate exposure significantly.",
    },
  },
  indoorAir: {
    outdoorPm25: 110,
    outdoorNaqi: 240,
    estimatedIndoorPm25: 66,
    estimatedIndoorNaqi: 120,
    estimatedIndoorCategory: "Moderate",
    ventilationDirective: "SEAL_WINDOWS",
    ventilationAdvisory: "Seal windows to minimize outdoor infiltration.",
    interventions: [],
  },
};

describe("WorkspaceTabs Component", () => {
  it("renders tablist with 3 analytical WAI-ARIA tabs and active tabpanel", () => {
    render(
      <WorkspaceTabs
        snapshot={mockSnapshot}
        profile={mockProfile}
        plan={mockPlan}
        analytics={mockAnalytics}
        isPlanLoading={false}
      />
    );

    const tablist = screen.getByRole("tablist", { name: /vayuplan workspace modules/i });
    expect(tablist).toBeInTheDocument();

    // Ask VayuPlan is permanently docked in the AI Copilot rail rather than hidden as tab 4
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(3);

    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[1]).toHaveAttribute("aria-selected", "false");
    expect(tabs[2]).toHaveAttribute("aria-selected", "false");

    const panel = screen.getByRole("tabpanel");
    expect(panel).toHaveAttribute("id", "tabpanel-routine");
  });

  it("switches tab on click", async () => {
    render(
      <WorkspaceTabs
        snapshot={mockSnapshot}
        profile={mockProfile}
        plan={mockPlan}
        analytics={mockAnalytics}
        isPlanLoading={false}
      />
    );

    const commuteTab = screen.getByRole("tab", { name: /commute & emissions/i });
    fireEvent.click(commuteTab);

    expect(commuteTab).toHaveAttribute("aria-selected", "true");
    await waitFor(() => {
      expect(screen.getByRole("tabpanel")).toHaveAttribute("id", "tabpanel-commute");
    });
  });

  it("supports keyboard navigation across all 3 analytical tabs: ArrowRight, ArrowLeft, Home, End", () => {
    render(
      <WorkspaceTabs
        snapshot={mockSnapshot}
        profile={mockProfile}
        plan={mockPlan}
        analytics={mockAnalytics}
        isPlanLoading={false}
      />
    );

    const tabs = screen.getAllByRole("tab");

    fireEvent.keyDown(tabs[0], { key: "ArrowRight" });
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(tabs[1], { key: "ArrowRight" });
    expect(tabs[2]).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(tabs[2], { key: "ArrowLeft" });
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(tabs[1], { key: "End" });
    expect(tabs[2]).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(tabs[2], { key: "Home" });
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
  });
});
