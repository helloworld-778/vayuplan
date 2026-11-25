"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AirQualitySnapshot, NaqiCategory, PollutantReadings } from "@/types/air-quality";
import { NAQI_THEMES, formatIstTime, getNaqiTheme } from "@/lib/aqi/theme";
import { RefreshCw, Radio, Database, MapPin } from "lucide-react";

interface TelemetryHeroProps {
  snapshot: AirQualitySnapshot | null;
  isLoading: boolean;
  onRefresh: () => void;
}

interface PollutantMeta {
  key: keyof PollutantReadings;
  label: string;
  unit: string;
  limit: number;
}

const POLLUTANTS: PollutantMeta[] = [
  { key: "pm25", label: "PM2.5", unit: "µg/m³", limit: 60 },
  { key: "pm10", label: "PM10", unit: "µg/m³", limit: 100 },
  { key: "no2", label: "NO₂", unit: "µg/m³", limit: 80 },
  { key: "o3", label: "O₃", unit: "µg/m³", limit: 100 },
  { key: "co", label: "CO", unit: "µg/m³", limit: 2000 },
  { key: "so2", label: "SO₂", unit: "µg/m³", limit: 80 },
];

const SPECTRUM_BANDS: Array<{ category: NaqiCategory; widthPct: number }> = [
  { category: "Good", widthPct: 10 },
  { category: "Satisfactory", widthPct: 10 },
  { category: "Moderate", widthPct: 20 },
  { category: "Poor", widthPct: 20 },
  { category: "Very Poor", widthPct: 20 },
  { category: "Severe", widthPct: 20 },
];

function AnimatedNaqiValue({ target }: { target: number }) {
  const [displayed, setDisplayed] = useState<number>(target);
  const displayedRef = useRef<number>(target);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || displayedRef.current === target) {
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

  return (
    <span className="font-display text-4xl sm:text-5xl font-bold tracking-[-0.03em] leading-none tabular-nums text-[#0F172A]">
      {displayed}
    </span>
  );
}

