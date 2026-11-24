import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HourlyExposureChart } from "@/components/HourlyExposureChart";
import { HourlyAirPoint } from "@/types/air-quality";
import { RollingWindow } from "@/lib/calculators/exposure-windows";

describe("HourlyExposureChart Component", () => {
  const createMockForecast = (count: number, pm25Fn: (i: number) => number): HourlyAirPoint[] => {
    return Array.from({ length: count }, (_, i) => {
      const hStr = (i % 24).toString().padStart(2, "0");
      const pm25 = pm25Fn(i);
      return {
        timeIso: `2026-11-20T${hStr}:00:00+05:30`,
        pm25,
        pm10: pm25 * 1.5,
        estimatedNaqi: pm25 > 120 ? 320 : 110,
        category: pm25 > 120 ? "Very Poor" : "Moderate",
      };
    });
  };

  const mockBestWindow: RollingWindow = {
    startTimeIso: "2026-11-20T13:00:00+05:30",
    endTimeIso: "2026-11-20T15:00:00+05:30",
    startHour: 13,
    endHour: 15,
    avgPm25: 45,
    avgNaqi: 90,
    category: "Satisfactory",
  };

  const mockWorstWindow: RollingWindow = {
    startTimeIso: "2026-11-20T07:00:00+05:30",
    endTimeIso: "2026-11-20T09:00:00+05:30",
    startHour: 7,
    endHour: 9,
    avgPm25: 220,
    avgNaqi: 360,
    category: "Very Poor",
  };

  it("renders accessible SVG element and sr-only summary for standard forecast", () => {
    const forecast = createMockForecast(24, (i) => 50 + Math.sin(i / 3) * 30);
    const { container } = render(
      <HourlyExposureChart
        hourlyForecast={forecast}
        bestWindow={mockBestWindow}
        worstWindow={mockWorstWindow}
      />
    );

    // Verify accessible role and label
    const svg = screen.getByRole("img", { name: /diurnal hourly air quality curve/i });
    expect(svg).toBeInTheDocument();

    // Verify sr-only summary text
    expect(screen.getByText(/24-hour diurnal air quality forecast/i)).toBeInTheDocument();
    expect(screen.getByText(/Best outdoor window is between 13:00 and 15:00/i)).toBeInTheDocument();
    expect(screen.getByText(/Worst smog window is between 7:00 and 9:00/i)).toBeInTheDocument();

    // Verify zero "NaN" strings in SVG attributes
    const svgHtml = container.querySelector("svg")?.outerHTML || "";
    expect(svgHtml).not.toContain("NaN");
  });

  it("handles empty forecast [] safely without throwing or rendering NaN", () => {
    const { container } = render(
      <HourlyExposureChart
        hourlyForecast={[]}
        bestWindow={null}
        worstWindow={null}
      />
    );

    expect(screen.getAllByText(/No hourly forecast data available/i).length).toBeGreaterThanOrEqual(1);
    expect(container.innerHTML).not.toContain("NaN");
  });

  it("handles single-point forecast safely with zero NaN coordinates", () => {
    const singlePoint: HourlyAirPoint[] = [
      {
        timeIso: "2026-11-20T08:00:00+05:30",
        pm25: 65,
        pm10: 100,
        estimatedNaqi: 120,
        category: "Moderate",
      },
    ];

    const { container } = render(
      <HourlyExposureChart
        hourlyForecast={singlePoint}
        bestWindow={null}
        worstWindow={null}
      />
    );

    const svg = screen.getByRole("img", { name: /diurnal hourly air quality curve/i });
    expect(svg).toBeInTheDocument();

    // Verify NO NaN anywhere in rendered SVG markup
    const svgHtml = container.querySelector("svg")?.outerHTML || "";
    expect(svgHtml).not.toContain("NaN");
    expect(svgHtml).not.toContain("Infinity");
  });

  it("handles flat forecast (min === max) without division by zero or NaN", () => {
    // 24 points with identical PM2.5 = 40 µg/m³
    const flatForecast = createMockForecast(24, () => 40);

    const { container } = render(
      <HourlyExposureChart
        hourlyForecast={flatForecast}
        bestWindow={null}
        worstWindow={null}
      />
    );

    const svg = screen.getByRole("img", { name: /diurnal hourly air quality curve/i });
    expect(svg).toBeInTheDocument();

    const svgHtml = container.querySelector("svg")?.outerHTML || "";
    expect(svgHtml).not.toContain("NaN");
    expect(svgHtml).not.toContain("Infinity");
  });
});
