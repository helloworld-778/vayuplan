import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import AssistantPage from "@/app/assistant/page";
import type {
  AirQualitySnapshot,
  AssistantPlanResponse,
  HourlyAirPoint,
} from "@/types/air-quality";
import type { ComputedAnalytics } from "@/lib/ai/types";

const mockSearchParams = new URLSearchParams("");

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
}));

function makeForecast(): HourlyAirPoint[] {
  return Array.from({ length: 24 }, (_, hour) => ({
    timeIso: `2026-11-25T${hour.toString().padStart(2, "0")}:00:00+05:30`,
    pm25: hour >= 13 && hour <= 15 ? 48 : 135,
    pm10: hour >= 13 && hour <= 15 ? 85 : 220,
    estimatedNaqi: hour >= 13 && hour <= 15 ? 80 : 310,
    category: hour >= 13 && hour <= 15 ? "Satisfactory" : "Very Poor",
  }));
}

const mockSnapshot: AirQualitySnapshot = {
  location: {
    name: "New Delhi",
    state: "Delhi",
    country: "India",
    lat: 28.6139,
    lon: 77.209,
  },
  naqi: 295,
  dominantPollutant: "pm25",
  category: "Poor",
  pollutants: {
    pm25: 118.4,
    pm10: 215.0,
    no2: 52.1,
    o3: 31.0,
    co: 1400,
    so2: 14.5,
  },
  hourlyForecast: makeForecast(),
  source: "WAQI / CPCB Station",
  stationName: "ITO CPCB Station, New Delhi",
  fetchedAt: "2026-11-25T08:00:00.000Z",
  isFallback: false,
};

const mockPlan: AssistantPlanResponse = {
  mode: "ai",
  modelUsed: "gemini-4-hydrogen",
  summary:
    "Morning PM2.5 in New Delhi sits in the Poor band. Delay outdoor errands until the 13:00 solar clearing window and take metro transit with sealed windows at home.",
  morningRoutine: [
    {
      title: "Indoor Mobility Only",
      timeframe: "07:00 – 10:00",
      action: "Keep morning walks indoors while boundary layer remains compressed.",
      whyMechanism: "Thermal inversion traps vehicular PM2.5 near street level.",
      directImpact: "Avoids ~42% of peak morning inhaled PM2.5.",
      effortLevel: "zero_cost",
    },
  ],
  afternoonRoutine: [],
  eveningRoutine: [],
  indoorHacks: [],
  sustainableAlternatives: [],
  disclaimer: "Informational environmental guidance only.",
};

