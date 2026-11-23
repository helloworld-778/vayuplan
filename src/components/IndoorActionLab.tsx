"use client";

import React from "react";
import {
  AirQualitySnapshot,
  AssistantPlanResponse,
  HouseholdProfile,
} from "@/types/air-quality";
import { ComputedAnalytics } from "@/lib/ai/types";
import { getNaqiTheme } from "@/lib/aqi/theme";
import {
  Home,
  Wind,
  AlertTriangle,
  Lock,
  ArrowDownRight,
  Info,
} from "lucide-react";

interface IndoorActionLabProps {
  snapshot: AirQualitySnapshot;
  profile: HouseholdProfile;
  plan: AssistantPlanResponse;
  analytics: ComputedAnalytics;
}

export function IndoorActionLab({
  snapshot,
  profile,
  plan,
  analytics,
}: IndoorActionLabProps) {
  const { indoorAir, exposureWindows } = analytics;
  const indoorTheme = getNaqiTheme(indoorAir.estimatedIndoorCategory);
  const outdoorTheme = getNaqiTheme(snapshot.category);

  // Ventilation Directive Styling
  const getDirectiveBadge = () => {
    switch (indoorAir.ventilationDirective) {
      case "OPEN_WINDOWS":
        return {
          label: "Open Windows for Natural Aeration",
          badgeClass: "bg-emerald-50 text-emerald-950 border-emerald-300",
          icon: Wind,
        };
      case "BRIEF_VENTILATION":
        return {
          label: "Brief Controlled Aeration (15 min)",
          badgeClass: "bg-amber-50 text-amber-950 border-amber-300",
          icon: AlertTriangle,
        };
      case "SEAL_WINDOWS":
        return {
          label: "Seal All External Windows & Balconies",
          badgeClass: "bg-rose-50 text-rose-950 border-rose-300",
          icon: Lock,
        };
    }
  };

  const directiveConfig = getDirectiveBadge();
  const DirectiveIcon = directiveConfig.icon;

  return (
    <div className="space-y-6">
      {/* Side-by-Side Comparison: Outdoor vs Indoor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ambient Outdoor Box */}
        <div className="bg-[#FFFFFF] border border-[#E2DFD6] rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#5E6470] mb-2">
            <span className="font-bold text-[#14181F]">Ambient Outdoor Atmosphere</span>
            <span className="font-mono text-[11px]">{snapshot.location.name}</span>
          </div>

          <div className="flex items-baseline gap-3 my-2">
            <span className="text-4xl font-extrabold font-mono tabular-nums text-[#14181F]">
              {snapshot.naqi}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded border font-semibold ${outdoorTheme.badgeBg}`}
            >
              {snapshot.category}
            </span>
          </div>

          <div className="text-xs text-[#5E6470] flex items-center justify-between pt-3 border-t border-[#EAE7DF]">
            <span>PM2.5: <strong className="font-mono text-[#14181F]">{snapshot.pollutants.pm25 ?? 0} µg/m³</strong></span>
            <span>Dominant: <strong className="font-mono uppercase text-[#14181F]">{snapshot.dominantPollutant}</strong></span>
          </div>
        </div>

        {/* Estimated Indoor Box */}
        <div className="bg-[#FFFFFF] border border-[#14181F] rounded-lg p-5 shadow-xs relative">
          <div className="flex items-center justify-between text-xs text-[#5E6470] mb-2">
            <span className="font-bold text-[#14181F] flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-[#14181F]" />
              Estimated Indoor Microenvironment
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#FAF9F6] border border-[#DDD9CE]">
              Envelope Physics
            </span>
          </div>

          <div className="flex items-baseline gap-3 my-2">
            <span className="text-4xl font-extrabold font-mono tabular-nums text-[#14181F]">
              {indoorAir.estimatedIndoorNaqi}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded border font-semibold ${indoorTheme.badgeBg}`}
            >
              {indoorAir.estimatedIndoorCategory}
            </span>
          </div>

          <div className="text-xs text-[#5E6470] flex items-center justify-between pt-3 border-t border-[#EAE7DF]">
            <span>Indoor PM2.5: <strong className="font-mono text-[#14181F]">{indoorAir.estimatedIndoorPm25} µg/m³</strong></span>
            <span className="text-[11px]">
              Envelope: <strong className="capitalize text-[#14181F]">{profile.windowsState}</strong>
            </span>
          </div>

          {/* Model disclaimer note */}
          <div className="mt-3 text-[10px] text-[#7A8290] flex items-center gap-1 bg-[#FAF9F6] p-1.5 rounded border border-[#EFECE6]">
            <Info className="w-3 h-3 shrink-0" />
            <span>Mathematical estimate based on residential infiltration factors, not a hardware sensor.</span>
          </div>
        </div>
      </div>

      {/* Prominent Ventilation Directive Banner */}
      <div className={`p-4 sm:p-5 rounded-lg border ${directiveConfig.badgeClass} flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs`}>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded bg-[#FFFFFF] flex items-center justify-center shrink-0 border border-current shadow-2xs">
            <DirectiveIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider font-mono font-bold opacity-80">
              Ventilation Directive
            </div>
            <h3 className="text-base font-bold mt-0.5">
              {directiveConfig.label}
            </h3>
            <p className="text-xs mt-1 leading-relaxed opacity-90 max-w-2xl">
              {indoorAir.ventilationAdvisory}
            </p>
          </div>
        </div>

        {exposureWindows.bestVentilationWindow && (
          <div className="bg-[#FFFFFF] p-3 rounded border border-current text-xs shrink-0 sm:text-right">
            <div className="text-[10px] font-mono text-[#6E7582] uppercase">
              Optimal Aeration Window
            </div>
            <div className="text-sm font-bold font-mono text-[#14181F]">
              {exposureWindows.bestVentilationWindow.startHour.toString().padStart(2, "0")}:00 – {exposureWindows.bestVentilationWindow.endHour.toString().padStart(2, "0")}:00
            </div>
            <div className="text-[10px] text-emerald-800 font-medium">
              Avg NAQI: {exposureWindows.bestVentilationWindow.avgNaqi}
            </div>
          </div>
        )}
      </div>

      {/* Quantified What-If Interventions Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#14181F]">
            Simulated Home Air Interventions
          </h3>
          <span className="text-xs text-[#6E7582]">
            What-if simulations vs. current indoor PM2.5 ({indoorAir.estimatedIndoorPm25} µg/m³)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {indoorAir.interventions.map((item) => (
            <div
              key={item.id}
              className="bg-[#FFFFFF] border border-[#E2DFD6] rounded-md p-4 transition-all hover:border-[#14181F] text-xs flex flex-col justify-between shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <h4 className="font-bold text-[#14181F] text-sm">
                    {item.title}
                  </h4>
                  <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-950 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-300 text-xs">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    -{item.percentReduction}%
                  </span>
                </div>

                <p className="text-[#3A404D] leading-relaxed mb-3">
                  {item.explanation}
                </p>
              </div>

              <div className="pt-2.5 border-t border-[#EAE7DF] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#6E7582] block text-[10px]">Projected Indoor</span>
                  <span className="font-bold font-mono text-[#14181F] text-sm">
                    {item.projectedIndoorPm25} µg/m³
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[#6E7582] block text-[10px]">Net Particulate Saved</span>
                  <span className="font-bold font-mono text-emerald-950 text-sm">
                    {item.pm25SavedUgM3} µg/m³
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Indoor Hacks from Plan */}
      {plan.indoorHacks.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-bold text-[#14181F]">
            Household Clean-Air Protocols
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plan.indoorHacks.map((hack, idx) => (
              <div
                key={idx}
                className="bg-[#FFFFFF] border border-[#E2DFD6] rounded-md p-4 text-xs"
              >
                <div className="font-bold text-[#14181F] text-sm mb-1">
                  {hack.title}
                </div>
                <p className="text-[#2B303B] mb-2 leading-relaxed">
                  {hack.action}
                </p>
                <div className="pt-2 border-t border-[#EAE7DF] text-[#474D58]">
                  <span className="font-semibold text-[#14181F]">Direct Impact: </span>
                  <span className="text-emerald-950 font-medium">{hack.directImpact}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
