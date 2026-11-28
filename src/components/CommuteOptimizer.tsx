"use client";

import React from "react";
import {
  AirQualitySnapshot,
  AssistantPlanResponse,
  HouseholdProfile,
  MaskType,
} from "@/types/air-quality";
import { ComputedAnalytics } from "@/lib/ai/types";
import { getCommuteModeLabel } from "@/lib/calculators/commute-impact";
import { MechanismDisclosure } from "./MechanismDisclosure";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

interface CommuteOptimizerProps {
  snapshot: AirQualitySnapshot;
  profile: HouseholdProfile;
  plan: AssistantPlanResponse;
  analytics: ComputedAnalytics;
}

const MASK_DISPLAY: Record<MaskType, string> = {
  none: "No mask",
  cloth: "Cloth",
  surgical: "Surgical",
  n95: "N95",
};

export function CommuteOptimizer({
  snapshot,
  profile,
  plan,
  analytics,
}: CommuteOptimizerProps) {
  const { commuteImpact } = analytics;
  const isHighSmog = snapshot.naqi > 200;

  return (
    <div className="space-y-6">
      {/* Unified Two-Column Insights Sheet (symmetrical gap-px track) */}
      <div className="rounded-xl border border-subtle bg-border-subtle gap-px grid grid-cols-1 md:grid-cols-2 overflow-hidden elevation-1">
        {commuteImpact.recommendedAlternative ? (
          <div className="bg-surface p-5 flex flex-col justify-between gap-4">
            <div>
              <h3 className="font-display text-base font-semibold text-ink">
                Switch to {commuteImpact.recommendedAlternative.label}
              </h3>
              <p className="text-xs text-ink-muted mt-0.5">
                vs. {getCommuteModeLabel(profile.currentCommuteMode)}
              </p>

              <p className="mt-2.5 text-xs text-ink-secondary leading-relaxed">
                {commuteImpact.recommendedAlternative.healthAdvisory}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-subtle text-xs">
              <div className="bg-subtle p-3 rounded-lg">
                <div className="text-xs text-ink-muted">Monthly CO₂ Saved</div>
                <div className="mt-0.5 text-lg font-bold font-mono tabular-nums text-success">
                  {commuteImpact.recommendedAlternative.monthlyCo2SavedKg} kg
                </div>
                <div className="text-xs text-ink-muted">22 workdays / mo</div>
              </div>

              <div className="bg-subtle p-3 rounded-lg">
                <div className="text-xs text-ink-muted">Inhaled PM2.5 Delta</div>
                <div className="mt-0.5 text-lg font-bold font-mono tabular-nums text-ink">
                  {commuteImpact.recommendedAlternative.deltaInhaledPm25Percent}%
                </div>
                <div className="text-xs text-ink-muted">per round-trip</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-surface p-5 flex flex-col justify-center gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2
                className="w-4 h-4 text-success shrink-0"
                aria-hidden="true"
              />
              <h3 className="font-display text-base font-semibold text-ink">
                Already at Optimal Transit Baseline
              </h3>
            </div>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Remote work or zero-emission travel is active. No motorized switch required.
            </p>
          </div>
        )}

        <div className="bg-surface p-5 flex flex-col justify-between gap-4">
          <div>
            <h3 className="font-display text-base font-semibold text-ink">
              N95 Respirator Upgrade Impact
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Personal respiratory shield across roadside corridors
            </p>

            <p className="mt-2.5 text-xs text-ink-secondary leading-relaxed">
              {commuteImpact.maskUpgradeImpact.explanation}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-subtle text-xs">
            <div className="bg-subtle p-3 rounded-lg">
              <div className="text-xs text-ink-muted">Dose Reduction</div>
              <div className="mt-0.5 text-lg font-bold font-mono tabular-nums text-success">
                {commuteImpact.maskUpgradeImpact.percentSaved}%
              </div>
              <div className="text-xs text-ink-muted">
                {profile.maskType === "n95"
                  ? "N95 baseline active"
                  : `${MASK_DISPLAY[profile.maskType]} → N95`}
              </div>
            </div>

            <div className="bg-subtle p-3 rounded-lg">
              <div className="text-xs text-ink-muted">PM2.5 Saved</div>
              <div className="mt-0.5 text-lg font-bold font-mono tabular-nums text-ink">
                {commuteImpact.maskUpgradeImpact.savedInhaledUg} µg
              </div>
              <div className="text-xs text-ink-muted">per round-trip</div>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Active Transit Warning when NAQI > 200 */}
      {isHighSmog && (
        <div
          role="alert"
          className="p-4 rounded-xl border border-danger bg-danger-surface text-danger text-xs flex items-start gap-3"
        >
          <AlertTriangle
            className="w-5 h-5 text-danger-icon shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <span className="font-semibold block text-sm">
              Critical Active Transit Safety Warning (NAQI: {snapshot.naqi} —{" "}
              {snapshot.category})
            </span>
            <p className="mt-1 leading-relaxed">
              Walking or cycling in NAQI &gt; 200 dramatically multiplies inhaled particulate mass due to deep lung hyperventilation (1.80 m³/hr ventilation rate). Choose closed metro rail, shared cabs, or remote work until pollution disperses.
            </p>
          </div>
        </div>
      )}

      {/* 6 Modes Comparison Table with Sticky Column 1 on Mobile Horizontal Scroll */}
      <div className="bg-surface border border-subtle rounded-xl overflow-hidden elevation-1">
        <div className="p-5 border-b border-subtle flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-base font-semibold text-ink">
              Indian Urban Transit Modes Compared
            </h3>
            <p className="text-xs text-ink-muted mt-0.5 font-mono tabular-nums">
              Round-trip: {commuteImpact.roundTripKm} km · Ambient PM2.5:{" "}
              {commuteImpact.outdoorPm25.toFixed(1)} µg/m³
            </p>
          </div>
          <span className="sm:hidden text-xs text-ink-muted">
            Scroll table right →
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left min-w-[620px]">
            <caption className="sr-only">
              Comparison of 6 Indian urban commute modes across travel time, inhaled PM2.5 dose, daily CO2, and monthly CO2 delta
            </caption>
            <thead className="bg-subtle border-b border-subtle text-ink-muted font-semibold">
              <tr>
                <th
                  scope="col"
                  className="sticky left-0 z-10 bg-subtle py-3 px-4 border-r border-subtle"
                >
                  Transit Mode
                </th>
                <th scope="col" className="py-3 px-3">Round-Trip Time</th>
                <th scope="col" className="py-3 px-3">Inhaled PM2.5</th>
                <th scope="col" className="py-3 px-3">Daily CO₂</th>
                <th scope="col" className="py-3 px-3">Monthly CO₂ Delta</th>
                <th scope="col" className="py-3 px-4">Health &amp; Emission Guidance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {commuteImpact.modes.map((m) => {
                const isCurrent = m.mode === profile.currentCommuteMode;
                const isAlternative =
                  m.mode === commuteImpact.recommendedAlternative?.mode;
                const rowBgClass = isAlternative
                  ? "bg-success-surface"
                  : isCurrent
                  ? "bg-canvas"
                  : "bg-surface";

                return (
                  <tr
                    key={m.mode}
                    className={`transition-colors ${
                      isAlternative
                        ? "bg-success-surface"
                        : isCurrent
                        ? "bg-canvas"
                        : "hover:bg-canvas"
                    }`}
                  >
                    <td
                      className={`sticky left-0 z-10 py-3 px-4 font-semibold text-ink border-r border-subtle ${rowBgClass}`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{m.label}</span>
                        {isCurrent && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-obsidian text-ink-on-dark font-semibold">
                            CURRENT
                          </span>
                        )}
                        {isAlternative && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-success text-white font-semibold">
                            PICK
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono tabular-nums text-ink-secondary">
                      {m.roundTripMinutes} min
                    </td>

                    <td className="py-3 px-3 font-mono tabular-nums font-semibold text-ink">
                      {m.inhaledPm25Ug.toFixed(1)} µg
                    </td>

                    <td className="py-3 px-3 font-mono tabular-nums text-ink-secondary">
                      {m.dailyCo2Grams.toFixed(0)} g
                    </td>

                    <td className="py-3 px-3 font-mono tabular-nums font-semibold">
                      {m.monthlyCo2SavedKg > 0 ? (
                        <span className="text-success">
                          +{m.monthlyCo2SavedKg} kg
                        </span>
                      ) : m.monthlyCo2SavedKg < 0 ? (
                        <span className="text-danger">
                          {m.monthlyCo2SavedKg} kg
                        </span>
                      ) : (
                        <span className="text-ink-muted">0 kg</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-ink-secondary max-w-xs">
                      <p className="leading-relaxed">{m.healthAdvisory}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sustainable Alternatives Ledger (spaced 2-col cards, zero divide artifacts) */}
      {plan.sustainableAlternatives.length > 0 && (
        <section className="bg-surface border border-subtle rounded-xl elevation-1 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-subtle bg-canvas">
            <h3 className="font-display text-base font-semibold text-ink">
              Sustainable Transit Actions
            </h3>
          </div>
          <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
            {plan.sustainableAlternatives.map((alt, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-subtle bg-canvas p-4 sm:p-5 text-xs flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <h4 className="font-semibold text-ink text-sm">
                      {alt.title}
                    </h4>
                    <span className="text-xs font-mono tabular-nums text-ink-muted">
                      {alt.timeframe}
                    </span>
                  </div>
                  <p className="text-ink-secondary leading-relaxed">{alt.action}</p>
                </div>

                <div className="space-y-2">
                  <div className="px-3 py-2 rounded-md bg-subtle text-ink">
                    <span className="font-semibold">Direct Impact: </span>
                    <span className="text-success font-medium">
                      {alt.directImpact}
                    </span>
                  </div>

                  <MechanismDisclosure explanation={alt.whyMechanism} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