const mockAnalytics: ComputedAnalytics = {
  exposureWindows: {
    dayparts: {
      morning: {
        daypart: "morning",
        label: "Morning",
        hoursRange: "06:00 – 11:59",
        avgPm25: 135,
        maxNaqi: 310,
        dominantCategory: "Very Poor",
        safetyStatus: "avoid_outdoors",
        advisory: "Minimize outdoor activity.",
        pointCount: 6,
      },
      afternoon: {
        daypart: "afternoon",
        label: "Afternoon",
        hoursRange: "12:00 – 16:59",
        avgPm25: 75,
        maxNaqi: 180,
        dominantCategory: "Moderate",
        safetyStatus: "caution",
        advisory: "Brief errands during solar dispersion.",
        pointCount: 5,
      },
      evening: {
        daypart: "evening",
        label: "Evening",
        hoursRange: "17:00 – 21:59",
        avgPm25: 135,
        maxNaqi: 310,
        dominantCategory: "Very Poor",
        safetyStatus: "avoid_outdoors",
        advisory: "Seal indoor rooms before dusk inversion.",
        pointCount: 5,
      },
      night: {
        daypart: "night",
        label: "Night",
        hoursRange: "22:00 – 05:59",
        avgPm25: 135,
        maxNaqi: 310,
        dominantCategory: "Very Poor",
        safetyStatus: "avoid_outdoors",
        advisory: "Run HEPA filtration continuously overnight.",
        pointCount: 8,
      },
    },
    bestOutdoorWindow: {
      startTimeIso: "2026-11-25T13:00:00+05:30",
      endTimeIso: "2026-11-25T15:00:00+05:30",
      startHour: 13,
      endHour: 15,
      avgPm25: 48,
      avgNaqi: 80,
      category: "Satisfactory",
    },
    worstSmogWindow: {
      startTimeIso: "2026-11-25T07:00:00+05:30",
      endTimeIso: "2026-11-25T09:00:00+05:30",
      startHour: 7,
      endHour: 9,
      avgPm25: 135,
      avgNaqi: 310,
      category: "Very Poor",
    },
    pm25ReductionPercent: 64,
    bestVentilationWindow: null,
    ventilationReason: "Outdoor particulates exceed safe natural ventilation limits.",
    forecastCount: 24,
  },
  commuteImpact: {
    roundTripKm: 28,
    currentMode: "petrol_car",
    outdoorPm25: 118.4,
    outdoorNaqi: 295,
    modes: [
      {
        mode: "petrol_car",
        label: "Solo Car",
        roundTripKm: 28,
        durationHours: 1.27,
        roundTripMinutes: 76,
        inhaledPm25Ug: 48.2,
        dailyCo2Grams: 4760,
        dailyPm25EmittedGrams: 1.26,
        deltaInhaledPm25Percent: 0,
        monthlyCo2SavedKg: 0,
        monthlyPm25SavedGrams: 0,
        healthAdvisory: "Closed AC cabin reduces infiltration, high tailpipe carbon.",
        isViableAlternative: false,
      },
      {
        mode: "metro_transit",
        label: "Metro Rail",
        roundTripKm: 28,
        durationHours: 0.88,
        roundTripMinutes: 53,
        inhaledPm25Ug: 29.1,
        dailyCo2Grams: 784,
        dailyPm25EmittedGrams: 0.14,
        deltaInhaledPm25Percent: -40,
        monthlyCo2SavedKg: 87.5,
        monthlyPm25SavedGrams: 24.6,
        healthAdvisory: "Substantially cuts commute CO2 and inhaled particulates.",
        isViableAlternative: true,
      },
    ],
    recommendedAlternative: {
      mode: "metro_transit",
      label: "Metro Rail",
      roundTripKm: 28,
      durationHours: 0.88,
      roundTripMinutes: 53,
      inhaledPm25Ug: 29.1,
      dailyCo2Grams: 784,
      dailyPm25EmittedGrams: 0.14,
      deltaInhaledPm25Percent: -40,
      monthlyCo2SavedKg: 87.5,
      monthlyPm25SavedGrams: 24.6,
      healthAdvisory: "Shift to Metro Rail to reduce both carbon and PM2.5 dose.",
      isViableAlternative: true,
    },
    maskUpgradeImpact: {
      currentMask: "none",
      upgradedMask: "n95",
      currentInhaledUg: 48.2,
      upgradedInhaledUg: 4.8,
      savedInhaledUg: 43.4,
      percentSaved: 90,
      explanation: "Adding an N95 cuts inhaled PM2.5 dose by 90%.",
    },
  },
  indoorAir: {
    outdoorPm25: 118.4,
    outdoorNaqi: 295,
    estimatedIndoorPm25: 51.4,
    estimatedIndoorNaqi: 86,
    estimatedIndoorCategory: "Satisfactory",
    ventilationDirective: "SEAL_WINDOWS",
    ventilationAdvisory: "Keep balconies sealed and maintain filtration.",
    interventions: [],
  },
};

