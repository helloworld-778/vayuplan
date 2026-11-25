"use client";

import React, { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HourlyAirPoint, NaqiCategory } from "@/types/air-quality";
import {
  RollingWindow,
  parseHourFromIso,
} from "@/lib/calculators/exposure-windows";
import { getNaqiTheme } from "@/lib/aqi/theme";

interface HourlyExposureChartProps {
  hourlyForecast: HourlyAirPoint[];
  bestWindow: RollingWindow | null;
  worstWindow: RollingWindow | null;
}

interface PlotPoint {
  x: number;
  y: number;
  pm25: number;
  pm10: number | null;
  naqi: number;
  category: NaqiCategory;
  hour: number;
  timeIso: string;
}

interface WindowBandSpan {
  x: number;
  width: number;
  badgeCenterX: number;
}

function buildMonotoneSplinePath(coords: Array<{ x: number; y: number }>): string {
  if (coords.length === 0) return "";
  if (coords.length === 1) {
    return `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
  }

  const n = coords.length;
  const dx: number[] = [];
  const slopes: number[] = [];

  for (let i = 0; i < n - 1; i++) {
    const deltaX = Math.max(0.0001, coords[i + 1].x - coords[i].x);
    dx.push(deltaX);
    slopes.push((coords[i + 1].y - coords[i].y) / deltaX);
  }

  const tangents: number[] = new Array(n).fill(0);
  tangents[0] = slopes[0];
  tangents[n - 1] = slopes[n - 2];

  for (let i = 1; i < n - 1; i++) {
    if (slopes[i - 1] * slopes[i] <= 0) {
      tangents[i] = 0;
    } else {
      const m0 = slopes[i - 1];
      const m1 = slopes[i];
      const d0 = dx[i - 1];
      const d1 = dx[i];
      const common = d0 + d1;
      tangents[i] = (3 * common) / ((common + d1) / m0 + (common + d0) / m1);
    }
  }

  let path = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    const cp1x = coords[i].x + h;
    const cp1y = coords[i].y + h * tangents[i];
    const cp2x = coords[i + 1].x - h;
    const cp2y = coords[i + 1].y - h * tangents[i + 1];
    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(
      1
    )} ${cp2y.toFixed(1)}, ${coords[i + 1].x.toFixed(1)} ${coords[i + 1].y.toFixed(1)}`;
  }

  return path;
}

function getSafetyPostureLabel(naqi: number): "Safe" | "Caution" | "Avoid Outdoors" {
  if (naqi <= 100) return "Safe";
  if (naqi <= 200) return "Caution";
  return "Avoid Outdoors";
}

function getPostureTextClass(naqi: number): string {
  if (naqi <= 100) return "text-[#065F46]";
  if (naqi <= 200) return "text-[#92400E]";
  return "text-[#991B1B]";
}

/**
 * Matches a rolling 2h window onto plotted coordinates reliably, including when 48h
 * global forecast selection falls beyond the 36h chart slice or differs in ISO string formatting.
 */
function findMatchingStartIndex(
  win: RollingWindow | null,
  coords: PlotPoint[]
): number {
  if (!win || coords.length === 0) return -1;

  // 1. Exact ISO timestamp match
  const exactIdx = coords.findIndex((p) => p.timeIso === win.startTimeIso);
  if (exactIdx !== -1) return exactIdx;

  // 2. Parsed epoch timestamp match
  const targetMs = Date.parse(win.startTimeIso);
  if (Number.isFinite(targetMs)) {
    const epochIdx = coords.findIndex((p) => Date.parse(p.timeIso) === targetMs);
    if (epochIdx !== -1) return epochIdx;
  }

  // 3. Fallback: match plotted wall-clock startHour (picking candidate closest to window's avgPm25)
  let fallbackIdx = -1;
  let smallestDelta = Infinity;
  for (let i = 0; i < coords.length - 1; i++) {
    if (coords[i].hour === win.startHour) {
      const avgLocal = (coords[i].pm25 + coords[i + 1].pm25) / 2;
      const delta = Math.abs(avgLocal - win.avgPm25);
      if (delta < smallestDelta) {
        smallestDelta = delta;
        fallbackIdx = i;
      }
    }
  }
  if (fallbackIdx !== -1) return fallbackIdx;

  // 4. Final fallback: single-hour match if on final plotted slot
  return coords.findIndex((p) => p.hour === win.startHour);
}

