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
      {/* Unified Two-Column Insights Sheet */}
      <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl elevation-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#DCE3EC] overflow-hidden">
        {commuteImpact.recommendedAlternative ? (
          <div className="p-5 flex flex-col justify-between gap-4">
            <div>
              <h3 className="font-display text-base font-semibold text-[#0F172A]">
                Switch to {commuteImpact.recommendedAlternative.label}
              </h3>
              <p className="text-xs text-[#525E70] mt-0.5">
                vs. {getCommuteModeLabel(profile.currentCommuteMode)}
              </p>

              <p className="mt-2.5 text-xs text-[#334155] leading-relaxed">
                {commuteImpact.recommendedAlternative.healthAdvisory}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#DCE3EC] text-xs">
              <div className="bg-[#F1F4F8] p-3 rounded-lg">
                <div className="text-xs text-[#525E70]">Monthly CO₂ Saved</div>
                <div className="mt-0.5 text-lg font-bold font-mono tabular-nums text-[#065F46]">
                  {commuteImpact.recommendedAlternative.monthlyCo2SavedKg} kg
                </div>
                <div className="text-xs text-[#525E70]">22 workdays / mo</div>
              </div>

              <div className="bg-[#F1F4F8] p-3 rounded-lg">
                <div className="text-xs text-[#525E70]">Inhaled PM2.5 Delta</div>
                <div className="mt-0.5 text-lg font-bold font-mono tabular-nums text-[#0F172A]">
                  {commuteImpact.recommendedAlternative.deltaInhaledPm25Percent}%
                </div>
                <div className="text-xs text-[#525E70]">per round-trip</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 flex flex-col justify-center gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2
                className="w-4 h-4 text-[#065F46] shrink-0"
                aria-hidden="true"
              />
              <h3 className="font-display text-base font-semibold text-[#0F172A]">
                Already at Optimal Transit Baseline
              </h3>
            </div>
            <p className="text-xs text-[#334155] leading-relaxed">
              Remote work or zero-emission travel is active. No motorized switch required.
            </p>
          </div>
        )}

        <div className="p-5 flex flex-col justify-between gap-4">
          <div>
            <h3 className="font-display text-base font-semibold text-[#0F172A]">
              N95 Respirator Upgrade Impact
            </h3>
            <p className="text-xs text-[#525E70] mt-0.5">
              Personal respiratory shield across roadside corridors
            </p>

            <p className="mt-2.5 text-xs text-[#334155] leading-relaxed">
              {commuteImpact.maskUpgradeImpact.explanation}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#DCE3EC] text-xs">
            <div className="bg-[#F1F4F8] p-3 rounded-lg">
              <div className="text-xs text-[#525E70]">Dose Reduction</div>
              <div className="mt-0.5 text-lg font-bold font-mono tabular-nums text-[#065F46]">
                {commuteImpact.maskUpgradeImpact.percentSaved}%
              </div>
              <div className="text-xs text-[#525E70]">
                {profile.maskType === "n95"
                  ? "N95 baseline active"
                  : `${MASK_DISPLAY[profile.maskType]} → N95`}
              </div>
            </div>

            <div className="bg-[#F1F4F8] p-3 rounded-lg">
              <div className="text-xs text-[#525E70]">PM2.5 Saved</div>
              <div className="mt-0.5 text-lg font-bold font-mono tabular-nums text-[#0F172A]">
                {commuteImpact.maskUpgradeImpact.savedInhaledUg} µg
              </div>
              <div className="text-xs text-[#525E70]">per round-trip</div>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Active Transit Warning when NAQI > 200 */}
      {isHighSmog && (
        <div
          role="alert"
          className="p-4 rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] text-[#991B1B] text-xs flex items-start gap-3"
        >
          <AlertTriangle
            className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5"
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

      {/* 6 Modes Comparison Table */}
      <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl overflow-hidden elevation-1">
        <div className="p-5 border-b border-[#DCE3EC] flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-base font-semibold text-[#0F172A]">
              Indian Urban Transit Modes Compared
            </h3>
            <p className="text-xs text-[#525E70] mt-0.5 font-mono tabular-nums">
              Round-trip: {commuteImpact.roundTripKm} km · Ambient PM2.5:{" "}
              {commuteImpact.outdoorPm25.toFixed(1)} µg/m³
            </p>
          </div>
          <span className="sm:hidden text-xs text-[#525E70]">
            Scroll table right →
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left min-w-[620px]">
            <caption className="sr-only">
              Comparison of 6 Indian urban commute modes across travel time, inhaled PM2.5 dose, daily CO2, and monthly CO2 delta
            </caption>
            <thead className="bg-[#F1F4F8] border-b border-[#DCE3EC] text-[#525E70] font-semibold">
              <tr>
                <th scope="col" className="py-3 px-4">Transit Mode</th>
                <th scope="col" className="py-3 px-3">Round-Trip Time</th>
                <th scope="col" className="py-3 px-3">Inhaled PM2.5</th>
                <th scope="col" className="py-3 px-3">Daily CO₂</th>
                <th scope="col" className="py-3 px-3">Monthly CO₂ Delta</th>
                <th scope="col" className="py-3 px-4">Health &amp; Emission Guidance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE3EC]">
              {commuteImpact.modes.map((m) => {
                const isCurrent = m.mode === profile.currentCommuteMode;
                const isAlternative =
                  m.mode === commuteImpact.recommendedAlternative?.mode;

                return (
                  <tr
                    key={m.mode}
                    className={`transition-colors ${
                      isAlternative
                        ? "bg-[#ECFDF5]/60"
                        : isCurrent
                        ? "bg-[#F7F8FA]"
                        : "hover:bg-[#F7F8FA]"
                    }`}
                  >
                    <td className="py-3 px-4 font-semibold text-[#0F172A]">
                      <div className="flex items-center gap-2">
                        <span>{m.label}</span>
                        {isCurrent && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-[#0F172A] text-[#FFFFFF] font-semibold">
                            CURRENT
                          </span>
                        )}
                        {isAlternative && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-[#065F46] text-[#FFFFFF] font-semibold">
                            PICK
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono tabular-nums text-[#334155]">
                      {m.roundTripMinutes} min
                    </td>

                    <td className="py-3 px-3 font-mono tabular-nums font-semibold text-[#0F172A]">
                      {m.inhaledPm25Ug.toFixed(1)} µg
                    </td>

                    <td className="py-3 px-3 font-mono tabular-nums text-[#334155]">
                      {m.dailyCo2Grams.toFixed(0)} g
                    </td>

                    <td className="py-3 px-3 font-mono tabular-nums font-semibold">
                      {m.monthlyCo2SavedKg > 0 ? (
                        <span className="text-[#065F46]">
                          +{m.monthlyCo2SavedKg} kg
                        </span>
                      ) : m.monthlyCo2SavedKg < 0 ? (
                        <span className="text-[#991B1B]">
                          {m.monthlyCo2SavedKg} kg
                        </span>
                      ) : (
                        <span className="text-[#525E70]">0 kg</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-[#334155] max-w-xs">
                      <p className="leading-relaxed">{m.healthAdvisory}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sustainable Alternatives Ledger with Expandable Mechanism */}
      {plan.sustainableAlternatives.length > 0 && (
        <section className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl elevation-1 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#DCE3EC] bg-[#F7F8FA]">
            <h3 className="font-display text-base font-semibold text-[#0F172A]">
              Sustainable Transit Actions
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#DCE3EC]">
            {plan.sustainableAlternatives.map((alt, idx) => (
              <div
                key={idx}
                className="p-4 sm:p-5 text-xs flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <h4 className="font-semibold text-[#0F172A] text-sm">
                      {alt.title}
                    </h4>
                    <span className="text-xs font-mono tabular-nums text-[#525E70]">
                      {alt.timeframe}
                    </span>
                  </div>
                  <p className="text-[#334155] leading-relaxed">{alt.action}</p>
                </div>

                <div className="space-y-2">
                  <div className="px-3 py-2 rounded-md bg-[#F1F4F8] text-[#0F172A]">
                    <span className="font-semibold">Direct Impact: </span>
                    <span className="text-[#065F46] font-medium">
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
