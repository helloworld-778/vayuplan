"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Radio, Database, RefreshCw } from "lucide-react";
import { AirQualitySnapshot, HourlyAirPoint, NaqiCategory } from "@/types/air-quality";
import { EVALUATOR_PRESETS } from "@/lib/presets";
import { formatIstTime, getNaqiTheme } from "@/lib/aqi/theme";
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

const AMBIENT_WASH_BY_CATEGORY: Record<NaqiCategory, string> = {
  Good: "radial-gradient(closest-side, rgba(5, 150, 105, 0.14), rgba(5, 150, 105, 0.03) 65%, transparent)",
  Satisfactory:
    "radial-gradient(closest-side, rgba(101, 163, 13, 0.13), rgba(101, 163, 13, 0.03) 65%, transparent)",
  Moderate:
    "radial-gradient(closest-side, rgba(217, 119, 6, 0.14), rgba(217, 119, 6, 0.03) 65%, transparent)",
  Poor: "radial-gradient(closest-side, rgba(234, 88, 12, 0.14), rgba(234, 88, 12, 0.03) 65%, transparent)",
  "Very Poor":
    "radial-gradient(closest-side, rgba(220, 38, 38, 0.14), rgba(220, 38, 38, 0.03) 65%, transparent)",
  Severe:
    "radial-gradient(closest-side, rgba(147, 51, 234, 0.14), rgba(147, 51, 234, 0.03) 65%, transparent)",
};

