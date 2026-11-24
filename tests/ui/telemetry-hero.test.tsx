import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TelemetryHero } from "@/components/TelemetryHero";
import { AirQualitySnapshot } from "@/types/air-quality";

const mockSnapshot: AirQualitySnapshot = {
  location: {
    name: "New Delhi",
    state: "Delhi",
    country: "India",
    lat: 28.6139,
    lon: 77.209,
  },
  naqi: 340,
  dominantPollutant: "pm25",
  category: "Very Poor",
  pollutants: {
    pm25: 185.4,
    pm10: 290.1,
    no2: 68.2,
    o3: 42.0,
    co: 1500, // µg/m³
    so2: null, // Null to test "—" handling
  },
  hourlyForecast: [],
  source: "CPCB Ground Telemetry",
  stationName: "Mandir Marg, Delhi - CPCB",
  fetchedAt: "2026-11-20T10:30:00.000Z",
  isFallback: false,
};

describe("TelemetryHero Component", () => {
  it("renders live CPCB NAQI score, category text and icon", () => {
    render(<TelemetryHero snapshot={mockSnapshot} isLoading={false} onRefresh={vi.fn()} />);

    // NAQI score
    expect(screen.getByText("340")).toBeInTheDocument();

    // Category text
    expect(screen.getByText("Very Poor")).toBeInTheDocument();

    // Range label
    expect(screen.getByText("(301 – 400)")).toBeInTheDocument();

    // Dominant pollutant tag
    expect(screen.getByText("pm25")).toBeInTheDocument();

    // Location
    expect(screen.getByText(/New Delhi, Delhi/)).toBeInTheDocument();
  });

  it("renders live station attribution and IST timestamp", () => {
    render(<TelemetryHero snapshot={mockSnapshot} isLoading={false} onRefresh={vi.fn()} />);

    expect(screen.getByText("Mandir Marg, Delhi - CPCB")).toBeInTheDocument();
    expect(screen.getByText("Live CPCB Ground Station")).toBeInTheDocument();
    expect(screen.getByText(/IST/)).toBeInTheDocument();
  });

  it("renders CAMS Model Telemetry badge when isFallback is true", () => {
    const fallbackSnapshot: AirQualitySnapshot = {
      ...mockSnapshot,
      isFallback: true,
      stationName: "Open-Meteo CAMS Model (28.61°N, 77.21°E)",
    };

    render(<TelemetryHero snapshot={fallbackSnapshot} isLoading={false} onRefresh={vi.fn()} />);

    expect(screen.getByText("CAMS Model Telemetry")).toBeInTheDocument();
    expect(screen.getByText("Open-Meteo CAMS Model (28.61°N, 77.21°E)")).toBeInTheDocument();
  });

  it("handles null/missing pollutants with an em dash '—'", () => {
    render(<TelemetryHero snapshot={mockSnapshot} isLoading={false} onRefresh={vi.fn()} />);

    // Valid pollutant values
    expect(screen.getByText("185.4")).toBeInTheDocument();
    expect(screen.getByText("290.1")).toBeInTheDocument();

    // Null pollutant (so2) renders "—"
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it("calls onRefresh when refresh button is clicked", () => {
    const handleRefresh = vi.fn();
    render(<TelemetryHero snapshot={mockSnapshot} isLoading={false} onRefresh={handleRefresh} />);

    const refreshBtn = screen.getByRole("button", { name: /refresh live air quality data/i });
    fireEvent.click(refreshBtn);

    expect(handleRefresh).toHaveBeenCalledTimes(1);
  });

  it("renders loading placeholder when snapshot is null", () => {
    render(<TelemetryHero snapshot={null} isLoading={true} onRefresh={vi.fn()} />);

    expect(screen.getByLabelText("Air quality telemetry placeholder")).toBeInTheDocument();
  });
});
