"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Radio, Database, RefreshCw } from "lucide-react";
import { AirQualitySnapshot, HourlyAirPoint } from "@/types/air-quality";
import { EVALUATOR_PRESETS } from "@/lib/presets";
import { formatIstTime, getNaqiTheme } from "@/lib/aqi/theme";
import { RadialNaqiGauge } from "@/components/RadialNaqiGauge";
import {
  optimizeExposureWindows,
  parseHourFromIso,
  RollingWindow,
} from "@/lib/calculators/exposure-windows";

const PREVIEW_PRESET_IDS = [
  "delhi-commuter",
  "mumbai-family",
  "kolkata-senior",
  "bengaluru-student",
] as const;

function buildCubicPath(coords: Array<{ x: number; y: number }>): string {
  if (coords.length === 0) return "";
  if (coords.length === 1) {
    return `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
  }

  let path = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[Math.max(0, i - 1)];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[Math.min(coords.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(
      1
    )} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return path;
}

function MiniSoundingSparkline({
  forecast,
  bestWindow,
  accentStroke,
}: {
  forecast: HourlyAirPoint[];
  bestWindow: RollingWindow | null;
  accentStroke: string;
}) {
  const points = (forecast || []).slice(0, 24);
  if (points.length === 0) {
    return (
      <div className="h-24 rounded-lg bg-obsidian-elevated border border-dark flex items-center justify-center text-xs text-ink-on-dark-muted">
        Hourly forecast curve unavailable for this station.
      </div>
    );
  }

  const width = 420;
  const height = 88;
  const padX = 8;
  const padY = 10;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const maxCityPm25 = Math.max(
    ...points.map((p) =>
      typeof p.pm25 === "number" && isFinite(p.pm25) ? Math.max(0, p.pm25) : 0
    ),
    0
  );
  const maxPm25 = Math.max(maxCityPm25 * 1.3, 15);

  const coords = points.map((p, idx) => {
    const val =
      typeof p.pm25 === "number" && isFinite(p.pm25) ? Math.max(0, p.pm25) : 0;
    const x =
      points.length > 1
        ? padX + (idx / (points.length - 1)) * chartW
        : padX + chartW / 2;
    const y = padY + chartH - (val / maxPm25) * chartH;
    return {
      x: isFinite(x) ? x : padX,
      y: isFinite(y)
        ? Math.max(padY, Math.min(padY + chartH, y))
        : padY + chartH,
    };
  });

  const linePath = buildCubicPath(coords);
  const areaPath =
    coords.length > 1
      ? `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${(
          padY + chartH
        ).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(padY + chartH).toFixed(
          1
        )} Z`
      : "";

  let bestSpan: { x: number; w: number } | null = null;
  if (bestWindow && points.length > 1) {
    let startIdx = points.findIndex((p) => p.timeIso === bestWindow.startTimeIso);
    if (startIdx < 0) {
      startIdx = points.findIndex(
        (p) => parseHourFromIso(p.timeIso) === bestWindow.startHour
      );
    }
    if (startIdx >= 0 && coords[startIdx]) {
      const endIdx = Math.min(startIdx + 1, coords.length - 1);
      const x1 = coords[startIdx].x;
      const x2 = coords[endIdx].x;
      bestSpan = { x: x1, w: Math.max(18, x2 - x1) };
    }
  }

  return (
    <div className="rounded-lg bg-obsidian-elevated border border-dark p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-on-dark-muted mb-2">
        <span className="font-semibold text-ink-on-dark">
          Next 24h PM2.5 Profile
        </span>
        {bestWindow && (
          <span className="font-mono tabular-nums text-accent-on-dark font-semibold">
            Cleanest {bestWindow.startHour.toString().padStart(2, "0")}:00–
            {bestWindow.endHour.toString().padStart(2, "0")}:00 IST
          </span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-22 overflow-visible block"
        role="img"
        aria-label="24-hour PM2.5 sounding curve preview"
      >
        <defs>
          <linearGradient id="landingObsidianFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-on-dark)" stopOpacity="0.26" />
            <stop offset="100%" stopColor="var(--accent-on-dark)" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        <line
          x1={padX}
          y1={padY + chartH / 2}
          x2={width - padX}
          y2={padY + chartH / 2}
          stroke="var(--border-dark)"
          strokeDasharray="3 3"
        />

        {bestSpan && (
          <rect
            x={bestSpan.x}
            y={padY}
            width={bestSpan.w}
            height={chartH}
            rx={2}
            fill="rgba(45, 212, 191, 0.16)"
          />
        )}

        {areaPath && <path d={areaPath} fill="url(#landingObsidianFill)" />}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke={accentStroke}
            strokeWidth={2.2}
            strokeLinecap="round"
          />
        )}

        {coords.length === 1 && (
          <circle
            cx={coords[0].x}
            cy={coords[0].y}
            r={4}
            fill="var(--bg-obsidian)"
            stroke="var(--accent-on-dark)"
            strokeWidth={2.5}
          />
        )}
      </svg>
    </div>
  );
}

export function LiveCitySoundingCard() {
  const [activePresetId, setActivePresetId] = useState<string>("delhi-commuter");
  const [snapshot, setSnapshot] = useState<AirQualitySnapshot | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const activePreset =
    EVALUATOR_PRESETS[activePresetId] || EVALUATOR_PRESETS["delhi-commuter"];

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setErrorMsg(null);

    const loc = activePreset.location;
    fetch(
      `/api/air-quality?lat=${loc.lat}&lon=${loc.lon}&name=${encodeURIComponent(
        loc.name
      )}&state=${encodeURIComponent(loc.state)}`,
      { signal: controller.signal }
    )
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Unable to fetch live telemetry.");
        }
        return res.json() as Promise<AirQualitySnapshot>;
      })
      .then((data) => {
        setSnapshot(data);
        setIsLoading(false);
      })
      .catch((err) => {
        if ((err as Error).name === "AbortError") return;
        setErrorMsg((err as Error).message || "Telemetry unavailable.");
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [activePreset, retryCount]);

  const windowSummary = useMemo(() => {
    if (!snapshot) return null;
    return optimizeExposureWindows(snapshot.hourlyForecast, activePreset.profile);
  }, [snapshot, activePreset.profile]);

  const theme = snapshot ? getNaqiTheme(snapshot.category) : null;
  const CategoryIcon = theme?.icon;

  return (
    <div className="relative bg-obsidian text-ink-on-dark border border-dark rounded-xl elevation-2 overflow-hidden">
      {/* Subtle NAQI-Calibrated Obsidian Atmospheric Glow */}
      {theme && (
        <div
          aria-hidden="true"
          style={{ background: theme.darkAmbientWash }}
          className="pointer-events-none absolute inset-0"
        />
      )}

      {/* Segmented City Switcher */}
      <div className="relative px-4 sm:px-5 pt-4 pb-3 border-b border-dark bg-obsidian-elevated">
        <div
          role="tablist"
          aria-label="Select live Indian city preview"
          className="grid grid-cols-2 sm:grid-cols-4 gap-1.5"
        >
          {PREVIEW_PRESET_IDS.map((id) => {
            const preset = EVALUATOR_PRESETS[id];
            const isSelected = activePresetId === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActivePresetId(id)}
                className={`relative px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[44px] border ${
                  isSelected
                    ? "bg-obsidian text-accent-on-dark border-accent-on-dark"
                    : "bg-transparent text-ink-on-dark-muted border-dark hover:text-ink-on-dark"
                }`}
              >
                {isSelected && (
                  <motion.span
                    layoutId="landing-city-tab"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    className="absolute inset-0 bg-obsidian rounded-lg -z-0"
                    aria-hidden="true"
                  />
                )}
                <span className="relative z-10">{preset.location.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Telemetry Readout Body */}
      <div className="relative p-5 sm:p-6">
        {isLoading && !snapshot ? (
          <div
            className="space-y-4 animate-pulse"
            aria-busy="true"
            aria-label="Loading live city telemetry"
          >
            <div className="h-24 w-48 bg-obsidian-elevated rounded-lg" />
            <div className="grid grid-cols-3 gap-3">
              <div className="h-16 bg-obsidian-elevated rounded-md" />
              <div className="h-16 bg-obsidian-elevated rounded-md" />
              <div className="h-16 bg-obsidian-elevated rounded-md" />
            </div>
            <div className="h-24 bg-obsidian-elevated rounded-md" />
          </div>
        ) : errorMsg && !snapshot ? (
          <div className="p-5 rounded-lg bg-danger-surface border border-danger text-xs text-danger space-y-3">
            <p className="font-semibold">
              Live preview unavailable for {activePreset.location.name}: {errorMsg}
            </p>
            <button
              type="button"
              onClick={() => setRetryCount((c) => c + 1)}
              className="inline-flex items-center gap-1.5 px-3.5 min-h-[44px] rounded-lg bg-surface border border-danger text-danger font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Retry Fetch</span>
            </button>
          </div>
        ) : snapshot && theme && CategoryIcon ? (
          <motion.div
            key={snapshot.location.name}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-5">
                <RadialNaqiGauge
                  naqi={snapshot.naqi}
                  category={snapshot.category}
                  size="md"
                />

                <div className="space-y-2">
                  <div className="text-xs font-medium text-ink-on-dark-muted">
                    {snapshot.location.name}, {snapshot.location.state} · Live CPCB NAQI
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-semibold ${theme.darkBadgeBg}`}
                  >
                    <CategoryIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{snapshot.category}</span>
                    <span className="font-mono font-normal opacity-90">
                      ({theme.rangeLabel})
                    </span>
                  </span>
                  <p className="text-xs text-ink-on-dark-muted max-w-[220px] leading-snug">
                    {theme.shortAdvice}
                  </p>
                </div>
              </div>

              {isLoading && (
                <span className="text-xs font-mono text-accent-on-dark inline-flex items-center gap-1.5 self-start">
                  <RefreshCw className="w-3.5 h-3.5 motion-safe:animate-spin" aria-hidden="true" />
                  <span>Updating...</span>
                </span>
              )}
            </div>

            {/* 3 Micro-Telemetry Wells */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-obsidian-elevated border border-dark rounded-lg p-3">
                <div className="text-xs text-ink-on-dark-muted">PM2.5</div>
                <div className="mt-0.5 text-base font-bold font-mono tabular-nums text-ink-on-dark">
                  {snapshot.pollutants.pm25 !== null
                    ? `${snapshot.pollutants.pm25.toFixed(1)}`
                    : "—"}
                  <span className="text-xs font-normal text-ink-on-dark-muted ml-1">
                    µg/m³
                  </span>
                </div>
              </div>

              <div className="bg-obsidian-elevated border border-dark rounded-lg p-3">
                <div className="text-xs text-ink-on-dark-muted">Dominant</div>
                <div className="mt-0.5 text-base font-bold font-mono uppercase text-ink-on-dark">
                  {snapshot.dominantPollutant}
                </div>
              </div>

              <div className="bg-obsidian-elevated border border-dark rounded-lg p-3">
                <div className="text-xs text-ink-on-dark-muted">Best 2h</div>
                <div className="mt-0.5 text-sm sm:text-base font-bold font-mono tabular-nums text-accent-on-dark">
                  {windowSummary?.bestOutdoorWindow
                    ? `${windowSummary.bestOutdoorWindow.startHour
                        .toString()
                        .padStart(2, "0")}:00–${windowSummary.bestOutdoorWindow.endHour
                        .toString()
                        .padStart(2, "0")}:00`
                    : "Indoors"}
                </div>
              </div>
            </div>

            <MiniSoundingSparkline
              forecast={snapshot.hourlyForecast}
              bestWindow={windowSummary?.bestOutdoorWindow ?? null}
              accentStroke={theme.darkAccentColor}
            />

            {/* Provenance + Handoff Footer */}
            <div className="pt-3 border-t border-dark flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5 text-xs text-ink-on-dark-muted">
                <div className="inline-flex items-center gap-1.5 font-medium text-ink-on-dark">
                  {snapshot.isFallback ? (
                    <Database className="w-3.5 h-3.5 text-accent-on-dark" aria-hidden="true" />
                  ) : (
                    <Radio className="w-3.5 h-3.5 text-accent-on-dark" aria-hidden="true" />
                  )}
                  <span className="truncate max-w-[230px]">
                    {snapshot.stationName}
                  </span>
                </div>
                <div className="font-mono tabular-nums">
                  {formatIstTime(snapshot.fetchedAt)} IST
                </div>
              </div>

              <Link
                href={`/assistant?preset=${activePreset.id}`}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg bg-accent-on-dark hover:bg-surface active:scale-[0.98] text-obsidian text-xs sm:text-sm font-semibold transition-all shrink-0"
              >
                <span>Open {activePreset.location.name} in Assistant</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
