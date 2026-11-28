"use client";

import React, { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HourlyAirPoint, NaqiCategory } from "@/types/air-quality";
import {
  RollingWindow,
  parseHourFromIso,
} from "@/lib/calculators/exposure-windows";
import { getNaqiTheme, NAQI_THEMES } from "@/lib/aqi/theme";

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
  centerPct: number;
  labelHours: string;
}

function buildMonotoneSplinePath(
  coords: Array<{ x: number; y: number }>
): string {
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
    )} ${cp2y.toFixed(1)}, ${coords[i + 1].x.toFixed(1)} ${coords[
      i + 1
    ].y.toFixed(1)}`;
  }

  return path;
}

function getSafetyPostureLabel(
  naqi: number
): "Safe" | "Caution" | "Avoid Outdoors" {
  if (naqi <= 100) return "Safe";
  if (naqi <= 200) return "Caution";
  return "Avoid Outdoors";
}

function getPostureTextClass(naqi: number): string {
  if (naqi <= 100) return "text-success";
  if (naqi <= 200) return "text-warning";
  return "text-danger";
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

  const exactIdx = coords.findIndex((p) => p.timeIso === win.startTimeIso);
  if (exactIdx !== -1) return exactIdx;

  const targetMs = Date.parse(win.startTimeIso);
  if (Number.isFinite(targetMs)) {
    const epochIdx = coords.findIndex(
      (p) => Date.parse(p.timeIso) === targetMs
    );
    if (epochIdx !== -1) return epochIdx;
  }

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
  const height = 220;
  const paddingX = 6;
  const paddingY = 8;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const { coords, maxPm25, linePath, areaPath, columns, xTicks } = useMemo(() => {
    if (points.length === 0) {
      return {
        coords: [] as PlotPoint[],
        maxPm25: 120,
        linePath: "",
        areaPath: "",
        columns: [] as Array<{ x: number; w: number }>,
        xTicks: [] as PlotPoint[],
      };
    }

    const maxCityPm25 = Math.max(
      ...points.map((p) =>
        typeof p.pm25 === "number" && Number.isFinite(p.pm25)
          ? Math.max(0, p.pm25)
          : 0
      ),
      0
    );
    const safeMax = Math.max(maxCityPm25 * 1.2, 20);

    const mapped: PlotPoint[] = points.map((p, idx) => {
      const x =
        points.length > 1
          ? paddingX + (idx / (points.length - 1)) * chartWidth
          : paddingX + chartWidth / 2;
      const pm25Val =
        typeof p.pm25 === "number" && Number.isFinite(p.pm25)
          ? Math.max(0, p.pm25)
          : 0;
      const pm10Val =
        typeof p.pm10 === "number" && Number.isFinite(p.pm10)
          ? Math.max(0, p.pm10)
          : null;
      const y = paddingY + chartHeight - (pm25Val / safeMax) * chartHeight;
      const hour = parseHourFromIso(p.timeIso);

      return {
        x: Number.isFinite(x) ? x : paddingX,
        y: Number.isFinite(y) ? y : paddingY + chartHeight,
        pm25: pm25Val,
        pm10: pm10Val,
        naqi: Number.isFinite(p.estimatedNaqi)
          ? Math.round(p.estimatedNaqi)
          : 0,
        category: p.category ?? "Good",
        hour: Number.isFinite(hour) ? hour : 0,
        timeIso: p.timeIso,
      };
    });

    const path = buildMonotoneSplinePath(mapped);
    const baselineY = (paddingY + chartHeight).toFixed(1);
    const area =
      mapped.length > 1
        ? `${path} L ${mapped[mapped.length - 1].x.toFixed(1)} ${baselineY} L ${mapped[0].x.toFixed(
            1
          )} ${baselineY} Z`
        : "";

    const cols = mapped.map((c, idx) => {
      if (mapped.length === 1) {
        return { x: paddingX, w: chartWidth };
      }
      const leftEdge =
        idx === 0 ? paddingX : (mapped[idx - 1].x + c.x) / 2;
      const rightEdge =
        idx === mapped.length - 1
          ? width - paddingX
          : (c.x + mapped[idx + 1].x) / 2;
      return {
        x: leftEdge,
        w: Math.max(8, rightEdge - leftEdge),
      };
    });

    const tickStep = Math.max(1, Math.floor((mapped.length - 1) / 4));
    const sampledTicks: PlotPoint[] =
      mapped.length <= 5
        ? mapped
        : mapped.filter(
            (_, idx) => idx === 0 || idx === mapped.length - 1 || idx % tickStep === 0
          );

    return {
      coords: mapped,
      maxPm25: safeMax,
      linePath: path,
      areaPath: area,
      columns: cols,
      xTicks: sampledTicks,
    };
  }, [points, chartWidth, chartHeight]);

  if (points.length === 0) {
    return (
      <div className="bg-surface border border-subtle rounded-xl p-6 elevation-1">
        <div className="sr-only" aria-live="polite">
          No hourly forecast data available.
        </div>
        <p className="text-xs text-ink-muted text-center py-8">
          No hourly forecast data available.
        </p>
      </div>
    );
  }

  const getWindowSpan = (win: RollingWindow | null): WindowBandSpan | null => {
    const startIndex = findMatchingStartIndex(win, coords);
    if (startIndex === -1 || !coords[startIndex] || !win) return null;
    const endIndex = Math.min(startIndex + 1, coords.length - 1);
    const leftPt = coords[startIndex].x;
    const rightPt =
      endIndex > startIndex ? coords[endIndex].x : leftPt + 24;
    const spanX = Math.max(paddingX, leftPt - 6);
    const spanW = Math.min(
      width - paddingX - spanX,
      Math.max(24, rightPt - leftPt + 12)
    );
    if (!Number.isFinite(spanX) || !Number.isFinite(spanW) || spanW <= 0) {
      return null;
    }
    const rawPct = ((spanX + spanW / 2) / width) * 100;
    const centerPct = Math.min(84, Math.max(16, rawPct));
    const labelHours = `${win.startHour.toString().padStart(2, "0")}:00–${win.endHour
      .toString()
      .padStart(2, "0")}:00`;
    return { x: spanX, width: spanW, centerPct, labelHours };
  };

  const bestSpan = getWindowSpan(bestWindow);
  const worstSpan = getWindowSpan(worstWindow);

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

  return (
    <div className="bg-surface border border-subtle rounded-xl p-5 sm:p-6 elevation-1">
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
          <h3 className="font-display text-base font-semibold tracking-tight text-ink">
            Diurnal Exposure Curve (Next 24–36 Hours)
          </h3>
          <p className="text-xs text-ink-muted mt-0.5">
            Solar dispersion vs. thermal inversion trapping · Scrub curve for hourly readings
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-ink-secondary">
          <div className="inline-flex items-center gap-1.5">
            <span
              className={`w-3 h-3 rounded-[2px] border ${NAQI_THEMES.Good.badgeBg}`}
              aria-hidden="true"
            />
            <span>Best 2h Window</span>
          </div>
          <div className="inline-flex items-center gap-1.5">
            <span
              className={`w-3 h-3 rounded-[2px] border ${NAQI_THEMES["Very Poor"].badgeBg}`}
              aria-hidden="true"
            />
            <span>Peak Smog Window</span>
          </div>
        </div>
      </div>

      {/* Interactive Chart Viewport with Legible HTML Axes & Window Pills */}
      <div
        role="group"
        tabIndex={0}
        aria-label="Interactive diurnal air quality scrubber. Use Left and Right arrow keys to inspect hours."
        onKeyDown={handleChartKeyDown}
        onBlur={() => setActivePointIndex(null)}
        onPointerLeave={() => setActivePointIndex(null)}
        onPointerCancel={() => setActivePointIndex(null)}
        className="relative rounded-lg border border-subtle bg-surface p-3 select-none"
      >
        {/* Mobile-Legible DOM HTML Zone Callout Strip (minimum 11px CSS px) */}
        {(bestSpan || worstSpan) && (
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 pl-10">
            {bestSpan && (
              <div
                data-testid="chart-best-2h-band"
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-mono font-bold tracking-wide ${NAQI_THEMES.Good.badgeBg}`}
              >
                <span>BEST 2H</span>
                <span className="font-normal opacity-90">{bestSpan.labelHours}</span>
              </div>
            )}

            {worstSpan && (
              <div
                data-testid="chart-peak-smog-band"
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-mono font-bold tracking-wide ${NAQI_THEMES["Very Poor"].badgeBg}`}
              >
                <span>PEAK SMOG</span>
                <span className="font-normal opacity-90">{worstSpan.labelHours}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-stretch gap-2">
          {/* Crisp DOM HTML Y-Axis PM2.5 Ticks (never scaled inside SVG) */}
          <div
            aria-hidden="true"
            className="w-8 shrink-0 flex flex-col justify-between text-right py-1 text-xs font-mono tabular-nums text-ink-muted"
          >
            <span>{Math.round(maxPm25)}</span>
            <span>{Math.round(maxPm25 * 0.5)}</span>
            <span>0</span>
          </div>

          <div className="relative flex-1 min-w-0">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-44 sm:h-52 block overflow-visible touch-pan-y"
              preserveAspectRatio="none"
              role="img"
              aria-label="Diurnal hourly air quality curve"
              onPointerDown={(e) => {
                try {
                  e.currentTarget.setPointerCapture?.(e.pointerId);
                } catch {
                  // Ignore synthetic test events without active pointerId
                }
                scrubFromClientX(e.clientX);
              }}
              onPointerMove={(e) => scrubFromClientX(e.clientX)}
              onPointerUp={(e) => {
                try {
                  if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
                    e.currentTarget.releasePointerCapture?.(e.pointerId);
                  }
                } catch {
                  // Ignore release edge cases
                }
              }}
            >
              <defs>
                <linearGradient id="diurnalTealFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.01" />
                </linearGradient>
              </defs>

              {/* Horizontal Gridlines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = paddingY + chartHeight * (1 - ratio);
                return (
                  <line
                    key={ratio}
                    x1={paddingX}
                    y1={y}
                    x2={width - paddingX}
                    y2={y}
                    stroke={
                      ratio === 0 ? "var(--border-control)" : "var(--border-subtle)"
                    }
                    strokeDasharray={ratio === 0 ? undefined : "3 3"}
                    strokeWidth="1"
                  />
                );
              })}

              {/* Shaded Peak Smog Band */}
              {worstSpan && (
                <g>
                  <rect
                    x={worstSpan.x}
                    y={paddingY}
                    width={worstSpan.width}
                    height={chartHeight}
                    fill="rgba(220, 38, 38, 0.11)"
                  />
                  <line
                    x1={worstSpan.x}
                    y1={paddingY}
                    x2={worstSpan.x + worstSpan.width}
                    y2={paddingY}
                    stroke={NAQI_THEMES["Very Poor"].accentColor}
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                </g>
              )}

              {/* Shaded Best 2h Band */}
              {bestSpan && (
                <g>
                  <rect
                    x={bestSpan.x}
                    y={paddingY}
                    width={bestSpan.width}
                    height={chartHeight}
                    fill="rgba(5, 150, 105, 0.12)"
                  />
                  <line
                    x1={bestSpan.x}
                    y1={paddingY}
                    x2={bestSpan.x + bestSpan.width}
                    y2={paddingY}
                    stroke={NAQI_THEMES.Good.accentColor}
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                </g>
              )}

              {/* Area Fill & Monotone Cubic Curve */}
              {areaPath && <path d={areaPath} fill="url(#diurnalTealFill)" />}
              <path
                d={linePath}
                fill="none"
                stroke="var(--ink-primary)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {coords.length === 1 && (
                <circle
                  cx={coords[0].x}
                  cy={coords[0].y}
                  r="5"
                  fill="var(--bg-surface)"
                  stroke="var(--accent-primary)"
                  strokeWidth="2.5"
                />
              )}

              {/* Active Crosshair & Concentric Node Ring */}
              {activeCoord && (
                <g className="pointer-events-none">
                  <line
                    x1={activeCoord.x}
                    y1={paddingY}
                    x2={activeCoord.x}
                    y2={paddingY + chartHeight}
                    stroke="var(--accent-primary)"
                    strokeWidth="1.5"
                  />
                  <line
                    x1={paddingX}
                    y1={activeCoord.y}
                    x2={activeCoord.x}
                    y2={activeCoord.y}
                    stroke="var(--border-control)"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  <circle
                    cx={activeCoord.x}
                    cy={activeCoord.y}
                    r="6"
                    fill="var(--bg-surface)"
                    stroke="var(--accent-primary)"
                    strokeWidth="2.5"
                  />
                  <circle
                    cx={activeCoord.x}
                    cy={activeCoord.y}
                    r="2.2"
                    fill="var(--accent-primary)"
                  />
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
                    y={paddingY}
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

            {/* Clamped Floating / Mobile Inline Docked Tooltip Card */}
            <AnimatePresence>
              {activeCoord && activeTheme && ActiveIcon && (
                <div
                  data-testid="chart-floating-tooltip"
                  style={{
                    left: `${clampedAnchorPct}%`,
                    top: "8px",
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
                    className="rounded-lg border border-control bg-surface p-3 elevation-3 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-subtle">
                      <span className="font-mono tabular-nums font-semibold text-ink">
                        {activeCoord.hour.toString().padStart(2, "0")}:00 IST
                      </span>
                      <span
                        className={`font-semibold ${getPostureTextClass(
                          activeCoord.naqi
                        )}`}
                      >
                        {getSafetyPostureLabel(activeCoord.naqi)}
                      </span>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div className="rounded bg-subtle px-2 py-1.5">
                        <span className="text-xs text-ink-muted block">
                          PM2.5
                        </span>
                        <span className="font-mono tabular-nums font-bold text-ink">
                          {activeCoord.pm25.toFixed(1)} µg/m³
                        </span>
                      </div>
                      <div className="rounded bg-subtle px-2 py-1.5">
                        <span className="text-xs text-ink-muted block">PM10</span>
                        <span className="font-mono tabular-nums font-bold text-ink">
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
                        <ActiveIcon
                          className="w-3 h-3 shrink-0"
                          aria-hidden="true"
                        />
                        <span>{activeCoord.category}</span>
                      </span>
                      <span className="font-mono tabular-nums font-bold text-ink">
                        NAQI {activeCoord.naqi}
                      </span>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile-Legible DOM HTML X-Axis Hour Markers */}
        <div
          aria-hidden="true"
          className="pl-10 pt-2 flex items-center justify-between text-xs font-mono tabular-nums text-ink-muted"
        >
          {xTicks.map((tick, i) => (
            <span key={`${tick.timeIso}-${i}`}>
              {tick.hour.toString().padStart(2, "0")}:00
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-subtle flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
        <span>X: Local IST · Y: PM2.5 (µg/m³)</span>
        <span>
          Drag horizontally, tap points, or press Left/Right arrow keys to scrub
        </span>
      </div>
    </div>
  );
}
