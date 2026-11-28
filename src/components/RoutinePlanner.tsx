"use client";

import React from "react";
import {
  ActionRecommendation,
  AirQualitySnapshot,
  AssistantPlanResponse,
  EffortLevel,
} from "@/types/air-quality";
import { ComputedAnalytics } from "@/lib/ai/types";
import { getNaqiTheme, NAQI_THEMES } from "@/lib/aqi/theme";
import { SafetyStatus } from "@/lib/calculators/exposure-windows";
import { HourlyExposureChart } from "./HourlyExposureChart";
import { MechanismDisclosure } from "./MechanismDisclosure";
import {
  Clock,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  Wind,
} from "lucide-react";

interface RoutinePlannerProps {
  snapshot: AirQualitySnapshot;
  plan: AssistantPlanResponse;
  analytics: ComputedAnalytics;
}

const DAYPART_STATUS_CHIP: Record<SafetyStatus, string> = {
  safe: "Safe for outdoor errands",
  caution: "Limit intense activity",
  avoid_outdoors: "Avoid outdoors · N95",
};

function EffortBadge({ level }: { level: EffortLevel }) {
  switch (level) {
    case "zero_cost":
      return (
        <span
          className={`text-xs px-2 py-0.5 rounded border font-medium ${NAQI_THEMES.Good.badgeBg}`}
        >
          Zero Cost
        </span>
      );
    case "low_cost":
      return (
        <span className="text-xs px-2 py-0.5 rounded bg-accent-wash text-accent border border-accent-border font-medium">
          Low Cost
        </span>
      );
    case "moderate":
      return (
        <span
          className={`text-xs px-2 py-0.5 rounded border font-medium ${NAQI_THEMES.Moderate.badgeBg}`}
        >
          Moderate Investment
        </span>
      );
  }
}

function ActionRow({ item }: { item: ActionRecommendation }) {
  return (
    <article className="rounded-lg border border-subtle bg-canvas p-4 sm:p-5 flex flex-col justify-between gap-3">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-ink-muted" aria-hidden="true" />
            <span className="text-xs font-mono tabular-nums font-semibold text-ink-muted">
              {item.timeframe}
            </span>
          </div>
          <EffortBadge level={item.effortLevel} />
        </div>

        <h4 className="text-sm font-semibold text-ink">{item.title}</h4>
        <p className="text-xs text-ink-secondary leading-relaxed">
          {item.action}
        </p>
      </div>

      <div className="space-y-2">
        <div className="px-3 py-2 rounded-md bg-subtle text-xs text-ink">
          <span className="font-semibold">Direct Impact: </span>
          <span className="font-medium text-success">{item.directImpact}</span>
        </div>

        <MechanismDisclosure explanation={item.whyMechanism} />
      </div>
    </article>
  );
}