export function HourlyExposureChart({
  hourlyForecast,
  bestWindow,
  worstWindow,
}: HourlyExposureChartProps) {
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const points = useMemo(
    () => (hourlyForecast || []).slice(0, 36),
    [hourlyForecast]
  );

  const width = 800;
  const height = 270;
  const paddingLeft = 48;
  const paddingRight = 20;
  const paddingTop = 44;
  const paddingBottom = 38;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const { coords, maxPm25, linePath, areaPath, columns } = useMemo(() => {
    if (points.length === 0) {
      return {
        coords: [] as PlotPoint[],
        maxPm25: 120,
        linePath: "",
        areaPath: "",
        columns: [] as Array<{ x: number; w: number }>,
      };
    }

    const maxCityPm25 = Math.max(
      ...points.map((p) =>
        typeof p.pm25 === "number" && Number.isFinite(p.pm25) ? Math.max(0, p.pm25) : 0
      ),
      0
    );
    const safeMax = Math.max(maxCityPm25 * 1.2, 20);

    const mapped: PlotPoint[] = points.map((p, idx) => {
      const x =
        points.length > 1
          ? paddingLeft + (idx / (points.length - 1)) * chartWidth
          : paddingLeft + chartWidth / 2;
      const pm25Val =
        typeof p.pm25 === "number" && Number.isFinite(p.pm25) ? Math.max(0, p.pm25) : 0;
      const pm10Val =
        typeof p.pm10 === "number" && Number.isFinite(p.pm10) ? Math.max(0, p.pm10) : null;
      const y = paddingTop + chartHeight - (pm25Val / safeMax) * chartHeight;
      const hour = parseHourFromIso(p.timeIso);

      return {
        x: Number.isFinite(x) ? x : paddingLeft,
        y: Number.isFinite(y) ? y : paddingTop + chartHeight,
        pm25: pm25Val,
        pm10: pm10Val,
        naqi: Number.isFinite(p.estimatedNaqi) ? Math.round(p.estimatedNaqi) : 0,
        category: p.category ?? "Good",
        hour: Number.isFinite(hour) ? hour : 0,
        timeIso: p.timeIso,
      };
    });

    const path = buildMonotoneSplinePath(mapped);
    const baselineY = (paddingTop + chartHeight).toFixed(1);
    const area =
      mapped.length > 1
        ? `${path} L ${mapped[mapped.length - 1].x.toFixed(1)} ${baselineY} L ${mapped[0].x.toFixed(
            1
          )} ${baselineY} Z`
        : "";

    const cols = mapped.map((c, idx) => {
      if (mapped.length === 1) {
        return { x: paddingLeft, w: chartWidth };
      }
      const leftEdge =
        idx === 0 ? paddingLeft : (mapped[idx - 1].x + c.x) / 2;
      const rightEdge =
        idx === mapped.length - 1
          ? width - paddingRight
          : (c.x + mapped[idx + 1].x) / 2;
      return {
        x: leftEdge,
        w: Math.max(8, rightEdge - leftEdge),
      };
    });

    return {
      coords: mapped,
      maxPm25: safeMax,
      linePath: path,
      areaPath: area,
      columns: cols,
    };
  }, [points, chartWidth, chartHeight]);

  if (points.length === 0) {
    return (
      <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl p-6 elevation-1">
        <div className="sr-only" aria-live="polite">
          No hourly forecast data available.
        </div>
        <p className="text-xs text-[#525E70] text-center py-8">
          No hourly forecast data available.
        </p>
      </div>
    );
  }

  const getWindowSpan = (
    win: RollingWindow | null,
    pillHalfWidth: number
  ): WindowBandSpan | null => {
    const startIndex = findMatchingStartIndex(win, coords);
    if (startIndex === -1 || !coords[startIndex]) return null;
    const endIndex = Math.min(startIndex + 1, coords.length - 1);
    const leftPt = coords[startIndex].x;
    const rightPt =
      endIndex > startIndex ? coords[endIndex].x : leftPt + 24;
    const spanX = Math.max(paddingLeft, leftPt - 8);
    const spanW = Math.min(
      width - paddingRight - spanX,
      Math.max(26, rightPt - leftPt + 16)
    );
    if (!Number.isFinite(spanX) || !Number.isFinite(spanW) || spanW <= 0) {
      return null;
    }
    const rawCenter = spanX + spanW / 2;
    const clampedCenter = Math.max(
      paddingLeft + pillHalfWidth,
      Math.min(width - paddingRight - pillHalfWidth, rawCenter)
    );
    return { x: spanX, width: spanW, badgeCenterX: clampedCenter };
  };

  const bestSpan = getWindowSpan(bestWindow, 31);
  const worstSpan = getWindowSpan(worstWindow, 38);
  const badgesOverlap =
    bestSpan !== null &&
    worstSpan !== null &&
    Math.abs(bestSpan.badgeCenterX - worstSpan.badgeCenterX) < 76;

  const srSummary = `24-hour diurnal air quality forecast. Peak PM2.5 of ${maxPm25.toFixed(
    1
  )} µg/m³. Best outdoor window is between ${
    bestWindow?.startHour ?? "N/A"
  }:00 and ${bestWindow?.endHour ?? "N/A"}:00 with average PM2.5 of ${
    bestWindow?.avgPm25 ?? "N/A"
  } µg/m³. Worst smog window is between ${worstWindow?.startHour ?? "N/A"}:00 and ${
    worstWindow?.endHour ?? "N/A"
  }:00 with average PM2.5 of ${worstWindow?.avgPm25 ?? "N/A"} µg/m³.`;

  const scrubFromClientX = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg || coords.length === 0) return;
    const rect = svg.getBoundingClientRect();
    if (!rect || rect.width <= 0) return;
    const relX = ((clientX - rect.left) / rect.width) * width;
    let nearest = 0;
    let bestDist = Infinity;
    for (let i = 0; i < coords.length; i++) {
      const dist = Math.abs(coords[i].x - relX);
      if (dist < bestDist) {
        bestDist = dist;
        nearest = i;
      }
    }
    setActivePointIndex(nearest);
  };

  const handleChartKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (coords.length === 0) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setActivePointIndex((prev) =>
        prev === null ? 0 : Math.min(coords.length - 1, prev + 1)
      );
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setActivePointIndex((prev) =>
        prev === null ? coords.length - 1 : Math.max(0, prev - 1)
      );
    } else if (e.key === "Home") {
      e.preventDefault();
      setActivePointIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActivePointIndex(coords.length - 1);
    } else if (e.key === "Escape") {
      setActivePointIndex(null);
    }
  };

  const activeCoord =
    activePointIndex !== null && coords[activePointIndex]
      ? coords[activePointIndex]
      : null;
  const activeTheme = activeCoord ? getNaqiTheme(activeCoord.category) : null;
  const ActiveIcon = activeTheme?.icon;
  const activeLeftPct = activeCoord ? (activeCoord.x / width) * 100 : 50;
  const alignRight = activeLeftPct > 56;
  const clampedAnchorPct = Math.min(94, Math.max(6, activeLeftPct));

  const worstBadgeTopY = badgesOverlap ? paddingTop - 40 : paddingTop - 22;
  const bestBadgeTopY = paddingTop - 22;

  return (
    <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl p-5 sm:p-6 elevation-1">
      <div className="sr-only" aria-live="polite">
        {srSummary}
      </div>

      <div className="sr-only" role="status" aria-live="polite">
        {activeCoord
          ? `${activeCoord.hour.toString().padStart(2, "0")}:00 IST, PM2.5 ${activeCoord.pm25.toFixed(1)} µg/m³, NAQI ${activeCoord.naqi}, ${activeCoord.category}, ${getSafetyPostureLabel(activeCoord.naqi)}.`
          : ""}
      </div>

      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-display text-base font-semibold tracking-tight text-[#0F172A]">
            Diurnal Exposure Curve (Next 24–36 Hours)
          </h3>
          <p className="text-xs text-[#525E70] mt-0.5">
            Solar dispersion vs. thermal inversion trapping · Scrub chart for hourly readings
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-[#334155]">
          <div className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-[2px] bg-[#ECFDF5] border border-[#059669]" />
            <span>Best 2h Window</span>
          </div>
          <div className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-[2px] bg-[#FEF2F2] border border-[#DC2626]" />
            <span>Peak Smog Window</span>
          </div>
        </div>
      </div>

      {/* Interactive Chart Viewport + Clamped Floating/Docked Tooltip */}
      <div
        role="group"
        tabIndex={0}
        aria-label="Interactive diurnal air quality scrubber. Use Left and Right arrow keys to inspect hours."
        onKeyDown={handleChartKeyDown}
        onBlur={() => setActivePointIndex(null)}
        onPointerLeave={() => setActivePointIndex(null)}
        onPointerCancel={() => setActivePointIndex(null)}
        className="relative rounded-lg border border-[#DCE3EC] bg-[#FFFFFF] p-2 select-none"
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto block overflow-visible touch-pan-y"
          role="img"
          aria-label="Diurnal hourly air quality curve"
          onPointerMove={(e) => scrubFromClientX(e.clientX)}
          onPointerDown={(e) => scrubFromClientX(e.clientX)}
        >
          <defs>
            <linearGradient id="diurnalCobaltFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1D4ED8" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Horizontal Y-Axis Reference Ticks */}
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
                  stroke={ratio === 0 ? "#CBD5E1" : "#E2E8F0"}
                  strokeDasharray={ratio === 0 ? undefined : "3 3"}
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize={12}
                  className="fill-[#525E70] font-mono tabular-nums"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Peak Smog Window Shaded Band */}
          {worstSpan && (
            <g data-testid="chart-peak-smog-band">
              <rect
                x={worstSpan.x}
                y={paddingTop}
                width={worstSpan.width}
                height={chartHeight}
                fill="rgba(220, 38, 38, 0.10)"
              />
              <line
                x1={worstSpan.x}
                y1={paddingTop}
                x2={worstSpan.x + worstSpan.width}
                y2={paddingTop}
                stroke="#DC2626"
                strokeWidth="2"
                strokeDasharray="4 3"
              />
              <rect
                x={worstSpan.badgeCenterX - 38}
                y={worstBadgeTopY}
                width={76}
                height={18}
                rx={3}
                fill="#FEF2F2"
                stroke="#FCA5A5"
              />
              <text
                x={worstSpan.badgeCenterX}
                y={worstBadgeTopY + 12}
                textAnchor="middle"
                fontSize={10}
                className="fill-[#991B1B] font-mono font-bold tracking-wider"
              >
                PEAK SMOG
              </text>
            </g>
          )}

          {/* Best 2h Window Shaded Band */}
          {bestSpan && (
            <g data-testid="chart-best-2h-band">
              <rect
                x={bestSpan.x}
                y={paddingTop}
                width={bestSpan.width}
                height={chartHeight}
                fill="rgba(5, 150, 105, 0.12)"
              />
              <line
                x1={bestSpan.x}
                y1={paddingTop}
                x2={bestSpan.x + bestSpan.width}
                y2={paddingTop}
                stroke="#059669"
                strokeWidth="2"
                strokeDasharray="4 3"
              />
              <rect
                x={bestSpan.badgeCenterX - 31}
                y={bestBadgeTopY}
                width={62}
                height={18}
                rx={3}
                fill="#ECFDF5"
                stroke="#6EE7B7"
              />
              <text
                x={bestSpan.badgeCenterX}
                y={bestBadgeTopY + 12}
                textAnchor="middle"
                fontSize={10}
                className="fill-[#065F46] font-mono font-bold tracking-wider"
              >
                BEST 2H
              </text>
            </g>
          )}

          {/* Area Fill & Monotone Cubic Curve */}
          {areaPath && <path d={areaPath} fill="url(#diurnalCobaltFill)" />}
          <path
            d={linePath}
            fill="none"
            stroke="#0F172A"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {coords.length === 1 && (
            <circle
              cx={coords[0].x}
              cy={coords[0].y}
              r="5"
              fill="#FFFFFF"
              stroke="#1D4ED8"
              strokeWidth="2.5"
            />
          )}

          {/* X-Axis Hour Labels */}
          {coords.map((c, idx) => {
            const showTick = idx % 3 === 0 || coords.length === 1;
            if (!showTick) return null;
            return (
              <g key={`tick-${idx}`}>
                <line
                  x1={c.x}
                  y1={paddingTop + chartHeight}
                  x2={c.x}
                  y2={paddingTop + chartHeight + 5}
                  stroke="#CBD5E1"
                />
                <text
                  x={c.x}
                  y={paddingTop + chartHeight + 21}
                  textAnchor="middle"
                  fontSize={12}
                  className="fill-[#525E70] font-mono tabular-nums"
                >
                  {c.hour.toString().padStart(2, "0")}:00
                </text>
              </g>
            );
          })}

          {/* Active Crosshair & Concentric Focus Ring */}
          {activeCoord && (
            <g className="pointer-events-none">
              <line
                x1={activeCoord.x}
                y1={paddingTop}
                x2={activeCoord.x}
                y2={paddingTop + chartHeight}
                stroke="#1D4ED8"
                strokeWidth="1.5"
              />
              <line
                x1={paddingLeft}
                y1={activeCoord.y}
                x2={activeCoord.x}
                y2={activeCoord.y}
                stroke="#CBD5E1"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <circle
                cx={activeCoord.x}
                cy={activeCoord.y}
                r="6"
                fill="#FFFFFF"
                stroke="#1D4ED8"
                strokeWidth="2.5"
              />
              <circle cx={activeCoord.x} cy={activeCoord.y} r="2.2" fill="#1D4ED8" />
            </g>
          )}

          {/* Full-Column Hit Targets per Hour */}
          {coords.map((c, idx) => {
            const col = columns[idx];
            if (!col) return null;
            return (
              <rect
                key={`hit-${idx}`}
                data-testid={`hour-hit-${idx}`}
                x={col.x}
                y={paddingTop}
                width={col.w}
                height={chartHeight}
                fill="transparent"
                className="cursor-crosshair"
                onPointerEnter={() => setActivePointIndex(idx)}
                onPointerMove={() => setActivePointIndex(idx)}
                onPointerDown={() => setActivePointIndex(idx)}
              />
            );
          })}
        </svg>

        {/* Responsive Tooltip Card: Inline full-width below SVG on <640px, floating clamped on sm+ */}
        <AnimatePresence>
          {activeCoord && activeTheme && ActiveIcon && (
            <div
              data-testid="chart-floating-tooltip"
              style={{
                left: `${clampedAnchorPct}%`,
                top: "12px",
                transform: alignRight
                  ? "translateX(calc(-100% - 10px))"
                  : "translateX(10px)",
              }}
              className="chart-tooltip-responsive pointer-events-none mt-2 w-full sm:mt-0 sm:w-56 sm:absolute sm:z-20"
            >
              <motion.div
                key="chart-tooltip-card"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.12 }}
                className="rounded-lg border border-[#CBD5E1] bg-[#FFFFFF] p-3 elevation-3 text-xs"
              >
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#DCE3EC]">
                  <span className="font-mono tabular-nums font-semibold text-[#0F172A]">
                    {activeCoord.hour.toString().padStart(2, "0")}:00 IST
                  </span>
                  <span className={`font-semibold ${getPostureTextClass(activeCoord.naqi)}`}>
                    {getSafetyPostureLabel(activeCoord.naqi)}
                  </span>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="rounded bg-[#F1F4F8] px-2 py-1.5">
                    <span className="text-xs text-[#525E70] block">PM2.5</span>
                    <span className="font-mono tabular-nums font-bold text-[#0F172A]">
                      {activeCoord.pm25.toFixed(1)} µg/m³
                    </span>
                  </div>
                  <div className="rounded bg-[#F1F4F8] px-2 py-1.5">
                    <span className="text-xs text-[#525E70] block">PM10</span>
                    <span className="font-mono tabular-nums font-bold text-[#0F172A]">
                      {activeCoord.pm10 !== null
                        ? `${activeCoord.pm10.toFixed(1)} µg/m³`
                        : "—"}
                    </span>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-semibold ${activeTheme.badgeBg}`}
                  >
                    <ActiveIcon className="w-3 h-3 shrink-0" aria-hidden="true" />
                    <span>{activeCoord.category}</span>
                  </span>
                  <span className="font-mono tabular-nums font-bold text-[#0F172A]">
                    NAQI {activeCoord.naqi}
                  </span>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-3 pt-3 border-t border-[#DCE3EC] flex flex-wrap items-center justify-between gap-2 text-xs text-[#525E70]">
        <span>X: Local IST · Y: PM2.5 (µg/m³)</span>
        <span>
          Hover, slide, or focus chart + Left/Right arrows to scrub hours
        </span>
      </div>
    </div>
  );
}
