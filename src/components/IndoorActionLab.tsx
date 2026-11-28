"use client";

import React from "react";
import {
  AirQualitySnapshot,
  AssistantPlanResponse,
  HouseholdProfile,
} from "@/types/air-quality";
import { ComputedAnalytics } from "@/lib/ai/types";
import { getNaqiTheme, NAQI_THEMES } from "@/lib/aqi/theme";
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

  const getDirectiveConfig = () => {
    switch (indoorAir.ventilationDirective) {
      case "OPEN_WINDOWS":
        return {
          label: "Open Windows for Natural Aeration",
          containerClass: NAQI_THEMES.Good.badgeBg,
          cardBorder: NAQI_THEMES.Good.badgeBorder,
          icon: Wind,
        };
      case "BRIEF_VENTILATION":
        return {
          label: "Brief Controlled Aeration (15 min)",
          containerClass: NAQI_THEMES.Moderate.badgeBg,
          cardBorder: NAQI_THEMES.Moderate.badgeBorder,
          icon: AlertTriangle,
        };
      case "SEAL_WINDOWS":
        return {
          label: "Seal All External Windows & Balconies",
          containerClass: NAQI_THEMES["Very Poor"].badgeBg,
          cardBorder: NAQI_THEMES["Very Poor"].badgeBorder,
          icon: Lock,
        };
    }
  };

  const directiveConfig = getDirectiveConfig();
  const DirectiveIcon = directiveConfig.icon;

  return (
    <div className="space-y-6">
      {/* Side-by-Side Outdoor vs Indoor Ledger (symmetrical gap-px track) */}
      <div className="rounded-xl border border-subtle bg-border-subtle gap-px grid grid-cols-1 md:grid-cols-2 overflow-hidden elevation-1">
        <div className="bg-surface p-5 flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center justify-between text-xs text-ink-muted mb-2">
              <span className="font-semibold text-ink">
                Ambient Outdoor Atmosphere
              </span>
              <span className="font-medium text-ink-muted">
                {snapshot.location.name}
              </span>
            </div>

            <div className="flex items-baseline gap-3 my-2">
              <span className="font-display text-4xl font-bold tabular-nums text-ink">
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

          <div className="text-xs text-ink-muted flex items-center justify-between pt-3 border-t border-subtle">
            <span>
              PM2.5:{" "}
              <strong className="font-mono tabular-nums text-ink">
                {snapshot.pollutants.pm25 ?? 0} µg/m³
              </strong>
            </span>
            <span>
              Dominant:{" "}
              <strong className="font-mono uppercase text-ink">
                {snapshot.dominantPollutant}
              </strong>
            </span>
          </div>
        </div>

        <div className="bg-surface p-5 flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center justify-between text-xs text-ink-muted mb-2">
              <span className="font-semibold text-ink flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-ink-secondary" aria-hidden="true" />
                <span>Estimated Indoor Microenvironment</span>
              </span>
              <span className="text-xs text-ink-muted font-medium">
                Envelope Physics
              </span>
            </div>

            <div className="flex items-baseline gap-3 my-2">
              <span className="font-display text-4xl font-bold tabular-nums text-ink">
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

          <div className="space-y-2.5 pt-3 border-t border-subtle">
            <div className="text-xs text-ink-muted flex items-center justify-between">
              <span>
                Indoor PM2.5:{" "}
                <strong className="font-mono tabular-nums text-ink">
                  {indoorAir.estimatedIndoorPm25} µg/m³
                </strong>
              </span>
              <span>
                Envelope:{" "}
                <strong className="capitalize text-ink">
                  {profile.windowsState}
                </strong>
              </span>
            </div>

            <div className="text-xs text-ink-muted flex items-center gap-1.5 bg-subtle px-2.5 py-2 rounded-md">
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
            className={`w-9 h-9 rounded-lg bg-surface flex items-center justify-center shrink-0 border ${directiveConfig.cardBorder}`}
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
            className={`bg-surface p-3 rounded-lg border ${directiveConfig.cardBorder} text-xs shrink-0 sm:text-right`}
          >
            <div className="text-xs text-ink-muted font-medium">
              Optimal Aeration Window
            </div>
            <div className="text-sm font-bold font-mono tabular-nums text-ink mt-0.5">
              {exposureWindows.bestVentilationWindow.startHour
                .toString()
                .padStart(2, "0")}
              :00 –{" "}
              {exposureWindows.bestVentilationWindow.endHour
                .toString()
                .padStart(2, "0")}
              :00
            </div>
            <div className="text-xs font-mono tabular-nums text-success font-semibold">
              Avg NAQI: {exposureWindows.bestVentilationWindow.avgNaqi}
            </div>
          </div>
        )}
      </div>

      {/* Quantified What-If Interventions Ledger */}
      <section className="bg-surface border border-subtle rounded-xl elevation-1 overflow-hidden">
        <div className="px-5 py-4 border-b border-subtle flex flex-wrap items-center justify-between gap-2 bg-canvas">
          <h3 className="font-display text-base font-semibold text-ink">
            Simulated Home Air Interventions
          </h3>
          <span className="text-xs text-ink-muted font-mono tabular-nums">
            Baseline indoor PM2.5: {indoorAir.estimatedIndoorPm25} µg/m³
          </span>
        </div>

        <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          {indoorAir.interventions.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-subtle bg-canvas p-4 sm:p-5 text-xs flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-semibold text-ink text-sm">
                  {item.title}
                </h4>
                <span
                  className={`inline-flex items-center gap-1 font-mono tabular-nums font-bold px-2 py-0.5 rounded border text-xs shrink-0 ${NAQI_THEMES.Good.badgeBg}`}
                >
                  <ArrowDownRight className="w-3.5 h-3.5" aria-hidden="true" />
                  -{item.percentReduction}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-subtle p-2.5 rounded-md">
                  <span className="text-ink-muted block">Projected Indoor</span>
                  <span className="font-bold font-mono tabular-nums text-ink text-sm">
                    {item.projectedIndoorPm25} µg/m³
                  </span>
                </div>

                <div className="bg-subtle p-2.5 rounded-md">
                  <span className="text-ink-muted block">
                    Net Particulate Saved
                  </span>
                  <span className="font-bold font-mono tabular-nums text-success text-sm">
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
        <section className="bg-surface border border-subtle rounded-xl elevation-1 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-subtle bg-canvas">
            <h3 className="font-display text-base font-semibold text-ink">
              Household Clean-Air Protocols
            </h3>
          </div>
          <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
            {plan.indoorHacks.map((hack, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-subtle bg-canvas p-4 sm:p-5 text-xs flex flex-col justify-between gap-3"
              >
                <div>
                  <h4 className="font-semibold text-ink text-sm mb-1.5">
                    {hack.title}
                  </h4>
                  <p className="text-ink-secondary leading-relaxed">
                    {hack.action}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="px-3 py-2 rounded-md bg-subtle text-ink">
                    <span className="font-semibold">Direct Impact: </span>
                    <span className="text-success font-medium">
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