export function TelemetryHero({
  snapshot,
  isLoading,
  onRefresh,
}: TelemetryHeroProps) {
  const formattedIst = useMemo(
    () => (snapshot ? formatIstTime(snapshot.fetchedAt) : ""),
    [snapshot]
  );

  if (!snapshot) {
    return (
      <section
        aria-label="Air quality telemetry placeholder"
        className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl p-6 sm:p-7 elevation-1 animate-pulse"
      >
        <div className="h-5 bg-[#F1F4F8] w-48 rounded mb-4" />
        <div className="h-14 bg-[#F1F4F8] w-36 rounded mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 bg-[#F1F4F8] rounded-md" />
          ))}
        </div>
      </section>
    );
  }

  const theme = getNaqiTheme(snapshot.category);
  const IconComponent = theme.icon;
  const clampedSpectrumPct = Math.min(
    98.5,
    Math.max(1.5, (snapshot.naqi / 500) * 100)
  );

  return (
    <section
      aria-label="Live air quality telemetry"
      className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl elevation-1 overflow-hidden flex flex-col justify-between"
    >
      {/* Top Band: City, Live CPCB NAQI Score, One-Line Directive & 6-Tier Spectrum Bar */}
      <div className="p-5 sm:p-6 border-b border-[#DCE3EC] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#525E70]">
          <div className="flex flex-wrap items-center gap-2 font-medium">
            <MapPin className="w-3.5 h-3.5 text-[#334155]" aria-hidden="true" />
            <span className="font-semibold text-[#0F172A]">
              {snapshot.location.name}, {snapshot.location.state}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-xs text-[#525E70]">
              {snapshot.location.lat.toFixed(2)}°N, {snapshot.location.lon.toFixed(2)}°E
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[#525E70] font-medium">Dominant:</span>
            <span className="font-mono font-bold uppercase px-2 py-0.5 rounded bg-[#F1F4F8] border border-[#DCE3EC] text-[#0F172A]">
              {snapshot.dominantPollutant}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-baseline gap-4">
            <AnimatedNaqiValue target={snapshot.naqi} />

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-[#525E70]">
                CPCB NAQI Index
              </span>
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-semibold ${theme.badgeBg}`}
              >
                <IconComponent className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{snapshot.category}</span>
                <span className="font-mono tabular-nums font-normal opacity-90">
                  ({theme.rangeLabel})
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs sm:text-sm font-medium text-[#334155] leading-relaxed max-w-md">
            {theme.shortAdvice}
          </p>
        </div>

        {/* 6-Tier CPCB NAQI Spectrum Gauge Bar */}
        <div className="space-y-1.5">
          <div className="relative pt-1">
            <div className="h-2.5 w-full rounded-full overflow-hidden flex bg-[#F1F4F8]">
              {SPECTRUM_BANDS.map((band) => (
                <div
                  key={band.category}
                  style={{
                    width: `${band.widthPct}%`,
                    backgroundColor: NAQI_THEMES[band.category].accentColor,
                  }}
                  className="h-full border-r border-[#FFFFFF]/60 last:border-r-0 opacity-85"
                />
              ))}
            </div>

            {/* Spring-Animated Spectrum Needle */}
            <motion.div
              aria-hidden="true"
              initial={false}
              animate={{ left: `${clampedSpectrumPct}%` }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              style={{ transform: "translateX(-50%)" }}
              className="absolute top-0 w-3 h-4.5 rounded-sm bg-[#FFFFFF] border-2 border-[#0F172A] elevation-1 pointer-events-none"
            />
          </div>

          <div className="flex justify-between font-mono tabular-nums text-xs text-[#525E70]">
            <span>0</span>
            <span>100</span>
            <span>200</span>
            <span>300</span>
            <span>400</span>
            <span>500+</span>
          </div>
        </div>
      </div>

      {/* 6-Pollutant Spacious Grid (grid-cols-2 sm:grid-cols-3) */}
      <div className="p-4 sm:p-5 bg-[#FFFFFF]">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {POLLUTANTS.map((p) => {
            const val = snapshot.pollutants[p.key];
            const isDominant = snapshot.dominantPollutant === p.key;
            const ratio =
              val !== null && val !== undefined ? Math.min(1, Math.max(0, val / p.limit)) : 0;
            const overLimit = val !== null && val !== undefined && val > p.limit;

            return (
              <div
                key={p.key}
                className={`min-w-0 p-3.5 rounded-lg border transition-colors ${
                  isDominant
                    ? "bg-[#F1F4F8] border-[#0F172A]"
                    : "bg-[#F1F4F8] border-[#DCE3EC]"
                }`}
              >
                <div className="flex items-center justify-between gap-1.5 min-w-0">
                  <span className="text-xs font-semibold text-[#0F172A] truncate">
                    {p.label}
                  </span>
                  {isDominant && (
                    <span className="shrink-0 inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-[#0F172A] text-[#FFFFFF] font-semibold">
                      Lead
                    </span>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap items-baseline gap-1 min-w-0">
                  <span className="text-lg font-bold font-mono tabular-nums text-[#0F172A]">
                    {val !== null && val !== undefined ? val.toFixed(1) : "—"}
                  </span>
                  <span className="text-xs text-[#525E70] font-mono">
                    {p.unit}
                  </span>
                </div>

                {/* Animated % of CPCB safe limit track */}
                <div className="mt-2.5 space-y-1">
                  <div className="h-1.5 w-full rounded-full bg-[#DCE3EC] overflow-hidden">
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: ratio }}
                      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      style={{ transformOrigin: "left" }}
                      className={`h-full rounded-full ${
                        overLimit ? "bg-[#DC2626]" : "bg-[#1D4ED8]"
                      }`}
                    />
                  </div>
                  <div className="text-xs font-mono tabular-nums text-[#525E70]">
                    Limit {p.limit} {p.unit}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mandatory Station & Timestamp Provenance Footer */}
      <footer className="px-5 py-3 bg-[#F7F8FA] border-t border-[#DCE3EC] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#525E70]">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {snapshot.isFallback ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-[#FFFBEB] text-[#92400E] border border-[#FCD34D]">
              <Database className="w-3.5 h-3.5" aria-hidden="true" />
              <span>CAMS Model Telemetry</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#6EE7B7]">
              <Radio className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Live CPCB Ground Station</span>
            </span>
          )}

          <span className="font-medium text-[#0F172A]">
            {snapshot.stationName}
          </span>

          <span className="font-mono tabular-nums text-[#525E70]">
            {formattedIst} IST
          </span>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          aria-label="Refresh live air quality data"
          className="inline-flex items-center justify-center gap-1.5 px-3 min-h-[40px] bg-[#FFFFFF] border border-[#64748B]/70 hover:border-[#1D4ED8] text-[#0F172A] rounded-lg text-xs font-semibold transition-colors shrink-0 disabled:opacity-55"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-[#1D4ED8] ${
              isLoading ? "animate-spin" : ""
            }`}
            aria-hidden="true"
          />
          <span>Refresh Live Data</span>
        </motion.button>
      </footer>
    </section>
  );
}