export function RoutinePlanner({
  snapshot,
  plan,
  analytics,
}: RoutinePlannerProps) {
  const { exposureWindows } = analytics;

  return (
    <div className="space-y-6">
      {/* Interactive Diurnal Exposure Chart */}
      <HourlyExposureChart
        hourlyForecast={snapshot.hourlyForecast}
        bestWindow={exposureWindows.bestOutdoorWindow}
        worstWindow={exposureWindows.worstSmogWindow}
      />

      {/* Quantified Timing & Aeration Summary Ledger (symmetrical 2-col hairline grid) */}
      <div className="rounded-xl border border-subtle bg-border-subtle gap-px grid grid-cols-1 md:grid-cols-2 overflow-hidden elevation-1">
        <div className="bg-surface p-4 sm:p-5 flex items-start gap-3">
          <div
            className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${NAQI_THEMES.Good.badgeBg}`}
          >
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-ink">
              Temporal Activity Shifting Potential
            </h3>
            <p className="text-xs text-ink-secondary mt-1 leading-relaxed">
              Shifting outdoor errands from peak smog to the cleanest solar window cuts estimated inhaled PM2.5 by{" "}
              <strong className="text-success font-mono tabular-nums font-bold">
                {exposureWindows.pm25ReductionPercent}%
              </strong>
              .
            </p>
          </div>
        </div>

        <div className="bg-surface p-4 sm:p-5 flex items-start gap-3">
          <div
            className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
              exposureWindows.bestVentilationWindow
                ? NAQI_THEMES.Good.badgeBg
                : NAQI_THEMES["Very Poor"].badgeBg
            }`}
          >
            <Wind className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-ink">
              Natural Ventilation Window
            </h3>
            <p className="text-xs text-ink-secondary mt-1 leading-relaxed">
              {exposureWindows.ventilationReason}
            </p>
          </div>
        </div>
      </div>

      {/* Ultra-Scannable 4-Block Diurnal Daypart Posture */}
      <div className="bg-surface border border-subtle rounded-xl elevation-1 overflow-hidden">
        <div className="px-5 py-4 border-b border-subtle">
          <h3 className="font-display text-base font-semibold text-ink">
            Diurnal Daypart Safety Posture
          </h3>
          <p className="text-xs text-ink-muted mt-0.5">
            Wear a fitted N95 above NAQI 200 and shift intense exertion into lower-particulate windows.
          </p>
        </div>

        <div className="bg-border-subtle gap-px grid grid-cols-2 lg:grid-cols-4 border-t border-subtle">
          {(["morning", "afternoon", "evening", "night"] as const).map(
            (dpKey) => {
              const dp = exposureWindows.dayparts[dpKey];
              const dpTheme = getNaqiTheme(dp.dominantCategory);
              const isAvoid = dp.safetyStatus === "avoid_outdoors";
              const isSafe = dp.safetyStatus === "safe";
              const barPct = Math.min(100, Math.max(4, (dp.maxNaqi / 500) * 100));

              return (
                <div
                  key={dpKey}
                  className="p-4 text-xs flex flex-col justify-between gap-3 bg-surface min-w-0"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
                      <span className="font-semibold text-ink text-sm">
                        {dp.label}
                      </span>
                      <span className="text-xs font-mono tabular-nums text-ink-muted">
                        {dp.hoursRange}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-2.5">
                      <span className="font-display text-xl font-bold tabular-nums text-ink">
                        {dp.maxNaqi}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded border text-xs font-semibold ${dpTheme.badgeBg}`}
                      >
                        {dp.dominantCategory}
                      </span>
                    </div>

                    <div className="h-1.5 w-full rounded-full bg-subtle overflow-hidden">
                      <div
                        style={{
                          width: `${barPct}%`,
                          backgroundColor: dpTheme.accentColor,
                        }}
                        className="h-full rounded-full"
                      />
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-subtle flex items-center gap-1.5 font-semibold text-xs">
                    {isSafe ? (
                      <>
                        <ShieldCheck
                          className="w-3.5 h-3.5 text-success shrink-0"
                          aria-hidden="true"
                        />
                        <span className="text-success">
                          {DAYPART_STATUS_CHIP[dp.safetyStatus]}
                        </span>
                      </>
                    ) : isAvoid ? (
                      <>
                        <ShieldAlert
                          className="w-3.5 h-3.5 text-danger shrink-0"
                          aria-hidden="true"
                        />
                        <span className="text-danger">
                          {DAYPART_STATUS_CHIP[dp.safetyStatus]}
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle
                          className="w-3.5 h-3.5 text-warning shrink-0"
                          aria-hidden="true"
                        />
                        <span className="text-warning">
                          {DAYPART_STATUS_CHIP[dp.safetyStatus]}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>

      {/* Chronological Daily Protocol Ledgers with Clean Spaced Grid Cards */}
      <div className="space-y-5">
        {plan.morningRoutine.length > 0 && (
          <section className="bg-surface border border-subtle rounded-xl elevation-1 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-subtle bg-canvas">
              <h3 className="font-display text-base font-semibold text-ink">
                Morning Routine Protocol
              </h3>
            </div>
            <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
              {plan.morningRoutine.map((item, idx) => (
                <ActionRow key={`morning-${idx}`} item={item} />
              ))}
            </div>
          </section>
        )}

        {plan.afternoonRoutine.length > 0 && (
          <section className="bg-surface border border-subtle rounded-xl elevation-1 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-subtle bg-canvas">
              <h3 className="font-display text-base font-semibold text-ink">
                Afternoon Protocol
              </h3>
            </div>
            <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
              {plan.afternoonRoutine.map((item, idx) => (
                <ActionRow key={`afternoon-${idx}`} item={item} />
              ))}
            </div>
          </section>
        )}

        {plan.eveningRoutine.length > 0 && (
          <section className="bg-surface border border-subtle rounded-xl elevation-1 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-subtle bg-canvas">
              <h3 className="font-display text-base font-semibold text-ink">
                Evening Inversion &amp; Night Protocol
              </h3>
            </div>
            <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
              {plan.eveningRoutine.map((item, idx) => (
                <ActionRow key={`evening-${idx}`} item={item} />
              ))}
            </div>
          </section>
        )}
      </div>

      <footer className="p-4 rounded-xl border border-subtle bg-surface text-xs text-ink-muted">
        <p className="leading-relaxed">{plan.disclaimer}</p>
      </footer>
    </div>
  );
}
