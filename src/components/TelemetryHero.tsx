"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  AirQualitySnapshot,
  PollutantReadings,
} from "@/types/air-quality";
import { formatIstTime, getNaqiTheme, NAQI_THEMES } from "@/lib/aqi/theme";
import { RadialNaqiGauge } from "@/components/RadialNaqiGauge";
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
        className="bg-obsidian border border-dark rounded-xl p-6 sm:p-7 elevation-2 animate-pulse"
      >
        <div className="h-5 bg-obsidian-elevated w-48 rounded mb-4" />
        <div className="h-24 bg-obsidian-elevated w-48 rounded-lg mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 bg-obsidian-elevated rounded-lg" />
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
      className="relative bg-obsidian text-ink-on-dark border border-dark rounded-xl elevation-2 overflow-hidden flex flex-col justify-between"
    >
      {/* Subtle Live-NAQI Radial Atmospheric Wash */}
      <div
        aria-hidden="true"
        style={{ background: theme.darkAmbientWash }}
        className="pointer-events-none absolute inset-0"
      />

      {/* Top Obsidian Command Row */}
      <div className="relative p-5 sm:p-6 border-b border-dark space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-on-dark-muted">
          <div className="flex flex-wrap items-center gap-2 font-medium">
            <MapPin className="w-3.5 h-3.5 text-accent-on-dark" aria-hidden="true" />
            <span className="font-semibold text-ink-on-dark">
              {snapshot.location.name}, {snapshot.location.state}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-xs text-ink-on-dark-muted">
              {snapshot.location.lat.toFixed(2)}°N, {snapshot.location.lon.toFixed(2)}°E
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-ink-on-dark-muted font-medium">Dominant:</span>
            <span className="font-mono font-bold uppercase px-2 py-0.5 rounded bg-obsidian-elevated border border-dark text-ink-on-dark">
              {snapshot.dominantPollutant}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-5">
            <RadialNaqiGauge
              naqi={snapshot.naqi}
              category={snapshot.category}
              size="lg"
            />

            <div className="space-y-2">
              <span className="text-xs font-semibold text-ink-on-dark-muted block">
                CPCB NAQI Index
              </span>
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-semibold ${theme.darkBadgeBg}`}
              >
                <IconComponent className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{snapshot.category}</span>
                <span className="font-mono tabular-nums font-normal opacity-90">
                  ({theme.rangeLabel})
                </span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-ink-on-dark-muted leading-relaxed max-w-sm">
                {theme.shortAdvice}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 6-Pollutant Obsidian Matrix */}
      <div className="relative p-4 sm:p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {POLLUTANTS.map((p) => {
            const val = snapshot.pollutants[p.key];
            const isDominant = snapshot.dominantPollutant === p.key;
            const ratio =
              val !== null && val !== undefined
                ? Math.min(1, Math.max(0, val / p.limit))
                : 0;
            const overLimit = val !== null && val !== undefined && val > p.limit;

            return (
              <div
                key={p.key}
                className={`min-w-0 p-3.5 rounded-lg border transition-colors bg-obsidian-elevated ${
                  isDominant ? "border-accent-on-dark" : "border-dark"
                }`}
              >
                <div className="flex items-center justify-between gap-1.5 min-w-0">
                  <span className="text-xs font-semibold text-ink-on-dark truncate">
                    {p.label}
                  </span>
                  {isDominant && (
                    <span className="shrink-0 inline-flex items-center text-xs px-1.5 py-0.5 rounded bg-accent-on-dark text-obsidian font-semibold">
                      Lead
                    </span>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap items-baseline gap-1 min-w-0">
                  <span className="text-lg font-bold font-mono tabular-nums text-ink-on-dark">
                    {val !== null && val !== undefined ? val.toFixed(1) : "—"}
                  </span>
                  <span className="text-xs text-ink-on-dark-muted font-mono">
                    {p.unit}
                  </span>
                </div>

                {/* Animated % of CPCB safe limit track */}
                <div className="mt-2.5 space-y-1">
                  <div className="h-1.5 w-full rounded-full bg-obsidian border border-dark overflow-hidden">
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: ratio }}
                      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      style={{ transformOrigin: "left" }}
                      className={`h-full rounded-full ${
                        overLimit ? "bg-danger-icon" : "bg-accent-on-dark"
                      }`}
                    />
                  </div>
                  <div className="text-xs font-mono tabular-nums text-ink-on-dark-muted">
                    Limit {p.limit} {p.unit}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Station & Timestamp Provenance Footer */}
      <footer className="relative px-5 py-3 bg-obsidian-elevated border-t border-dark flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-ink-on-dark-muted">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {snapshot.isFallback ? (
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-semibold ${NAQI_THEMES.Moderate.darkBadgeBg}`}
            >
              <Database className="w-3.5 h-3.5" aria-hidden="true" />
              <span>CAMS Model Telemetry</span>
            </span>
          ) : (
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-semibold ${NAQI_THEMES.Good.darkBadgeBg}`}
            >
              <Radio className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Live CPCB Ground Station</span>
            </span>
          )}

          <span className="font-medium text-ink-on-dark">
            {snapshot.stationName}
          </span>

          <span className="font-mono tabular-nums text-ink-on-dark-muted">
            {formattedIst} IST
          </span>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          aria-label="Refresh live air quality data"
          className="inline-flex items-center justify-center gap-1.5 px-3.5 min-h-[44px] bg-obsidian border border-ink-on-dark-muted hover:border-accent-on-dark text-ink-on-dark rounded-lg text-xs font-semibold transition-colors shrink-0 disabled:opacity-55"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-accent-on-dark ${
              isLoading ? "motion-safe:animate-spin" : ""
            }`}
            aria-hidden="true"
          />
          <span>Refresh Live Data</span>
        </motion.button>
      </footer>
    </section>
  );
}
