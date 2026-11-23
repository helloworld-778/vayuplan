"use client";

import React from "react";
import {
  AirQualitySnapshot,
  PollutantReadings,
} from "@/types/air-quality";
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

export function TelemetryHero({
  snapshot,
  isLoading,
  onRefresh,
}: TelemetryHeroProps) {
  if (!snapshot) {
    return (
      <section
        aria-label="Air quality telemetry placeholder"
        className="bg-[#FFFFFF] border border-[#E2DFD6] rounded-lg p-8 animate-pulse"
      >
        <div className="h-8 bg-[#EFECE6] w-1/3 rounded mb-4" />
        <div className="h-20 bg-[#EFECE6] w-1/4 rounded mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-16 bg-[#EFECE6] rounded" />
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
      className="bg-[#FFFFFF] border border-[#E2DFD6] rounded-lg overflow-hidden shadow-xs"
    >
      {/* Top Banner: City & Posture */}
      <div className="p-6 sm:p-8 border-b border-[#EAE7DF]">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          {/* Left Column: City, Primary NAQI index */}
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#5E6470] mb-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#5E6470]" />
              <span>{snapshot.location.name}, {snapshot.location.state}</span>
              <span className="text-[#A2A8B5]">•</span>
              <span className="font-mono text-[11px] text-[#7A8290]">
                {snapshot.location.lat.toFixed(2)}°N, {snapshot.location.lon.toFixed(2)}°E
              </span>
            </div>

            <div className="flex items-baseline gap-4 mt-2">
              <span className="text-5xl sm:text-6xl font-extrabold tracking-tight font-mono tabular-nums text-[#14181F]">
                {snapshot.naqi}
              </span>
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-wider font-semibold text-[#6E7582]">
                  CPCB NAQI Index
                </span>
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border text-xs font-semibold mt-1 ${theme.badgeBg}`}
                >
                  <IconComponent className="w-3.5 h-3.5 shrink-0" />
                  <span>{snapshot.category}</span>
                  <span className="font-mono font-normal opacity-80">
                    ({theme.rangeLabel})
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[#5E6470]">Dominant Pollutant:</span>
              <span className="font-mono font-bold uppercase px-2 py-0.5 rounded bg-[#F2EFE9] border border-[#DDD9CE] text-[#14181F]">
                {snapshot.dominantPollutant}
              </span>
              <span className="text-[#A2A8B5]">•</span>
              <span className="text-[#474D58] font-medium">
                {theme.healthPosture}
              </span>
            </div>
          </div>

          {/* Right Column: Health guidance snippet */}
          <div className="lg:max-w-sm rounded-md border border-[#E2DFD6] bg-[#FAF8F5] p-4 text-xs">
            <span className="font-bold text-[#14181F] block mb-1">
              Real-Time Atmospheric Stance
            </span>
            <p className="text-[#474D58] leading-relaxed">
              {theme.shortAdvice}
            </p>
          </div>
        </div>
      </div>

      {/* 6-Pollutant Telemetry Strip */}
      <div className="p-4 sm:p-6 bg-[#FAF9F6]">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {POLLUTANTS.map((p) => {
            const val = snapshot.pollutants[p.key];
            const isDominant = snapshot.dominantPollutant === p.key;

            return (
              <div
                key={p.key}
                className={`p-3 rounded border transition-colors ${
                  isDominant
                    ? "bg-[#FFFFFF] border-[#14181F] shadow-xs"
                    : "bg-[#FFFFFF] border-[#E2DFD6]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#2B303B]">
                    {p.label}
                  </span>
                  {isDominant && (
                    <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-[#14181F] text-[#FFFFFF] font-medium">
                      LEAD
                    </span>
                  )}
                </div>

                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-xl font-bold font-mono tabular-nums text-[#14181F]">
                    {val !== null && val !== undefined ? val.toFixed(1) : "—"}
                  </span>
                  <span className="text-[10px] text-[#7A8290] font-mono">
                    {p.unit}
                  </span>
                </div>

                <div className="mt-1 text-[10px] text-[#8C93A0]">
                  Standard: {p.cpcbStandard}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mandatory Transparency Footer */}
      <footer className="px-6 py-3 bg-[#F2EFE9] border-t border-[#E2DFD6] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#5E6470]">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <div className="flex items-center gap-1.5">
            {snapshot.isFallback ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-900 border border-amber-300">
                <Database className="w-3 h-3 text-amber-700" />
                CAMS Model Telemetry
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-900 border border-emerald-300">
                <Radio className="w-3 h-3 text-emerald-700" />
                Live CPCB Ground Station
              </span>
            )}
            <span className="font-medium text-[#2B303B] ml-1">
              {snapshot.stationName}
            </span>
          </div>

          <div className="text-[11px] text-[#6E7582]">
            Fetched: <span className="font-mono">{formatIstTime(snapshot.fetchedAt)} IST</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          aria-label="Refresh live air quality data"
          className="flex items-center gap-1.5 px-3 py-1 bg-[#FFFFFF] border border-[#DDD9CE] hover:border-[#14181F] text-[#2B303B] rounded text-xs font-medium transition-colors shrink-0 disabled:opacity-60"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-[#474D58] ${
              isLoading ? "animate-spin text-[#14181F]" : ""
            }`}
          />
          <span>Refresh Live Data</span>
        </button>
      </footer>
    </section>
  );
}
