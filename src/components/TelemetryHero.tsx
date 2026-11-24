"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AirQualitySnapshot, PollutantReadings } from "@/types/air-quality";
import { formatIstTime, getNaqiTheme } from "@/lib/aqi/theme";
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
  cpcbStandard: string;
}

const POLLUTANTS: PollutantMeta[] = [
  { key: "pm25", label: "PM2.5", unit: "µg/m³", cpcbStandard: "60 (24h)" },
  { key: "pm10", label: "PM10", unit: "µg/m³", cpcbStandard: "100 (24h)" },
  { key: "no2", label: "NO₂", unit: "µg/m³", cpcbStandard: "80 (24h)" },
  { key: "o3", label: "O₃", unit: "µg/m³", cpcbStandard: "100 (8h)" },
  { key: "co", label: "CO", unit: "µg/m³", cpcbStandard: "2000 (8h)" },
  { key: "so2", label: "SO₂", unit: "µg/m³", cpcbStandard: "80 (24h)" },
];

/**
 * Isolated leaf counter so 60fps requestAnimationFrame ticks only re-render the numeral.
 */
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
    const startTime = performance.now();
    const duration = 420;
    let rafId = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
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
        className="h-full bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl p-6 sm:p-7 elevation-1 animate-pulse"
      >
        <div className="h-5 bg-[#F1F4F8] w-48 rounded mb-4" />
        <div className="h-14 bg-[#F1F4F8] w-36 rounded mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-20 bg-[#F1F4F8] rounded-md" />
          ))}
        </div>
      </section>
    );
  }

  const theme = getNaqiTheme(snapshot.category);
  const IconComponent = theme.icon;

  return (
    <section
      aria-label="Live air quality telemetry"
      className="h-full bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl elevation-1 overflow-hidden flex flex-col justify-between"
    >
      {/* Top Band: City, CPCB NAQI Readout & Real-Time Posture */}
      <div className="p-5 sm:p-6 border-b border-[#DCE3EC]">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#525E70]">
          <MapPin className="w-3.5 h-3.5 text-[#334155]" aria-hidden="true" />
          <span className="font-semibold text-[#0F172A]">
            {snapshot.location.name}, {snapshot.location.state}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums text-xs text-[#525E70]">
            {snapshot.location.lat.toFixed(2)}°N, {snapshot.location.lon.toFixed(2)}°E
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-5">
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

          <div className="rounded-lg border border-[#DCE3EC] bg-[#F1F4F8] px-3.5 py-2.5 max-w-xs">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#525E70] font-medium">Dominant:</span>
              <span className="font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-[#FFFFFF] border border-[#DCE3EC] text-[#0F172A]">
                {snapshot.dominantPollutant}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-[#334155] leading-relaxed">
              {theme.shortAdvice}
            </p>
          </div>
        </div>

        <p className="mt-3 text-xs text-[#525E70] leading-relaxed">
          {theme.healthPosture}
        </p>
      </div>

      {/* 6-Pollutant Recessed Instrument Wells (3 cols at 1024px, 6 cols at xl+) */}
      <div className="p-4 sm:p-5 bg-[#FFFFFF]">
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5">
          {POLLUTANTS.map((p) => {
            const val = snapshot.pollutants[p.key];
            const isDominant = snapshot.dominantPollutant === p.key;

            return (
              <div
                key={p.key}
                className={`p-3 rounded-md border transition-colors ${
                  isDominant
                    ? "bg-[#F1F4F8] border-[#0F172A]"
                    : "bg-[#F1F4F8] border-[#DCE3EC]"
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-semibold text-[#0F172A]">
                    {p.label}
                  </span>
                  {isDominant && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-[#0F172A] text-[#FFFFFF] font-semibold">
                      LEAD
                    </span>
                  )}
                </div>

                <div className="mt-1.5 flex flex-wrap items-baseline gap-1">
                  <span className="text-lg font-bold font-mono tabular-nums text-[#0F172A]">
                    {val !== null && val !== undefined ? val.toFixed(1) : "—"}
                  </span>
                  <span className="text-xs text-[#525E70] font-mono">
                    {p.unit}
                  </span>
                </div>

                <div className="mt-1 text-xs font-mono tabular-nums text-[#525E70]">
                  Std: {p.cpcbStandard}
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

        <button
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
        </button>
      </footer>
    </section>
  );
}
