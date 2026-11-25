"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Cpu,
  Clock,
  TrainFront,
  Home,
  ArrowUpRight,
  MessageSquare,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  AirQualitySnapshot,
  AssistantPlanResponse,
  HouseholdProfile,
} from "@/types/air-quality";
import { ComputedAnalytics } from "@/lib/ai/types";

export type AnalyticalTabKey = "routine" | "commute" | "indoor";

interface TodaysSmartBriefProps {
  snapshot: AirQualitySnapshot;
  profile: HouseholdProfile;
  plan: AssistantPlanResponse | null;
  analytics: ComputedAnalytics | null;
  isPlanLoading: boolean;
  planError?: string | null;
  onRetryPlan?: () => void;
  onJumpToTab: (tab: AnalyticalTabKey) => void;
  onAskCopilot: (prompt: string) => void;
}

function conciseSummary(raw: string): string {
  const sentences = raw
    .trim()
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);
  if (sentences.length <= 3) return raw.trim();
  return sentences.slice(0, 3).join(" ");
}

export function TodaysSmartBrief({
  snapshot,
  profile,
  plan,
  analytics,
  isPlanLoading,
  planError = null,
  onRetryPlan,
  onJumpToTab,
  onAskCopilot,
}: TodaysSmartBriefProps) {
  if (isPlanLoading && !plan) {
    return (
      <section
        aria-label="Today's Smart Brief loading"
        className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl overflow-hidden elevation-1 animate-pulse"
      >
        <div className="h-1 bg-[#1D4ED8]/40" />
        <div className="p-6 space-y-4">
          <div className="h-5 w-40 bg-[#F1F4F8] rounded" />
          <div className="h-4 w-full bg-[#F1F4F8] rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="h-20 bg-[#F1F4F8] rounded-lg" />
            <div className="h-20 bg-[#F1F4F8] rounded-lg" />
            <div className="h-20 bg-[#F1F4F8] rounded-lg" />
          </div>
        </div>
      </section>
    );
  }

  if (planError && !plan) {
    return (
      <section
        aria-label="Today's Smart Brief error"
        role="alert"
        className="bg-[#FFFFFF] border border-[#FCA5A5] rounded-xl p-6 elevation-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm text-[#991B1B]"
      >
        <div className="flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h2 className="font-display text-base font-semibold text-[#0F172A]">
              Smart Brief Unavailable
            </h2>
            <p className="mt-1 text-xs text-[#991B1B] leading-relaxed">
              {planError}
            </p>
          </div>
        </div>
        {onRetryPlan && (
          <button
            type="button"
            onClick={onRetryPlan}
            className="w-fit inline-flex items-center gap-1.5 px-4 min-h-[40px] rounded-lg bg-[#FEF2F2] border border-[#FCA5A5] hover:border-[#991B1B] text-[#991B1B] text-xs font-semibold transition-colors shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Retry Plan Synthesis</span>
          </button>
        )}
      </section>
    );
  }

  if (!plan || !analytics) {
    return (
      <section
        aria-label="Today's Smart Brief"
        className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl p-6 elevation-1 flex flex-wrap items-center justify-between gap-3 text-sm text-[#525E70]"
      >
        <p>Smart brief unavailable. Refresh telemetry or retry plan calculation.</p>
        {onRetryPlan && (
          <button
            type="button"
            onClick={onRetryPlan}
            className="w-fit inline-flex items-center gap-1.5 px-3.5 min-h-[40px] rounded-lg border border-[#64748B]/70 bg-[#FFFFFF] text-[#0F172A] text-xs font-semibold hover:border-[#1D4ED8] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#1D4ED8]" aria-hidden="true" />
            <span>Generate Brief</span>
          </button>
        )}
      </section>
    );
  }

  const isAi = plan.mode === "ai";
  const { exposureWindows, commuteImpact, indoorAir } = analytics;

  const outdoorImpactMetric = `-${exposureWindows.pm25ReductionPercent}% PM2.5`;
  const outdoorDetail = exposureWindows.bestOutdoorWindow
    ? `${exposureWindows.bestOutdoorWindow.startHour
        .toString()
        .padStart(2, "0")}:00–${exposureWindows.bestOutdoorWindow.endHour
        .toString()
        .padStart(2, "0")}:00 IST window`
    : "Minimize peak outdoor hours";

  const transitImpactMetric = commuteImpact.recommendedAlternative
    ? `${commuteImpact.recommendedAlternative.monthlyCo2SavedKg >= 0 ? "+" : ""}${
        commuteImpact.recommendedAlternative.monthlyCo2SavedKg
      } kg CO₂/mo`
    : profile.currentCommuteMode === "work_from_home"
    ? "0 g Transit CO₂"
    : `-${commuteImpact.maskUpgradeImpact.percentSaved}% Dose`;

  const transitDetail = commuteImpact.recommendedAlternative
    ? `Shift to ${commuteImpact.recommendedAlternative.label} (${commuteImpact.recommendedAlternative.deltaInhaledPm25Percent}% dose)`
    : profile.currentCommuteMode === "work_from_home"
    ? "Remote work active today"
    : "Upgrading to fitted N95";

  const indoorImpactMetric =
    indoorAir.ventilationDirective === "OPEN_WINDOWS"
      ? "Open Windows"
      : indoorAir.ventilationDirective === "BRIEF_VENTILATION"
      ? "Brief 15m Airing"
      : "Seal Windows";

  const indoorDetail = `Est. ${indoorAir.estimatedIndoorPm25} µg/m³ indoor`;

  const handleAskAboutBrief = () => {
    const cleanPersona = profile.persona.replaceAll("_", " ");
    onAskCopilot(
      `Walk me through the top actions in today's brief for ${snapshot.location.name} (NAQI ${snapshot.naqi}) given my ${cleanPersona} schedule.`
    );
  };

  return (
    <section
      aria-label="Today's Smart Brief"
      className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl elevation-1 overflow-hidden"
    >
      {/* Atmospheric Cobalt Top Accent Bar */}
      <div aria-hidden="true" className="h-1 bg-[#1D4ED8]" />

      <div className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="font-display text-lg font-semibold tracking-tight text-[#0F172A]">
              Today&apos;s Smart Brief
            </h2>

            {isAi ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] text-xs font-semibold">
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1D4ED8] opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1D4ED8]" />
                </span>
                <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Gemini AI</span>
              </span>
            ) : (
              <span
                data-fallback-reason={plan.fallbackReason}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F1F4F8] text-[#334155] border border-[#DCE3EC] text-xs font-semibold"
              >
                <Cpu className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Deterministic Physics Fallback</span>
              </span>
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleAskAboutBrief}
            className="inline-flex items-center justify-center gap-2 px-3.5 min-h-[40px] rounded-lg bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#1D4ED8] border border-[#BFDBFE] text-xs font-semibold transition-colors shrink-0"
          >
            <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Ask Copilot about this brief</span>
          </motion.button>
        </div>

        {isPlanLoading && (
          <p className="text-xs font-medium text-[#1D4ED8]">
            Updating synthesis for updated household parameters...
          </p>
        )}

        <p className="text-sm leading-relaxed text-[#334155] max-w-3xl">
          {conciseSummary(plan.summary)}
        </p>

        {/* Top 3 Prioritized Impact Cards (Responsive 3-col strip with zero clipping) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => onJumpToTab("routine")}
            className="min-w-0 text-left rounded-lg border border-[#DCE3EC] bg-[#F1F4F8] hover:bg-[#EFF6FF] hover:border-[#1D4ED8] p-3.5 min-h-[44px] transition-colors flex flex-col justify-between gap-2 group"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#525E70] group-hover:text-[#1D4ED8]">
                <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Best Outdoor Window</span>
              </span>
              <ArrowUpRight
                className="w-3.5 h-3.5 text-[#525E70] group-hover:text-[#1D4ED8] shrink-0"
                aria-hidden="true"
              />
            </div>
            <div>
              <div className="font-mono tabular-nums text-base font-bold text-[#0F172A]">
                {outdoorImpactMetric}
              </div>
              <div className="text-xs tabular-nums text-[#334155] mt-0.5 leading-snug">
                {outdoorDetail}
              </div>
            </div>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => onJumpToTab("commute")}
            className="min-w-0 text-left rounded-lg border border-[#DCE3EC] bg-[#F1F4F8] hover:bg-[#EFF6FF] hover:border-[#1D4ED8] p-3.5 min-h-[44px] transition-colors flex flex-col justify-between gap-2 group"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#525E70] group-hover:text-[#1D4ED8]">
                <TrainFront className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Best Transit Switch</span>
              </span>
              <ArrowUpRight
                className="w-3.5 h-3.5 text-[#525E70] group-hover:text-[#1D4ED8] shrink-0"
                aria-hidden="true"
              />
            </div>
            <div>
              <div className="font-mono tabular-nums text-base font-bold text-[#065F46]">
                {transitImpactMetric}
              </div>
              <div className="text-xs tabular-nums text-[#334155] mt-0.5 leading-snug">
                {transitDetail}
              </div>
            </div>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => onJumpToTab("indoor")}
            className="min-w-0 text-left rounded-lg border border-[#DCE3EC] bg-[#F1F4F8] hover:bg-[#EFF6FF] hover:border-[#1D4ED8] p-3.5 min-h-[44px] transition-colors flex flex-col justify-between gap-2 group"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#525E70] group-hover:text-[#1D4ED8]">
                <Home className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Indoor Ventilation Directive</span>
              </span>
              <ArrowUpRight
                className="w-3.5 h-3.5 text-[#525E70] group-hover:text-[#1D4ED8] shrink-0"
                aria-hidden="true"
              />
            </div>
            <div>
              <div className="font-display text-base font-bold text-[#0F172A]">
                {indoorImpactMetric}
              </div>
              <div className="text-xs tabular-nums text-[#334155] mt-0.5 leading-snug">
                {indoorDetail}
              </div>
            </div>
          </motion.button>
        </div>
      </div>
    </section>
  );
}
