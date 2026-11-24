"use client";

import React from "react";
import {
  ActionRecommendation,
  AirQualitySnapshot,
  AssistantPlanResponse,
  EffortLevel,
} from "@/types/air-quality";
import { ComputedAnalytics } from "@/lib/ai/types";
import { HourlyExposureChart } from "./HourlyExposureChart";
import {
  Sparkles,
  Cpu,
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

function EffortBadge({ level }: { level: EffortLevel }) {
  switch (level) {
    case "zero_cost":
      return (
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-300 font-medium">
          Zero Cost
        </span>
      );
    case "low_cost":
      return (
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-300 font-medium">
          Low Cost
        </span>
      );
    case "moderate":
      return (
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-300 font-medium">
          Moderate Investment
        </span>
      );
  }
}

function ActionCard({ item }: { item: ActionRecommendation }) {
  return (
    <div className="bg-[#FFFFFF] border border-[#E2DFD6] rounded-md p-4 transition-all hover:border-[#14181F] shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-[#5E6470]" />
          <span className="text-xs font-mono font-semibold text-[#5E6470]">
            {item.timeframe}
          </span>
        </div>
        <EffortBadge level={item.effortLevel} />
      </div>

      <h4 className="text-sm font-bold text-[#14181F] mb-1.5">{item.title}</h4>
      <p className="text-xs text-[#2B303B] leading-relaxed mb-3">{item.action}</p>

      {/* Mechanism & Direct Impact */}
      <div className="pt-2.5 border-t border-[#EAE7DF] space-y-1.5 text-xs">
        <div className="text-[#474D58]">
          <span className="font-semibold text-[#14181F]">Why (Mechanism): </span>
          <span>{item.whyMechanism}</span>
        </div>
        <div className="p-2 rounded bg-[#FAF9F6] border border-[#DDD9CE] text-[#14181F]">
          <span className="font-bold">Direct Impact: </span>
          <span className="font-medium text-emerald-950">{item.directImpact}</span>
        </div>
      </div>
    </div>
  );
}

export function RoutinePlanner({
  snapshot,
  plan,
  analytics,
}: RoutinePlannerProps) {
  const { exposureWindows } = analytics;
  const isAi = plan.mode === "ai";

  return (
    <div className="space-y-6">
      {/* Plan Mode Banner & Executive Summary */}
      <div className="bg-[#FFFFFF] border border-[#E2DFD6] rounded-lg p-5 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            {isAi ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#EBF5FB] text-[#1B4F72] border border-[#AED6F1] text-xs font-bold font-mono">
                <Sparkles className="w-3.5 h-3.5 text-[#2980B9]" />
                Gemini AI
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F4F6F6] text-[#2C3E50] border border-[#D5D8DC] text-xs font-bold font-mono"
                title={
                  plan.fallbackReason
                    ? `Fallback reason: ${plan.fallbackReason}`
                    : undefined
                }
                data-fallback-reason={plan.fallbackReason}
              >
                <Cpu className="w-3.5 h-3.5 text-[#34495E]" />
                Deterministic Physics Fallback
              </span>
            )}
            {!isAi && plan.fallbackReason && (
              <span className="text-[11px] font-mono text-[#6E7582]">
                ({plan.fallbackReason})
              </span>
            )}
            <span className="text-xs text-[#6E7582]">
              Grounded in CPCB NAQI & peer-reviewed microenvironment factors
            </span>
          </div>
        </div>

        <p className="text-sm text-[#14181F] font-medium leading-relaxed">
          {plan.summary}
        </p>
      </div>

      {/* Exposure Chart */}
      <HourlyExposureChart
        hourlyForecast={snapshot.hourlyForecast}
        bestWindow={exposureWindows.bestOutdoorWindow}
        worstWindow={exposureWindows.worstSmogWindow}
      />

      {/* Quantified Callouts Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Shifting Outdoor Activity */}
        <div className="bg-[#FAF9F6] border border-[#E2DFD6] rounded-lg p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded bg-emerald-100 border border-emerald-300 text-emerald-900 flex items-center justify-center shrink-0">
            <ArrowRight className="w-4 h-4 text-emerald-800" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#14181F] block">
              Temporal Activity Shifting Potential
            </span>
            <p className="text-xs text-[#474D58] mt-1 leading-relaxed">
              Shifting outdoor errands from the peak smog window to the cleanest solar window achieves an estimated{" "}
              <strong className="text-emerald-900 font-mono font-bold">
                {exposureWindows.pm25ReductionPercent}% reduction
              </strong>{" "}
              in inhaled PM2.5.
            </p>
          </div>
        </div>

        {/* Ventilation Window Status */}
        <div className="bg-[#FAF9F6] border border-[#E2DFD6] rounded-lg p-4 flex items-start gap-3">
          <div
            className={`w-8 h-8 rounded border flex items-center justify-center shrink-0 ${
              exposureWindows.bestVentilationWindow
                ? "bg-emerald-100 border-emerald-300 text-emerald-900"
                : "bg-rose-100 border-rose-300 text-rose-900"
            }`}
          >
            <Wind className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#14181F] block">
              Natural Ventilation Window
            </span>
            <p className="text-xs text-[#474D58] mt-1 leading-relaxed">
              {exposureWindows.ventilationReason}
            </p>
          </div>
        </div>
      </div>

      {/* 4 Daypart Posture Strip */}
      <div className="bg-[#FFFFFF] border border-[#E2DFD6] rounded-lg p-4 sm:p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#14181F] mb-3">
          Diurnal Daypart Safety Posture
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(["morning", "afternoon", "evening", "night"] as const).map((dpKey) => {
            const dp = exposureWindows.dayparts[dpKey];
            const isAvoid = dp.safetyStatus === "avoid_outdoors";
            const isSafe = dp.safetyStatus === "safe";

            return (
              <div
                key={dpKey}
                className="p-3 rounded border border-[#EAE7DF] bg-[#FAF9F6] text-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-[#14181F]">{dp.label}</span>
                    <span className="text-[10px] font-mono text-[#7A8290]">
                      {dp.hoursRange}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-lg font-bold font-mono text-[#14181F]">
                      {dp.maxNaqi}
                    </span>
                    <span className="text-[10px] font-mono text-[#5E6470]">
                      max NAQI ({dp.dominantCategory})
                    </span>
                  </div>

                  <p className="text-[11px] text-[#474D58] line-clamp-3">
                    {dp.advisory}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-[#DDD9CE] flex items-center gap-1.5 font-semibold text-[11px]">
                  {isSafe ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-900">Safe Outdoors</span>
                    </>
                  ) : isAvoid ? (
                    <>
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                      <span className="text-rose-900">Avoid Outdoor Exposure</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-amber-900">Exercise Caution</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Routine Recommendations */}
      <div className="space-y-6">
        {/* Morning */}
        {plan.morningRoutine.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-[#14181F] mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Morning Routine Protocol</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plan.morningRoutine.map((item, idx) => (
                <ActionCard key={`morning-${idx}`} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Afternoon */}
        {plan.afternoonRoutine.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-[#14181F] mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Afternoon Protocol</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plan.afternoonRoutine.map((item, idx) => (
                <ActionCard key={`afternoon-${idx}`} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Evening */}
        {plan.eveningRoutine.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-[#14181F] mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span>Evening Inversion & Night Protocol</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plan.eveningRoutine.map((item, idx) => (
                <ActionCard key={`evening-${idx}`} item={item} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Health Disclaimer */}
      <footer className="p-4 rounded border border-[#E2DFD6] bg-[#FAF8F5] text-xs text-[#6E7582]">
        <p className="leading-relaxed">{plan.disclaimer}</p>
      </footer>
    </div>
  );
}