describe("/assistant AI-First Split Cockpit", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    window.localStorage.clear();
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.startsWith("/api/air-quality")) {
        return new Response(JSON.stringify(mockSnapshot), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (url.startsWith("/api/assistant/plan")) {
        return new Response(
          JSON.stringify({ plan: mockPlan, analytics: mockAnalytics }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      return new Response(JSON.stringify({ results: [] }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders Today's Smart Brief and persistent Ask VayuPlan Copilot alongside analytical tabs", async () => {
    render(<AssistantPage />);

    // Brand overview link back to /
    const homeLink = screen.getByRole("link", { name: /back to vayuplan overview/i });
    expect(homeLink).toHaveAttribute("href", "/");

    // Always-visible Smart Brief + persistent Copilot rail load cleanly
    await waitFor(() => {
      expect(screen.getByText(/Morning PM2.5 in New Delhi sits in the Poor band/i)).toBeInTheDocument();
    });

    const briefSection = screen.getByRole("region", { name: /today's smart brief/i });
    expect(within(briefSection).getByText("Gemini AI")).toBeInTheDocument();
    expect(within(briefSection).getByText("Best Outdoor Window")).toBeInTheDocument();
    expect(within(briefSection).getByText("Best Transit Switch")).toBeInTheDocument();
    expect(within(briefSection).getByText("Indoor Ventilation Directive")).toBeInTheDocument();

    // Jump-pill inside Smart Brief switches analytical workspace tab cleanly
    fireEvent.click(within(briefSection).getByRole("button", { name: /Best Transit Switch/i }));
    await waitFor(() => {
      expect(screen.getByRole("tabpanel")).toHaveAttribute("id", "tabpanel-commute");
    });

    // Persistent AI Copilot rail is immediately mounted without clicking any tab
    const copilotRail = screen.getByRole("complementary", { name: /ask vayuplan ai copilot/i });
    expect(within(copilotRail).getByText("Ask VayuPlan")).toBeInTheDocument();
  });

  it("expands the Household Context Bar, locks commute slider to 0 km for WFH, applies updated profile without stale closure, and prefills Copilot", async () => {
    render(<AssistantPage />);

    await waitFor(() => {
      expect(screen.getByText(/Morning PM2.5 in New Delhi/i)).toBeInTheDocument();
    });

    // Open collapsible context drawer
    const editBtn = screen.getByRole("button", { name: /edit context/i });
    fireEvent.click(editBtn);

    const modeSelect = screen.getByLabelText(/primary commute mode/i);
    fireEvent.change(modeSelect, { target: { value: "work_from_home" } });

    const slider = screen.getByLabelText(/one-way commute/i) as HTMLInputElement;
    expect(slider).toBeDisabled();
    expect(slider.value).toBe("0");

    // Clicking Apply Changes must send the UPDATED work_from_home profile (0 km), not the stale initial profile
    const applyBtns = screen.getAllByRole("button", { name: /apply changes/i });
    fireEvent.click(applyBtns[0]);

    await waitFor(() => {
      const planCalls = fetchMock.mock.calls.filter(([url]) =>
        url.toString().startsWith("/api/assistant/plan")
      );
      expect(planCalls.length).toBeGreaterThanOrEqual(2);
      const lastBody = JSON.parse(String(planCalls[planCalls.length - 1][1]?.body));
      expect(lastBody.profile.currentCommuteMode).toBe("work_from_home");
      expect(lastBody.profile.commuteDistanceKm).toBe(0);
    });

    // Triggering Ask Copilot about this brief populates the Copilot composer
    fireEvent.click(screen.getByRole("button", { name: /ask copilot about this brief/i }));
    const copilotRail = screen.getByRole("complementary", { name: /ask vayuplan ai copilot/i });
    const composer = within(copilotRail).getByLabelText(/ask vayuplan a question/i) as HTMLInputElement;
    expect(composer.value).toContain("New Delhi");
  });

  it("opens and closes the accessible mobile Ask VayuPlan AI sheet drawer", async () => {
    render(<AssistantPage />);

    await waitFor(() => {
      expect(screen.getByText(/Morning PM2.5 in New Delhi/i)).toBeInTheDocument();
    });

    const mobileTrigger = screen.getByRole("button", { name: /ask vayuplan ai/i });
    fireEvent.click(mobileTrigger);

    const dialog = await screen.findByRole("dialog", { name: /ask vayuplan ai copilot/i });
    expect(dialog).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: /ask vayuplan ai copilot/i })).not.toBeInTheDocument();
    });
  });
});
