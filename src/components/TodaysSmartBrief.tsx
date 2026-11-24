"use client";

import React from "react";
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
        className="h-full bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl p-6 elevation-1 animate-pulse flex flex-col justify-between gap-4"
      >
        <div className="space-y-3">
          <div className="h-5 w-40 bg-[#F1F4F8] rounded" />
          <div className="h-4 w-full bg-[#F1F4F8] rounded" />
          <div className="h-4 w-5/6 bg-[#F1F4F8] rounded" />
        </div>
        <div className="space-y-2.5">
          <div className="h-14 bg-[#F1F4F8] rounded-lg" />
          <div className="h-14 bg-[#F1F4F8] rounded-lg" />
          <div className="h-14 bg-[#F1F4F8] rounded-lg" />
        </div>
      </section>
    );
  }

  if (planError && !plan) {
    return (
      <section
        aria-label="Today's Smart Brief error"
        role="alert"
        className="h-full bg-[#FFFFFF] border border-[#FCA5A5] rounded-xl p-6 elevation-1 flex flex-col justify-center gap-3 text-sm text-[#991B1B]"
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
            className="w-fit inline-flex items-center gap-1.5 px-4 min-h-[40px] rounded-lg bg-[#FEF2F2] border border-[#FCA5A5] hover:border-[#991B1B] text-[#991B1B] text-xs font-semibold transition-colors"
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
        className="h-full bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl p-6 elevation-1 flex flex-col justify-center gap-3 text-sm text-[#525E70]"
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

  const bestWindowLabel = exposureWindows.bestOutdoorWindow
    ? `${exposureWindows.bestOutdoorWindow.startHour
        .toString()
        .padStart(2, "0")}:00–${exposureWindows.bestOutdoorWindow.endHour
        .toString()
        .padStart(2, "0")}:00 IST · ${exposureWindows.pm25ReductionPercent}% lower PM2.5`
    : `Keep outings brief · ${exposureWindows.pm25ReductionPercent}% timing delta`;

  const bestTransitLabel = commuteImpact.recommendedAlternative
    ? `Shift to ${commuteImpact.recommendedAlternative.label} (${commuteImpact.recommendedAlternative.deltaInhaledPm25Percent}% dose · ${
        commuteImpact.recommendedAlternative.monthlyCo2SavedKg >= 0 ? "+" : ""
      }${commuteImpact.recommendedAlternative.monthlyCo2SavedKg} kg CO₂/mo)`
    : profile.currentCommuteMode === "work_from_home"
    ? "Remote / WFH active (0 g transit CO₂)"
    : `N95 respirator cuts commute exposure ${commuteImpact.maskUpgradeImpact.percentSaved}%`;

  const ventilationLabel =
    indoorAir.ventilationDirective === "OPEN_WINDOWS"
      ? `Open windows · Est. ${indoorAir.estimatedIndoorPm25} µg/m³ indoor`
      : indoorAir.ventilationDirective === "BRIEF_VENTILATION"
      ? `Brief 15m airing · Est. ${indoorAir.estimatedIndoorPm25} µg/m³ indoor`
      : `Seal windows · Est. ${indoorAir.estimatedIndoorPm25} µg/m³ indoor`;

  const handleAskAboutBrief = () => {
    const cleanPersona = profile.persona.replaceAll("_", " ");
    onAskCopilot(
      `Walk me through the top actions in today's brief for ${snapshot.location.name} (NAQI ${snapshot.naqi}) given my ${cleanPersona} schedule.`
    );
  };

  return (
    <section
      aria-label="Today's Smart Brief"
      className="h-full bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl elevation-1 p-5 sm:p-6 flex flex-col justify-between gap-4"
    >
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold tracking-tight text-[#0F172A]">
            Today&apos;s Smart Brief
          </h2>

          {isAi ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] text-xs font-semibold">
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

        {isPlanLoading && (
          <p className="mt-2 text-xs font-medium text-[#1D4ED8]">
            Updating synthesis for new household parameters...
          </p>
        )}

        <p className="mt-3 text-sm leading-relaxed text-[#334155]">
          {plan.summary}
        </p>
      </div>

      {/* Top 3 Prioritized Action Jump-Pills */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => onJumpToTab("routine")}
          className="w-full text-left rounded-lg border border-[#DCE3EC] bg-[#F1F4F8] hover:bg-[#EFF6FF] hover:border-[#1D4ED8] px-3.5 py-2.5 min-h-[44px] transition-colors flex items-center justify-between gap-3 group"
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <Clock
              className="w-4 h-4 text-[#334155] group-hover:text-[#1D4ED8] shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <span className="text-xs font-semibold text-[#0F172A] block">
                Best Outdoor Window
              </span>
              <span className="text-xs tabular-nums text-[#334155] block leading-snug">
                {bestWindowLabel}
              </span>
            </div>
          </div>
          <ArrowUpRight
            className="w-4 h-4 text-[#525E70] group-hover:text-[#1D4ED8] shrink-0"
            aria-hidden="true"
          />
        </button>

        <button
          type="button"
          onClick={() => onJumpToTab("commute")}
          className="w-full text-left rounded-lg border border-[#DCE3EC] bg-[#F1F4F8] hover:bg-[#EFF6FF] hover:border-[#1D4ED8] px-3.5 py-2.5 min-h-[44px] transition-colors flex items-center justify-between gap-3 group"
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <TrainFront
              className="w-4 h-4 text-[#334155] group-hover:text-[#1D4ED8] shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <span className="text-xs font-semibold text-[#0F172A] block">
                Best Transit Switch
              </span>
              <span className="text-xs tabular-nums text-[#334155] block leading-snug">
                {bestTransitLabel}
              </span>
            </div>
          </div>
          <ArrowUpRight
            className="w-4 h-4 text-[#525E70] group-hover:text-[#1D4ED8] shrink-0"
            aria-hidden="true"
          />
        </button>

        <button
          type="button"
          onClick={() => onJumpToTab("indoor")}
          className="w-full text-left rounded-lg border border-[#DCE3EC] bg-[#F1F4F8] hover:bg-[#EFF6FF] hover:border-[#1D4ED8] px-3.5 py-2.5 min-h-[44px] transition-colors flex items-center justify-between gap-3 group"
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <Home
              className="w-4 h-4 text-[#334155] group-hover:text-[#1D4ED8] shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <span className="text-xs font-semibold text-[#0F172A] block">
                Indoor Ventilation Directive
              </span>
              <span className="text-xs tabular-nums text-[#334155] block leading-snug">
                {ventilationLabel}
              </span>
            </div>
          </div>
          <ArrowUpRight
            className="w-4 h-4 text-[#525E70] group-hover:text-[#1D4ED8] shrink-0"
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Quick Ask Copilot Trigger */}
      <button
        type="button"
        onClick={handleAskAboutBrief}
        className="w-full inline-flex items-center justify-center gap-2 px-4 min-h-[44px] rounded-lg bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#1D4ED8] border border-[#BFDBFE] text-xs font-semibold transition-colors"
      >
        <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Ask Copilot about this brief</span>
      </button>
    </section>
  );
}
