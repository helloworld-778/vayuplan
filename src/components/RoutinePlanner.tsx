"use client";

import React from "react";
import {
  ActionRecommendation,
  AirQualitySnapshot,
  AssistantPlanResponse,
  EffortLevel,
} from "@/types/air-quality";
import { ComputedAnalytics } from "@/lib/ai/types";
import { getNaqiTheme } from "@/lib/aqi/theme";
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
        <span className="text-xs px-2 py-0.5 rounded bg-[#ECFDF5] text-[#065F46] border border-[#6EE7B7] font-medium">
          Zero Cost
        </span>
      );
    case "low_cost":
      return (
        <span className="text-xs px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] font-medium">
          Low Cost
        </span>
      );
    case "moderate":
      return (
        <span className="text-xs px-2 py-0.5 rounded bg-[#FFFBEB] text-[#92400E] border border-[#FCD34D] font-medium">
          Moderate Investment
        </span>
      );
  }
}

function ActionRow({ item }: { item: ActionRecommendation }) {
  return (
    <article className="p-4 sm:p-5 flex flex-col justify-between gap-3">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#525E70]" aria-hidden="true" />
            <span className="text-xs font-mono tabular-nums font-semibold text-[#525E70]">
              {item.timeframe}
            </span>
          </div>
          <EffortBadge level={item.effortLevel} />
        </div>

        <h4 className="text-sm font-semibold text-[#0F172A]">{item.title}</h4>
        <p className="text-xs text-[#334155] leading-relaxed">{item.action}</p>
      </div>

      <div className="space-y-2">
        <div className="px-3 py-2 rounded-md bg-[#F1F4F8] text-xs text-[#0F172A]">
          <span className="font-semibold">Direct Impact: </span>
          <span className="font-medium text-[#065F46]">{item.directImpact}</span>
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

      {/* Quantified Timing & Aeration Summary Ledger */}
      <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl elevation-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#DCE3EC]">
        <div className="p-4 sm:p-5 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#ECFDF5] border border-[#6EE7B7] text-[#065F46] flex items-center justify-center shrink-0">
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-[#0F172A]">
              Temporal Activity Shifting Potential
            </h3>
            <p className="text-xs text-[#334155] mt-1 leading-relaxed">
              Shifting outdoor errands from peak smog to the cleanest solar window cuts estimated inhaled PM2.5 by{" "}
              <strong className="text-[#065F46] font-mono tabular-nums font-bold">
                {exposureWindows.pm25ReductionPercent}%
              </strong>
              .
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 flex items-start gap-3">
          <div
            className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
              exposureWindows.bestVentilationWindow
                ? "bg-[#ECFDF5] border-[#6EE7B7] text-[#065F46]"
                : "bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]"
            }`}
          >
            <Wind className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-[#0F172A]">
              Natural Ventilation Window
            </h3>
            <p className="text-xs text-[#334155] mt-1 leading-relaxed">
              {exposureWindows.ventilationReason}
            </p>
          </div>
        </div>
      </div>

      {/* Ultra-Scannable 4-Block Diurnal Daypart Posture (No repeated paragraphs) */}
      <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl elevation-1 overflow-hidden">
        <div className="px-5 py-4 border-b border-[#DCE3EC]">
          <h3 className="font-display text-base font-semibold text-[#0F172A]">
            Diurnal Daypart Safety Posture
          </h3>
          <p className="text-xs text-[#525E70] mt-0.5">
            Wear a fitted N95 above NAQI 200 and shift intense exertion into lower-particulate windows.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-[#DCE3EC]">
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
                  className="p-4 text-xs flex flex-col justify-between gap-3 bg-[#FFFFFF] min-w-0"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
                      <span className="font-semibold text-[#0F172A] text-sm">
                        {dp.label}
                      </span>
                      <span className="text-xs font-mono tabular-nums text-[#525E70]">
                        {dp.hoursRange}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-2.5">
                      <span className="font-display text-xl font-bold tabular-nums text-[#0F172A]">
                        {dp.maxNaqi}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded border text-xs font-semibold ${dpTheme.badgeBg}`}
                      >
                        {dp.dominantCategory}
                      </span>
                    </div>

                    <div className="h-1.5 w-full rounded-full bg-[#F1F4F8] overflow-hidden">
                      <div
                        style={{
                          width: `${barPct}%`,
                          backgroundColor: dpTheme.accentColor,
                        }}
                        className="h-full rounded-full"
                      />
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-[#DCE3EC] flex items-center gap-1.5 font-semibold text-xs">
                    {isSafe ? (
                      <>
                        <ShieldCheck
                          className="w-3.5 h-3.5 text-[#065F46] shrink-0"
                          aria-hidden="true"
                        />
                        <span className="text-[#065F46]">
                          {DAYPART_STATUS_CHIP[dp.safetyStatus]}
                        </span>
                      </>
                    ) : isAvoid ? (
                      <>
                        <ShieldAlert
                          className="w-3.5 h-3.5 text-[#991B1B] shrink-0"
                          aria-hidden="true"
                        />
                        <span className="text-[#991B1B]">
                          {DAYPART_STATUS_CHIP[dp.safetyStatus]}
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle
                          className="w-3.5 h-3.5 text-[#92400E] shrink-0"
                          aria-hidden="true"
                        />
                        <span className="text-[#92400E]">
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

      {/* Chronological Daily Protocol Ledgers with Expandable "Why this works" */}
      <div className="space-y-5">
        {plan.morningRoutine.length > 0 && (
          <section className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl elevation-1 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#DCE3EC] bg-[#F7F8FA]">
              <h3 className="font-display text-base font-semibold text-[#0F172A]">
                Morning Routine Protocol
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#DCE3EC]">
              {plan.morningRoutine.map((item, idx) => (
                <ActionRow key={`morning-${idx}`} item={item} />
              ))}
            </div>
          </section>
        )}

        {plan.afternoonRoutine.length > 0 && (
          <section className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl elevation-1 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#DCE3EC] bg-[#F7F8FA]">
              <h3 className="font-display text-base font-semibold text-[#0F172A]">
                Afternoon Protocol
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#DCE3EC]">
              {plan.afternoonRoutine.map((item, idx) => (
                <ActionRow key={`afternoon-${idx}`} item={item} />
              ))}
            </div>
          </section>
        )}

        {plan.eveningRoutine.length > 0 && (
          <section className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl elevation-1 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#DCE3EC] bg-[#F7F8FA]">
              <h3 className="font-display text-base font-semibold text-[#0F172A]">
                Evening Inversion &amp; Night Protocol
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#DCE3EC]">
              {plan.eveningRoutine.map((item, idx) => (
                <ActionRow key={`evening-${idx}`} item={item} />
              ))}
            </div>
          </section>
        )}
      </div>

      <footer className="p-4 rounded-xl border border-[#DCE3EC] bg-[#FFFFFF] text-xs text-[#525E70]">
        <p className="leading-relaxed">{plan.disclaimer}</p>
      </footer>
    </div>
  );
}