function useAnimatedNumber(target: number | null): number | null {
  const [displayed, setDisplayed] = useState<number | null>(target);
  const displayedRef = React.useRef<number | null>(target);

  useEffect(() => {
    if (target === null) {
      displayedRef.current = null;
      setDisplayed(null);
      return;
    }

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || displayedRef.current === null || displayedRef.current === target) {
      displayedRef.current = target;
      setDisplayed(target);
      return;
    }

    const startVal = displayedRef.current;
    let startTime: number | null = null;
    const duration = 420;
    let rafId = 0;

    const tick = (now: number) => {
      if (startTime === null) startTime = now;
      const elapsed = Math.max(0, now - startTime);
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const nextVal = Math.round(startVal + (target - startVal) * eased);
      displayedRef.current = nextVal;
      setDisplayed(nextVal);
      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target]);

  return displayed;
}

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
}: {
  forecast: HourlyAirPoint[];
  bestWindow: RollingWindow | null;
}) {
  const points = (forecast || []).slice(0, 24);
  if (points.length === 0) {
    return (
      <div className="h-24 rounded-md bg-[#F1F4F8] border border-[#DCE3EC] flex items-center justify-center text-xs text-[#525E70]">
        Hourly forecast curve unavailable for this station.
      </div>
    );
  }

  const width = 420;
  const height = 96;
  const padX = 10;
  const padY = 12;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  // Auto-scale dynamically to [0, max(maxCityPm25 * 1.3, 15)] so low-PM2.5 cities like Bengaluru stay expressive
  const maxCityPm25 = Math.max(
    ...points.map((p) => (typeof p.pm25 === "number" && isFinite(p.pm25) ? Math.max(0, p.pm25) : 0)),
    0
  );
  const maxPm25 = Math.max(maxCityPm25 * 1.3, 15);

  const coords = points.map((p, idx) => {
    const val = typeof p.pm25 === "number" && isFinite(p.pm25) ? Math.max(0, p.pm25) : 0;
    const x =
      points.length > 1
        ? padX + (idx / (points.length - 1)) * chartW
        : padX + chartW / 2;
    const y = padY + chartH - (val / maxPm25) * chartH;
    return {
      x: isFinite(x) ? x : padX,
      y: isFinite(y) ? Math.max(padY, Math.min(padY + chartH, y)) : padY + chartH,
    };
  });

  const linePath = buildCubicPath(coords);
  const areaPath =
    coords.length > 1
      ? `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${(
          padY + chartH
        ).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(padY + chartH).toFixed(1)} Z`
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
    <div className="rounded-lg bg-[#F1F4F8] border border-[#DCE3EC] p-3">
      <div className="flex items-center justify-between text-xs text-[#525E70] mb-1.5">
        <span className="font-semibold text-[#334155]">
          Next 24h PM2.5 Profile
        </span>
        {bestWindow && (
          <span className="font-mono tabular-nums text-[#065F46] font-semibold">
            Cleanest {bestWindow.startHour.toString().padStart(2, "0")}:00–
            {bestWindow.endHour.toString().padStart(2, "0")}:00
          </span>
        )}
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-24 overflow-visible"
        role="img"
        aria-label="24-hour PM2.5 sounding curve preview"
      >
        <defs>
          <linearGradient id="landingSparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1D4ED8" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        <line
          x1={padX}
          y1={padY + chartH / 2}
          x2={width - padX}
          y2={padY + chartH / 2}
          stroke="#CBD5E1"
          strokeDasharray="3 3"
        />
        {bestSpan && (
          <rect
            x={bestSpan.x}
            y={padY}
            width={bestSpan.w}
            height={chartH}
            rx={2}
            fill="rgba(5, 150, 105, 0.16)"
          />
        )}
        {areaPath && <path d={areaPath} fill="url(#landingSparkFill)" />}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke="#0F172A"
            strokeWidth={2.2}
            strokeLinecap="round"
          />
        )}
        {coords.length === 1 && (
          <circle
            cx={coords[0].x}
            cy={coords[0].y}
            r={4}
            fill="#FFFFFF"
            stroke="#1D4ED8"
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

  const activePreset = EVALUATOR_PRESETS[activePresetId] || EVALUATOR_PRESETS["delhi-commuter"];

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

  const animatedNaqi = useAnimatedNumber(snapshot ? snapshot.naqi : null);

  const windowSummary = useMemo(() => {
    if (!snapshot) return null;
    return optimizeExposureWindows(snapshot.hourlyForecast, activePreset.profile);
  }, [snapshot, activePreset.profile]);

  const theme = snapshot ? getNaqiTheme(snapshot.category) : null;
  const CategoryIcon = theme?.icon;
  const ambientBg = snapshot
    ? AMBIENT_WASH_BY_CATEGORY[snapshot.category]
    : "radial-gradient(closest-side, rgba(29, 78, 216, 0.08), transparent)";

  return (
    <div className="relative">
      {/* Soft NAQI-Aware Ambient Atmospheric Tint */}
      <div
        aria-hidden="true"
        style={{ background: ambientBg }}
        className="pointer-events-none absolute -inset-6 sm:-inset-10 rounded-full transition-colors duration-500"
      />

      <div className="relative bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl elevation-2 overflow-hidden">
        {/* Segmented City Switcher */}
        <div className="px-4 sm:px-5 pt-4 pb-3 border-b border-[#DCE3EC] bg-[#F7F8FA]">
          <div
            role="tablist"
            aria-label="Select live Indian city preview"
            className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-[#EBF0F5] rounded-lg border border-[#DCE3EC]"
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
                  className={`relative px-2.5 py-2 rounded-md text-xs font-semibold transition-colors min-h-[38px] ${
                    isSelected
                      ? "text-[#0F172A]"
                      : "text-[#525E70] hover:text-[#0F172A]"
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="landing-city-tab"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      className="absolute inset-0 bg-[#FFFFFF] rounded-md border border-[#CBD5E1] elevation-1"
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
        <div className="p-5 sm:p-6">
          {isLoading && !snapshot ? (
            <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Loading live city telemetry">
              <div className="h-12 w-36 bg-[#F1F4F8] rounded-md" />
              <div className="grid grid-cols-3 gap-3">
                <div className="h-16 bg-[#F1F4F8] rounded-md" />
                <div className="h-16 bg-[#F1F4F8] rounded-md" />
                <div className="h-16 bg-[#F1F4F8] rounded-md" />
              </div>
              <div className="h-24 bg-[#F1F4F8] rounded-md" />
            </div>
          ) : errorMsg && !snapshot ? (
            <div className="p-5 rounded-lg bg-[#FEF2F2] border border-[#FCA5A5] text-xs text-[#991B1B] space-y-3">
              <p className="font-semibold">Live preview unavailable for {activePreset.location.name}: {errorMsg}</p>
              <button
                type="button"
                onClick={() => setRetryCount((c) => c + 1)}
                className="inline-flex items-center gap-1.5 px-3 min-h-[40px] rounded bg-[#FFFFFF] border border-[#FCA5A5] text-[#991B1B] font-semibold"
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
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-medium text-[#525E70]">
                      {snapshot.location.name}, {snapshot.location.state} · Live CPCB NAQI
                    </div>
                    <div className="mt-1.5 flex items-baseline gap-3">
                      <span className="font-display text-5xl font-bold tracking-tight tabular-nums text-[#0F172A]">
                        {animatedNaqi ?? snapshot.naqi}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-semibold ${theme.badgeBg}`}
                      >
                        <CategoryIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>{snapshot.category}</span>
                        <span className="font-mono font-normal opacity-80">
                          ({theme.rangeLabel})
                        </span>
                      </span>
                    </div>
                  </div>

                  {isLoading && (
                    <span className="text-xs font-mono text-[#1D4ED8] inline-flex items-center gap-1.5">
                      <RefreshCw className="w-3 h-3 animate-spin" aria-hidden="true" />
                      <span>Updating...</span>
                    </span>
                  )}
                </div>

                {/* 3 Micro-Telemetry Wells */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-[#F1F4F8] border border-[#DCE3EC] rounded-md p-3">
                    <div className="text-xs text-[#525E70]">PM2.5</div>
                    <div className="mt-0.5 text-base font-bold font-mono tabular-nums text-[#0F172A]">
                      {snapshot.pollutants.pm25 !== null
                        ? `${snapshot.pollutants.pm25.toFixed(1)}`
                        : "—"}
                      <span className="text-xs font-normal text-[#525E70] ml-1">
                        µg/m³
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#F1F4F8] border border-[#DCE3EC] rounded-md p-3">
                    <div className="text-xs text-[#525E70]">Dominant</div>
                    <div className="mt-0.5 text-base font-bold font-mono uppercase text-[#0F172A]">
                      {snapshot.dominantPollutant}
                    </div>
                  </div>

                  <div className="bg-[#F1F4F8] border border-[#DCE3EC] rounded-md p-3">
                    <div className="text-xs text-[#525E70]">Best 2h</div>
                    <div className="mt-0.5 text-sm sm:text-base font-bold font-mono tabular-nums text-[#0F172A]">
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
                />

                {/* Provenance + Handoff Footer */}
                <div className="pt-3 border-t border-[#DCE3EC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5 text-xs text-[#525E70]">
                    <div className="inline-flex items-center gap-1.5 font-medium text-[#0F172A]">
                      {snapshot.isFallback ? (
                        <Database className="w-3.5 h-3.5 text-[#D97706]" aria-hidden="true" />
                      ) : (
                        <Radio className="w-3.5 h-3.5 text-[#065F46]" aria-hidden="true" />
                      )}
                      <span className="truncate max-w-[230px]">{snapshot.stationName}</span>
                    </div>
                    <div className="font-mono tabular-nums">
                      {formatIstTime(snapshot.fetchedAt)} IST
                    </div>
                  </div>

                  <Link
                    href={`/assistant?preset=${activePreset.id}`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] active:scale-[0.98] text-[#FFFFFF] text-xs sm:text-sm font-semibold transition-all shrink-0"
                  >
                    <span>Open {activePreset.location.name} in Assistant</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </div>
              </motion.div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
