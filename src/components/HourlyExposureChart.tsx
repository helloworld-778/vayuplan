"use client";

import React, { useState } from "react";
import { HourlyAirPoint } from "@/types/air-quality";
import { RollingWindow } from "@/lib/calculators/exposure-windows";
import { parseHourFromIso } from "@/lib/calculators/exposure-windows";

interface HourlyExposureChartProps {
  hourlyForecast: HourlyAirPoint[];
  bestWindow: RollingWindow | null;
  worstWindow: RollingWindow | null;
}

export function HourlyExposureChart({
  hourlyForecast,
  bestWindow,
  worstWindow,
}: HourlyExposureChartProps) {
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);

  // Take up to 36 hours for clear temporal resolution
  const points = (hourlyForecast || []).slice(0, 36);

  if (points.length < 2) {
    return (
      <div className="p-8 text-center text-xs text-[#7A8290] border border-[#DDD9CE] rounded bg-[#FAF9F6]">
        Insufficient hourly forecast data to render exposure chart.
      </div>
    );
  }

  // Find max values for scaling
  const maxPm25 = Math.max(
    ...points.map((p) => p.pm25 || 0),
    120 // minimum chart ceiling
  );

  // SVG Chart Geometry
  const width = 800;
  const height = 220;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 35;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Calculate coordinates for each point
  const coords = points.map((p, idx) => {
    const x = paddingLeft + (idx / (points.length - 1)) * chartWidth;
    const pm25Val = p.pm25 || 0;
    const y = paddingTop + chartHeight - (pm25Val / maxPm25) * chartHeight;
    const hour = parseHourFromIso(p.timeIso);
    return { x, y, pm25: pm25Val, naqi: p.estimatedNaqi, category: p.category, hour, timeIso: p.timeIso };
  });

  // Construct SVG path string
  const linePath = coords.reduce(
    (acc, curr, idx) =>
      idx === 0
        ? `M ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`
        : `${acc} L ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`,
    ""
  );

  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(
    1
  )} ${(paddingTop + chartHeight).toFixed(1)} L ${coords[0].x.toFixed(
    1
  )} ${(paddingTop + chartHeight).toFixed(1)} Z`;

  // Helper to find X span for a window
  const getWindowSpan = (win: RollingWindow | null) => {
    if (!win) return null;
    const startIndex = points.findIndex((p) => p.timeIso === win.startTimeIso);
    if (startIndex === -1) return null;
    const endIndex = Math.min(startIndex + 1, points.length - 1);
    const x1 = coords[startIndex].x - 10;
    const x2 = coords[endIndex].x + 10;
    return { x: Math.max(paddingLeft, x1), width: Math.max(24, x2 - x1) };
  };

  const bestSpan = getWindowSpan(bestWindow);
  const worstSpan = getWindowSpan(worstWindow);

  // Screen-reader text summary
  const srSummary = `24-hour diurnal air quality forecast. Peak PM2.5 of ${maxPm25.toFixed(
    1
  )} µg/m³. Best outdoor window is between ${bestWindow?.startHour ?? "N/A"}:00 and ${
    bestWindow?.endHour ?? "N/A"
  }:00 with average PM2.5 of ${bestWindow?.avgPm25 ?? "N/A"} µg/m³. Worst smog window is between ${
    worstWindow?.startHour ?? "N/A"
  }:00 and ${worstWindow?.endHour ?? "N/A"}:00 with average PM2.5 of ${
    worstWindow?.avgPm25 ?? "N/A"
  } µg/m³.`;

  return (
    <div className="bg-[#FFFFFF] border border-[#E2DFD6] rounded-lg p-5">
      {/* Screen Reader Accessible Summary */}
      <div className="sr-only" aria-live="polite">
        {srSummary}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#14181F]">
            Diurnal Exposure Curve (Next 24–36 Hours)
          </h3>
          <p className="text-xs text-[#5E6470]">
            Ground-level thermal inversion tracking • Hourly PM2.5 (µg/m³)
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#D4EDDA] border border-[#2E7D32]" />
            <span className="text-[#2B303B]">Best 2h Window</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#F8D7DA] border border-[#C62828]" />
            <span className="text-[#2B303B]">Peak Smog Window</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          role="img"
          aria-label="Diurnal hourly air quality curve"
        >
          {/* Background horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = paddingTop + chartHeight * (1 - ratio);
            const val = Math.round(maxPm25 * ratio);
            return (
              <g key={ratio}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#EFECE6"
                  strokeDasharray="3 3"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-[#8C93A0] text-[9px] font-mono tabular-nums"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Best Window Highlight Area */}
          {bestSpan && (
            <rect
              x={bestSpan.x}
              y={paddingTop}
              width={bestSpan.width}
              height={chartHeight}
              fill="#E8F5E9"
              stroke="#A5D6A7"
              strokeDasharray="2 2"
              opacity="0.9"
            />
          )}

          {/* Worst Smog Window Highlight Area */}
          {worstSpan && (
            <rect
              x={worstSpan.x}
              y={paddingTop}
              width={worstSpan.width}
              height={chartHeight}
              fill="#FFEBEE"
              stroke="#EF9A9A"
              strokeDasharray="2 2"
              opacity="0.9"
            />
          )}

          {/* Gradient area fill under curve */}
          <path d={areaPath} fill="#F2EFE9" opacity="0.75" />

          {/* PM2.5 Trend Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#14181F"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Data Points and Hour Ticks */}
          {coords.map((c, idx) => {
            const isEveryThird = idx % 3 === 0;
            const isActive = activePointIndex === idx;

            return (
              <g key={idx}>
                {/* Vertical tick line */}
                {isEveryThird && (
                  <line
                    x1={c.x}
                    y1={paddingTop + chartHeight}
                    x2={c.x}
                    y2={paddingTop + chartHeight + 5}
                    stroke="#DDD9CE"
                  />
                )}

                {/* Hour label */}
                {isEveryThird && (
                  <text
                    x={c.x}
                    y={paddingTop + chartHeight + 18}
                    textAnchor="middle"
                    className="fill-[#6E7582] text-[10px] font-mono"
                  >
                    {c.hour.toString().padStart(2, "0")}:00
                  </text>
                )}

                {/* Point dot */}
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={isActive ? "5" : "2.5"}
                  fill={isActive ? "#14181F" : "#FFFFFF"}
                  stroke="#14181F"
                  strokeWidth={isActive ? "2" : "1.5"}
                  className="cursor-pointer transition-all"
                  tabIndex={0}
                  role="button"
                  aria-label={`${c.hour}:00 - PM2.5 ${c.pm25} µg/m³, NAQI ${c.naqi}`}
                  onFocus={() => setActivePointIndex(idx)}
                  onBlur={() => setActivePointIndex(null)}
                  onMouseEnter={() => setActivePointIndex(idx)}
                  onMouseLeave={() => setActivePointIndex(null)}
                />
              </g>
            );
          })}

          {/* Active Hover / Keyboard Focus Tooltip */}
          {activePointIndex !== null && coords[activePointIndex] && (
            <g>
              {/* Vertical crosshair */}
              <line
                x1={coords[activePointIndex].x}
                y1={paddingTop}
                x2={coords[activePointIndex].x}
                y2={paddingTop + chartHeight}
                stroke="#14181F"
                strokeWidth="1"
                strokeDasharray="2 2"
              />

              {/* Tooltip Card */}
              <foreignObject
                x={Math.min(
                  coords[activePointIndex].x - 60,
                  width - paddingRight - 120
                )}
                y={Math.max(5, coords[activePointIndex].y - 55)}
                width="120"
                height="50"
              >
                <div className="bg-[#14181F] text-[#FFFFFF] rounded p-1.5 text-center shadow-md">
                  <div className="text-[10px] font-mono text-[#DCD8CF]">
                    {coords[activePointIndex].hour.toString().padStart(2, "0")}:00 • {coords[activePointIndex].category}
                  </div>
                  <div className="text-xs font-bold font-mono">
                    {coords[activePointIndex].pm25} µg/m³
                  </div>
                </div>
              </foreignObject>
            </g>
          )}
        </svg>
      </div>

      <div className="mt-3 pt-3 border-t border-[#EAE7DF] flex flex-wrap items-center justify-between text-xs text-[#5E6470]">
        <span className="font-mono text-[11px]">
          X-Axis: Local Indian Standard Time (IST) • Y-Axis: PM2.5 Concentration (µg/m³)
        </span>
        <span className="text-[11px] text-[#7A8290]">
          Hover or Tab through dots for exact hourly readings
        </span>
      </div>
    </div>
  );
}
