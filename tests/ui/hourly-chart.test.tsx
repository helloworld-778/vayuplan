import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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

    const svg = screen.getByRole("img", { name: /diurnal hourly air quality curve/i });
    expect(svg).toBeInTheDocument();

    expect(screen.getByText(/24-hour diurnal air quality forecast/i)).toBeInTheDocument();
    expect(screen.getByText(/Best outdoor window is between 13:00 and 15:00/i)).toBeInTheDocument();
    expect(screen.getByText(/Worst smog window is between 7:00 and 9:00/i)).toBeInTheDocument();

    const svgHtml = container.querySelector("svg")?.outerHTML || "";
    expect(svgHtml).not.toContain("NaN");
  });

  it("reveals floating HTML inspection tooltip with IST hour, PM2.5, PM10, NAQI badge, and edge flipping on pointer interaction", () => {
    const forecast = createMockForecast(24, (i) => 40 + i * 5);
    render(
      <HourlyExposureChart
        hourlyForecast={forecast}
        bestWindow={mockBestWindow}
        worstWindow={mockWorstWindow}
      />
    );

    // Interact with early hour vertical hit column (hour 2: PM2.5 = 50, PM10 = 75, NAQI 110 Moderate)
    const earlyHit = screen.getByTestId("hour-hit-2");
    fireEvent.pointerEnter(earlyHit);

    const tooltip = screen.getByTestId("chart-floating-tooltip");
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent("02:00 IST");
    expect(tooltip).toHaveTextContent("50.0 µg/m³");
    expect(tooltip).toHaveTextContent("75.0 µg/m³");
    expect(tooltip).toHaveTextContent("NAQI 110");
    expect(tooltip).toHaveTextContent("Caution");
    expect(tooltip.style.transform).toContain("translateX(10px)");

    // Interact near right edge (hour 22: PM2.5 = 150 > 120 -> Very Poor, NAQI 320, flips left)
    const lateHit = screen.getByTestId("hour-hit-22");
    fireEvent.pointerMove(lateHit);

    const flippedTooltip = screen.getByTestId("chart-floating-tooltip");
    expect(flippedTooltip).toHaveTextContent("22:00 IST");
    expect(flippedTooltip).toHaveTextContent("Very Poor");
    expect(flippedTooltip).toHaveTextContent("Avoid Outdoors");
    expect(flippedTooltip.style.transform).toContain("-100%");
  });

  it("supports keyboard scrubbing with ArrowRight, ArrowLeft, End, Home, and Escape", () => {
    const forecast = createMockForecast(24, () => 60);
    render(
      <HourlyExposureChart
        hourlyForecast={forecast}
        bestWindow={null}
        worstWindow={null}
      />
    );

    const scrubber = screen.getByRole("group", {
      name: /Interactive diurnal air quality scrubber/i,
    });

    fireEvent.keyDown(scrubber, { key: "ArrowRight" });
    expect(screen.getByTestId("chart-floating-tooltip")).toHaveTextContent("00:00 IST");

    fireEvent.keyDown(scrubber, { key: "ArrowRight" });
    expect(screen.getByTestId("chart-floating-tooltip")).toHaveTextContent("01:00 IST");

    fireEvent.keyDown(scrubber, { key: "End" });
    expect(screen.getByTestId("chart-floating-tooltip")).toHaveTextContent("23:00 IST");

    fireEvent.keyDown(scrubber, { key: "ArrowLeft" });
    expect(screen.getByTestId("chart-floating-tooltip")).toHaveTextContent("22:00 IST");

    fireEvent.keyDown(scrubber, { key: "Escape" });
    expect(screen.queryByTestId("chart-floating-tooltip")).not.toBeInTheDocument();
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

    const svgHtml = container.querySelector("svg")?.outerHTML || "";
    expect(svgHtml).not.toContain("NaN");
    expect(svgHtml).not.toContain("Infinity");
  });

  it("handles flat forecast (min === max) without division by zero or NaN", () => {
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
