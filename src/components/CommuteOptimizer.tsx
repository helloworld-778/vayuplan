"use client";

import React from "react";
import {
  AirQualitySnapshot,
  AssistantPlanResponse,
  HouseholdProfile,
} from "@/types/air-quality";
import { ComputedAnalytics } from "@/lib/ai/types";
import {
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface CommuteOptimizerProps {
  snapshot: AirQualitySnapshot;
  profile: HouseholdProfile;
  plan: AssistantPlanResponse;
  analytics: ComputedAnalytics;
}

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
      {/* Top Banner: Key Insights (Alternative + Mask Upgrade) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recommended Transit Alternative */}
        {commuteImpact.recommendedAlternative ? (
          <div className="bg-[#FFFFFF] border-2 border-[#14181F] rounded-lg p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#14181F] text-[#FFFFFF] font-bold">
                Recommended Transition
              </span>
              <span className="text-xs text-[#5E6470]">
                vs. current {profile.currentCommuteMode.replace("_", " ")}
              </span>
            </div>

            <h3 className="text-base font-bold text-[#14181F] mb-1">
              Switch to {commuteImpact.recommendedAlternative.label}
            </h3>

            <p className="text-xs text-[#474D58] leading-relaxed mb-4">
              {commuteImpact.recommendedAlternative.healthAdvisory}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#EAE7DF] text-xs">
              <div className="bg-[#FAF9F6] p-2.5 rounded border border-[#DDD9CE]">
                <div className="text-[11px] text-[#6E7582]">Monthly CO₂ Saved</div>
                <div className="text-lg font-bold font-mono text-[#059669]">
                  {commuteImpact.recommendedAlternative.monthlyCo2SavedKg} kg
                </div>
                <div className="text-[10px] text-[#7A8290]">22 workdays / mo</div>
              </div>

              <div className="bg-[#FAF9F6] p-2.5 rounded border border-[#DDD9CE]">
                <div className="text-[11px] text-[#6E7582]">Inhaled PM2.5 Delta</div>
                <div className="text-lg font-bold font-mono text-[#14181F]">
                  {commuteImpact.recommendedAlternative.deltaInhaledPm25Percent}%
                </div>
                <div className="text-[10px] text-[#7A8290]">per round-trip</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#FFFFFF] border border-[#E2DFD6] rounded-lg p-5">
            <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Optimal Low-Emission Routine</span>
            </div>
            <h3 className="text-base font-bold text-[#14181F]">
              Already at Optimal Transit Baseline
            </h3>
            <p className="text-xs text-[#5E6470] mt-1">
              You are currently using remote work or optimal zero-emission habits. No motorized switch required.
            </p>
          </div>
        )}

        {/* N95 Mask Upgrade Impact Card */}
        <div className="bg-[#FFFFFF] border border-[#E2DFD6] rounded-lg p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300 font-bold">
              Personal Respiratory Shield
            </span>
          </div>

          <h3 className="text-base font-bold text-[#14181F] mb-1">
            N95 Respirator Upgrade Impact
          </h3>

          <p className="text-xs text-[#474D58] leading-relaxed mb-4">
            {commuteImpact.maskUpgradeImpact.explanation}
          </p>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#EAE7DF] text-xs">
            <div className="bg-[#FAF9F6] p-2.5 rounded border border-[#DDD9CE]">
              <div className="text-[11px] text-[#6E7582]">Dose Reduction</div>
              <div className="text-lg font-bold font-mono text-emerald-950">
                {commuteImpact.maskUpgradeImpact.percentSaved}%
              </div>
              <div className="text-[10px] text-[#7A8290]">
                {profile.maskType} → N95
              </div>
            </div>

            <div className="bg-[#FAF9F6] p-2.5 rounded border border-[#DDD9CE]">
              <div className="text-[11px] text-[#6E7582]">PM2.5 Saved</div>
              <div className="text-lg font-bold font-mono text-[#14181F]">
                {commuteImpact.maskUpgradeImpact.savedInhaledUg} µg
              </div>
              <div className="text-[10px] text-[#7A8290]">per round-trip</div>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Safety Notice if NAQI > 200 */}
      {isHighSmog && (
        <div className="p-4 rounded-md border border-rose-300 bg-rose-50 text-rose-950 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-sm">
              Critical Active Transit Safety Warning (NAQI: {snapshot.naqi} — {snapshot.category})
            </span>
            <p className="mt-1 leading-relaxed">
              Walking or cycling in NAQI &gt; 200 dramatically multiplies inhaled particulate mass due to deep lung hyperventilation (1.80 m³/hr ventilation rate). VayuPlan strictly advises against active street transit under current conditions; choose metro rail, shared cabs, or remote work.
            </p>
          </div>
        </div>
      )}

      {/* 6 Modes Comprehensive Comparison Table */}
      <div className="bg-[#FFFFFF] border border-[#E2DFD6] rounded-lg overflow-hidden shadow-xs">
        <div className="p-5 border-b border-[#EAE7DF]">
          <h3 className="text-sm font-bold text-[#14181F]">
            Indian Urban Transit Modes Compared
          </h3>
          <p className="text-xs text-[#5E6470] mt-0.5">
            Round-trip: {commuteImpact.roundTripKm} km • Ambient PM2.5: {commuteImpact.outdoorPm25.toFixed(1)} µg/m³
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left" role="table">
            <thead className="bg-[#FAF9F6] border-b border-[#EAE7DF] text-[#6E7582] font-mono uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Transit Mode</th>
                <th className="py-3 px-3">Round-Trip Time</th>
                <th className="py-3 px-3">Inhaled PM2.5</th>
                <th className="py-3 px-3">Daily CO₂</th>
                <th className="py-3 px-3">Monthly CO₂ Delta</th>
                <th className="py-3 px-4">Health & Emission Guidance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE7DF]">
              {commuteImpact.modes.map((m) => {
                const isCurrent = m.mode === profile.currentCommuteMode;
                const isAlternative =
                  m.mode === commuteImpact.recommendedAlternative?.mode;

                return (
                  <tr
                    key={m.mode}
                    className={`transition-colors ${
                      isAlternative
                        ? "bg-emerald-50/40"
                        : isCurrent
                        ? "bg-[#FAF8F5]"
                        : "hover:bg-[#FAF9F6]"
                    }`}
                  >
                    <td className="py-3 px-4 font-semibold text-[#14181F]">
                      <div className="flex items-center gap-2">
                        <span>{m.label}</span>
                        {isCurrent && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#14181F] text-[#FFFFFF] font-normal">
                            CURRENT
                          </span>
                        )}
                        {isAlternative && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-700 text-[#FFFFFF] font-medium">
                            PICK
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono text-[#2B303B]">
                      {m.roundTripMinutes} min
                    </td>

                    <td className="py-3 px-3 font-mono font-medium text-[#14181F]">
                      {m.inhaledPm25Ug.toFixed(1)} µg
                    </td>

                    <td className="py-3 px-3 font-mono text-[#474D58]">
                      {m.dailyCo2Grams.toFixed(0)} g
                    </td>

                    <td className="py-3 px-3 font-mono font-semibold">
                      {m.monthlyCo2SavedKg > 0 ? (
                        <span className="text-emerald-800">
                          +{m.monthlyCo2SavedKg} kg
                        </span>
                      ) : m.monthlyCo2SavedKg < 0 ? (
                        <span className="text-rose-800">
                          {m.monthlyCo2SavedKg} kg
                        </span>
                      ) : (
                        <span className="text-[#7A8290]">0 kg</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-[#474D58] max-w-xs">
                      <p className="line-clamp-2">{m.healthAdvisory}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sustainable Alternatives from Plan */}
      {plan.sustainableAlternatives.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[#14181F]">
            Sustainable Transit Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plan.sustainableAlternatives.map((alt, idx) => (
              <div
                key={idx}
                className="bg-[#FFFFFF] border border-[#E2DFD6] rounded-md p-4 text-xs"
              >
                <div className="font-bold text-[#14181F] text-sm mb-1">
                  {alt.title}
                </div>
                <p className="text-[#2B303B] mb-2.5 leading-relaxed">
                  {alt.action}
                </p>
                <div className="pt-2 border-t border-[#EAE7DF] text-[#474D58]">
                  <span className="font-semibold text-[#14181F]">Direct Impact: </span>
                  <span className="text-emerald-950 font-medium">{alt.directImpact}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
