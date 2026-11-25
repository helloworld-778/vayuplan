"use client";

import React from "react";
import {
  AirQualitySnapshot,
  AssistantPlanResponse,
  HouseholdProfile,
} from "@/types/air-quality";
import { ComputedAnalytics } from "@/lib/ai/types";
import { getNaqiTheme } from "@/lib/aqi/theme";
import { MechanismDisclosure } from "./MechanismDisclosure";
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
  const IndoorIcon = indoorTheme.icon;
  const OutdoorIcon = outdoorTheme.icon;

  const getDirectiveBadge = () => {
    switch (indoorAir.ventilationDirective) {
      case "OPEN_WINDOWS":
        return {
          label: "Open Windows for Natural Aeration",
          containerClass: "bg-[#ECFDF5] text-[#065F46] border-[#6EE7B7]",
          cardBorder: "border-[#6EE7B7]",
          icon: Wind,
        };
      case "BRIEF_VENTILATION":
        return {
          label: "Brief Controlled Aeration (15 min)",
          containerClass: "bg-[#FFFBEB] text-[#92400E] border-[#FCD34D]",
          cardBorder: "border-[#FCD34D]",
          icon: AlertTriangle,
        };
      case "SEAL_WINDOWS":
        return {
          label: "Seal All External Windows & Balconies",
          containerClass: "bg-[#FEF2F2] text-[#991B1B] border-[#FCA5A5]",
          cardBorder: "border-[#FCA5A5]",
          icon: Lock,
        };
    }
  };

  const directiveConfig = getDirectiveBadge();
  const DirectiveIcon = directiveConfig.icon;

  return (
    <div className="space-y-6">
      {/* Side-by-Side Outdoor vs Indoor Ledger */}
      <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl elevation-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#DCE3EC] overflow-hidden">
        <div className="p-5 flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center justify-between text-xs text-[#525E70] mb-2">
              <span className="font-semibold text-[#0F172A]">
                Ambient Outdoor Atmosphere
              </span>
              <span className="font-medium text-[#525E70]">
                {snapshot.location.name}
              </span>
            </div>

            <div className="flex items-baseline gap-3 my-2">
              <span className="font-display text-4xl font-bold tabular-nums text-[#0F172A]">
                {snapshot.naqi}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded border font-semibold ${outdoorTheme.badgeBg}`}
              >
                <OutdoorIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{snapshot.category}</span>
              </span>
            </div>
          </div>

          <div className="text-xs text-[#525E70] flex items-center justify-between pt-3 border-t border-[#DCE3EC]">
            <span>
              PM2.5:{" "}
              <strong className="font-mono tabular-nums text-[#0F172A]">
                {snapshot.pollutants.pm25 ?? 0} µg/m³
              </strong>
            </span>
            <span>
              Dominant:{" "}
              <strong className="font-mono uppercase text-[#0F172A]">
                {snapshot.dominantPollutant}
              </strong>
            </span>
          </div>
        </div>

        <div className="p-5 flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center justify-between text-xs text-[#525E70] mb-2">
              <span className="font-semibold text-[#0F172A] flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-[#334155]" aria-hidden="true" />
                <span>Estimated Indoor Microenvironment</span>
              </span>
              <span className="text-xs text-[#525E70] font-medium">
                Envelope Physics
              </span>
            </div>

            <div className="flex items-baseline gap-3 my-2">
              <span className="font-display text-4xl font-bold tabular-nums text-[#0F172A]">
                {indoorAir.estimatedIndoorNaqi}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded border font-semibold ${indoorTheme.badgeBg}`}
              >
                <IndoorIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{indoorAir.estimatedIndoorCategory}</span>
              </span>
            </div>
          </div>

          <div className="space-y-2.5 pt-3 border-t border-[#DCE3EC]">
            <div className="text-xs text-[#525E70] flex items-center justify-between">
              <span>
                Indoor PM2.5:{" "}
                <strong className="font-mono tabular-nums text-[#0F172A]">
                  {indoorAir.estimatedIndoorPm25} µg/m³
                </strong>
              </span>
              <span>
                Envelope:{" "}
                <strong className="capitalize text-[#0F172A]">
                  {profile.windowsState}
                </strong>
              </span>
            </div>

            <div className="text-xs text-[#525E70] flex items-center gap-1.5 bg-[#F1F4F8] px-2.5 py-2 rounded-md">
              <Info className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>
                Mathematical estimate based on infiltration factors, not a physical sensor.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ventilation Directive Banner */}
      <div
        className={`p-5 rounded-xl border ${directiveConfig.containerClass} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-9 h-9 rounded-lg bg-[#FFFFFF] flex items-center justify-center shrink-0 border ${directiveConfig.cardBorder}`}
          >
            <DirectiveIcon className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold">
              {directiveConfig.label}
            </h3>
            <p className="text-xs mt-1 leading-relaxed max-w-2xl">
              {indoorAir.ventilationAdvisory}
            </p>
          </div>
        </div>

        {exposureWindows.bestVentilationWindow && (
          <div
            className={`bg-[#FFFFFF] p-3 rounded-lg border ${directiveConfig.cardBorder} text-xs shrink-0 sm:text-right`}
          >
            <div className="text-xs text-[#525E70] font-medium">
              Optimal Aeration Window
            </div>
            <div className="text-sm font-bold font-mono tabular-nums text-[#0F172A] mt-0.5">
              {exposureWindows.bestVentilationWindow.startHour
                .toString()
                .padStart(2, "0")}
              :00 –{" "}
              {exposureWindows.bestVentilationWindow.endHour
                .toString()
                .padStart(2, "0")}
              :00
            </div>
            <div className="text-xs font-mono tabular-nums text-[#065F46] font-semibold">
              Avg NAQI: {exposureWindows.bestVentilationWindow.avgNaqi}
            </div>
          </div>
        )}
      </div>

      {/* Quantified What-If Interventions Ledger with Progressive Disclosure */}
      <section className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl elevation-1 overflow-hidden">
        <div className="px-5 py-4 border-b border-[#DCE3EC] flex flex-wrap items-center justify-between gap-2 bg-[#F7F8FA]">
          <h3 className="font-display text-base font-semibold text-[#0F172A]">
            Simulated Home Air Interventions
          </h3>
          <span className="text-xs text-[#525E70] font-mono tabular-nums">
            Baseline indoor PM2.5: {indoorAir.estimatedIndoorPm25} µg/m³
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#DCE3EC]">
          {indoorAir.interventions.map((item) => (
            <div
              key={item.id}
              className="p-5 text-xs flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-semibold text-[#0F172A] text-sm">
                  {item.title}
                </h4>
                <span className="inline-flex items-center gap-1 font-mono tabular-nums font-bold text-[#065F46] px-2 py-0.5 rounded bg-[#ECFDF5] border border-[#6EE7B7] text-xs shrink-0">
                  <ArrowDownRight className="w-3.5 h-3.5" aria-hidden="true" />
                  -{item.percentReduction}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-[#F1F4F8] p-2.5 rounded-md">
                  <span className="text-[#525E70] block">Projected Indoor</span>
                  <span className="font-bold font-mono tabular-nums text-[#0F172A] text-sm">
                    {item.projectedIndoorPm25} µg/m³
                  </span>
                </div>

                <div className="bg-[#F1F4F8] p-2.5 rounded-md">
                  <span className="text-[#525E70] block">
                    Net Particulate Saved
                  </span>
                  <span className="font-bold font-mono tabular-nums text-[#065F46] text-sm">
                    {item.pm25SavedUgM3} µg/m³
                  </span>
                </div>
              </div>

              <MechanismDisclosure explanation={item.explanation} />
            </div>
          ))}
        </div>
      </section>

      {/* Household Clean-Air Protocols */}
      {plan.indoorHacks.length > 0 && (
        <section className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl elevation-1 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#DCE3EC] bg-[#F7F8FA]">
            <h3 className="font-display text-base font-semibold text-[#0F172A]">
              Household Clean-Air Protocols
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#DCE3EC]">
            {plan.indoorHacks.map((hack, idx) => (
              <div
                key={idx}
                className="p-4 sm:p-5 text-xs flex flex-col justify-between gap-3"
              >
                <div>
                  <h4 className="font-semibold text-[#0F172A] text-sm mb-1.5">
                    {hack.title}
                  </h4>
                  <p className="text-[#334155] leading-relaxed">{hack.action}</p>
                </div>

                <div className="space-y-2">
                  <div className="px-3 py-2 rounded-md bg-[#F1F4F8] text-[#0F172A]">
                    <span className="font-semibold">Direct Impact: </span>
                    <span className="text-[#065F46] font-medium">
                      {hack.directImpact}
                    </span>
                  </div>

                  <MechanismDisclosure explanation={hack.whyMechanism} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
