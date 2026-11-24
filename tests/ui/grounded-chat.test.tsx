import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GroundedChat } from "@/components/GroundedChat";
import { AirQualitySnapshot, HouseholdProfile } from "@/types/air-quality";

const mockSnapshot: AirQualitySnapshot = {
  location: { name: "Kolkata", state: "West Bengal", country: "India", lat: 22.57, lon: 88.36 },
  naqi: 260,
  dominantPollutant: "pm25",
  category: "Poor",
  pollutants: { pm25: 125, pm10: 210, no2: 60, o3: 35, co: 1300, so2: 25 },
  hourlyForecast: [],
  source: "CPCB",
  stationName: "Victoria Memorial, Kolkata",
  fetchedAt: "2026-11-20T10:00:00Z",
  isFallback: false,
};

const mockProfile: HouseholdProfile = {
  persona: "senior_citizen",
  hasRespiratorySensitivity: true,
  commuteDistanceKm: 0,
  currentCommuteMode: "work_from_home",
  maskType: "none",
  hasAirPurifier: false,
  windowsState: "open",
  usesIncenseOrSolidFuel: true,
};

describe("GroundedChat Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("updates character counter as user types within 400 character budget", () => {
    render(<GroundedChat snapshot={mockSnapshot} profile={mockProfile} />);

    const input = screen.getByPlaceholderText(/Ask anything about today's air quality/i);
    expect(screen.getByText("0 / 400")).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "Is it safe to walk?" } });
    expect(screen.getByText("19 / 400")).toBeInTheDocument();
  });

  it("renders 4 starter question chips tailored to city and profile", () => {
    render(<GroundedChat snapshot={mockSnapshot} profile={mockProfile} />);

    // Senior citizen in Kolkata starter questions
    expect(screen.getByText(/Is it safe for a senior citizen to go outside at 6 PM in Kolkata\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Should I open windows or keep them sealed today in Kolkata\?/i)).toBeInTheDocument();
  });

  it("submits question to /api/assistant/chat and displays grounded answer with metrics", async () => {
    const mockResponse = {
      answer: "Outdoor NAQI in Kolkata is 260 (Poor). Walking outdoors is not recommended for seniors.",
      mode: "ai",
      citedMetrics: ["NAQI 260", "PM2.5 125 µg/m³", "Category: Poor"],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    render(<GroundedChat snapshot={mockSnapshot} profile={mockProfile} />);

    const input = screen.getByPlaceholderText(/Ask anything about today's air quality/i);
    const askBtn = screen.getByRole("button", { name: /send question/i });

    fireEvent.change(input, { target: { value: "Can I go for an evening walk?" } });
    fireEvent.click(askBtn);

    // Verify user message appears
    expect(screen.getByText("Can I go for an evening walk?")).toBeInTheDocument();

    // Verify assistant answer appears
    await waitFor(() => {
      expect(screen.getByText(/Outdoor NAQI in Kolkata is 260/i)).toBeInTheDocument();
    });

    // Verify cited metrics chips
    expect(screen.getByText("NAQI 260")).toBeInTheDocument();
    expect(screen.getByText("PM2.5 125 µg/m³")).toBeInTheDocument();

    // Verify AI badge displays "Gemini AI"
    expect(screen.getByText("Gemini AI")).toBeInTheDocument();
  });

  it("displays Deterministic Physics Fallback badge when mode is fallback", async () => {
    const mockFallbackResponse = {
      answer: "Deterministic calculation: current inhaled exposure is elevated.",
      mode: "deterministic_fallback",
      citedMetrics: ["NAQI 260"],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockFallbackResponse,
    } as Response);

    render(<GroundedChat snapshot={mockSnapshot} profile={mockProfile} />);

    const starterBtn = screen.getByText(/Should I open windows or keep them sealed today in Kolkata\?/i);
    fireEvent.click(starterBtn);

    await waitFor(() => {
      expect(screen.getByText(/Deterministic calculation: current inhaled exposure/i)).toBeInTheDocument();
    });

    expect(screen.getByText("Deterministic Physics Fallback")).toBeInTheDocument();
  });
});
