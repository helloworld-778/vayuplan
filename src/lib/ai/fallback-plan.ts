/**
 * Deterministic Fallback Plan Generator.
 *
 * Synthesizes grounded, persona-tailored action plans strictly from live telemetry
 * and verified Stage 2 environmental physics calculations without requiring LLM generation.
 * Acts as an immutable safety and reliability fallback when Gemini is offline, rate-limited, or unconfigured.
 */

import {
  ActionRecommendation,
  AirQualitySnapshot,
  AssistantPlanResponse,
  FallbackReason,
  HouseholdProfile,
} from "@/types/air-quality";
import { ComputedAnalytics } from "@/lib/ai/types";

export function buildDeterministicPlan(
  snapshot: AirQualitySnapshot,
  profile: HouseholdProfile,
  analytics: ComputedAnalytics,
  fallbackReason?: FallbackReason
): AssistantPlanResponse {
  const { exposureWindows, commuteImpact, indoorAir } = analytics;
  const isHighPollution = snapshot.naqi > 200;
  const city = snapshot.location.name;

  // 1. Morning Routine
  const morningRecs: ActionRecommendation[] = [];
  const morningDaypart = exposureWindows.dayparts.morning;

  if (morningDaypart.safetyStatus === "avoid_outdoors") {
    morningRecs.push({
      title: "Reschedule Morning Physical Exertion",
      timeframe: "06:00 – 09:30 AM",
      action: `Keep all morning exercise indoors. Morning NAQI peaks at ${morningDaypart.maxNaqi} (${morningDaypart.dominantCategory}) due to winter inversion trapping surface vehicular exhaust.`,
      whyMechanism:
        "Morning ground-level temperature inversions trap tailpipe particulates close to the ground before solar convection breaks the atmospheric boundary layer.",
      directImpact: `Prevents inhaling ~${(snapshot.pollutants.pm25 || 100) * 1.8 * 0.75} µg of PM2.5 during strenuous cardiovascular breathing.`,
      effortLevel: "zero_cost",
    });
  }

  // Morning Commute Action
  if (commuteImpact.maskUpgradeImpact.percentSaved > 0) {
    morningRecs.push({
      title: `Upgrade to N95 Mask for ${profile.currentCommuteMode.replace("_", " ")} Commute`,
      timeframe: "During morning transit",
      action: `Equip a properly sealed N95/FFP2 respirator before stepping out for your ${profile.commuteDistanceKm} km journey.`,
      whyMechanism:
        "N95 electrostatic meltblown media filters ≥95% of fine combustion aerosols down to 0.3 µm, whereas standard cloth or surgical masks leak heavily through gaps.",
      directImpact: `Saves ${commuteImpact.maskUpgradeImpact.savedInhaledUg} µg of PM2.5 per round-trip (${commuteImpact.maskUpgradeImpact.percentSaved}% reduction).`,
      effortLevel: "low_cost",
    });
  }

  if (morningRecs.length === 0) {
    morningRecs.push({
      title: "Routine Morning Commute",
      timeframe: "07:00 – 10:00 AM",
      action: `Morning air quality in ${city} is ${morningDaypart.dominantCategory}. Proceed with normal commute while maintaining situational awareness.`,
      whyMechanism: "Ambient particulate levels remain within manageable seasonal tolerances.",
      directImpact: "Maintains standard daily routine safely.",
      effortLevel: "zero_cost",
    });
  }

  // 2. Afternoon Routine
  const afternoonRecs: ActionRecommendation[] = [];
  if (exposureWindows.bestOutdoorWindow) {
    const bestWin = exposureWindows.bestOutdoorWindow;
    const worstWin = exposureWindows.worstSmogWindow;
    const reduction = exposureWindows.pm25ReductionPercent;

    afternoonRecs.push({
      title: "Utilize Solar Clean-Air Window for Errands",
      timeframe: `${bestWin.startHour.toString().padStart(2, "0")}:00 – ${bestWin.endHour.toString().padStart(2, "0")}:00`,
      action: `Schedule necessary outdoor tasks, short walks, or grocery runs during early afternoon when ambient PM2.5 averages ${bestWin.avgPm25} µg/m³.`,
      whyMechanism:
        "Solar radiation warms the ground, expanding the planetary boundary layer and dispersing particulate matter upward away from street level.",
      directImpact:
        worstWin && reduction > 0
          ? `Achieves a ${reduction}% lower inhaled PM2.5 concentration compared to the peak smog period (${worstWin.avgPm25} µg/m³).`
          : `Lowest daytime particulate exposure at ${bestWin.avgPm25} µg/m³.`,
      effortLevel: "zero_cost",
    });
  }

  // Afternoon ventilation
  if (exposureWindows.bestVentilationWindow) {
    const ventWin = exposureWindows.bestVentilationWindow;
    afternoonRecs.push({
      title: "Brief Natural Home Ventilation",
      timeframe: `${ventWin.startHour.toString().padStart(2, "0")}:00 – ${ventWin.endHour.toString().padStart(2, "0")}:00`,
      action: "Open cross-windows for a controlled 15–20 minute air exchange to flush indoor CO2 and stale volatile compounds.",
      whyMechanism: `Outdoor NAQI is currently ${ventWin.avgNaqi} (${ventWin.category}), low enough for safe air exchange without elevating particulate burden.`,
      directImpact: "Restores indoor oxygen levels without significant dust infiltration.",
      effortLevel: "zero_cost",
    });
  } else {
    afternoonRecs.push({
      title: "Keep Windows Sealed Through Afternoon",
      timeframe: "12:00 – 17:00 PM",
      action: "Maintain sealed windows despite bright sunshine. Outdoor particulate concentration remains above safe ventilation limits.",
      whyMechanism: exposureWindows.ventilationReason,
      directImpact: `Prevents outdoor PM2.5 (${snapshot.pollutants.pm25 || 0} µg/m³) from infiltrating indoor living spaces.`,
      effortLevel: "zero_cost",
    });
  }

  // 3. Evening Routine
  const eveningRecs: ActionRecommendation[] = [];
  const eveningDaypart = exposureWindows.dayparts.evening;

  if (isHighPollution || eveningDaypart.maxNaqi > 150) {
    eveningRecs.push({
      title: "Evening Inversion Lockdown & Masked Return",
      timeframe: "17:30 – 21:00 PM",
      action: "Ensure your respirator is worn during evening return transit. Seal all balcony doors and windows before sunset.",
      whyMechanism:
        "Rapid post-sunset radiative ground cooling triggers secondary thermal inversion and traps evening rush-hour emissions near the surface.",
      directImpact: "Prevents exposure to evening peak smog and seals indoor sanctuary before nightfall.",
      effortLevel: "zero_cost",
    });
  }

  eveningRecs.push({
    title: "Pre-Sleep Bedroom Air Purification",
    timeframe: "21:00 – 23:00 PM",
    action: profile.hasAirPurifier
      ? "Run HEPA air purifier on medium-high in the closed bedroom 45 minutes prior to sleeping."
      : "Ensure bedroom doors and windows are tightly closed to minimize night-time infiltration while you sleep.",
    whyMechanism:
      "Humans spend 7–8 continuous hours breathing bedroom air. Unfiltered night-time inhalation causes sustained bronchial irritation.",
    directImpact: profile.hasAirPurifier
      ? "Reduces sleeping particulate exposure by up to 65%."
      : "Limits ambient night-time smog infiltration.",
    effortLevel: profile.hasAirPurifier ? "zero_cost" : "zero_cost",
  });

  // 4. Indoor Hacks (from Indoor Air Analysis)
  const indoorRecs: ActionRecommendation[] = [];

  for (const intervention of indoorAir.interventions.slice(0, 3)) {
    indoorRecs.push({
      title: intervention.title,
      timeframe: "Immediate indoor protocol",
      action: intervention.explanation,
      whyMechanism:
        "Indoor particulate levels are a mathematical function of outdoor infiltration rate and internal combustion sources.",
      directImpact: `Lowers indoor PM2.5 from ${indoorAir.estimatedIndoorPm25} to ${intervention.projectedIndoorPm25} µg/m³ (saving ${intervention.pm25SavedUgM3} µg/m³, a ${intervention.percentReduction}% drop).`,
      effortLevel:
        intervention.id === "add_purifier"
          ? "moderate"
          : intervention.id === "seal_windows"
          ? "zero_cost"
          : "zero_cost",
    });
  }

  // 5. Sustainable Alternatives (from Commute Analysis)
  const sustainableRecs: ActionRecommendation[] = [];

  if (commuteImpact.recommendedAlternative) {
    const alt = commuteImpact.recommendedAlternative;
    sustainableRecs.push({
      title: `Switch Commute to ${alt.label}`,
      timeframe: "Next business day",
      action: `Transition your regular ${profile.commuteDistanceKm} km trip from ${profile.currentCommuteMode.replace("_", " ")} to ${alt.label}.`,
      whyMechanism:
        alt.mode === "metro_transit"
          ? "Metro trains operate in filtered, climate-controlled corridors with 0.50x microenvironment exposure and 83% lower emissions per passenger-km."
          : alt.mode === "work_from_home"
          ? "Eliminating transit altogether completely eliminates commute inhalation and greenhouse footprint."
          : "Shared transit significantly lowers per-capita emissions while maintaining cabin filtration.",
      directImpact: `Saves ${alt.monthlyCo2SavedKg} kg of CO2 and ${alt.monthlyPm25SavedGrams} g of tailpipe PM2.5 every month (22 workdays).`,
      effortLevel: alt.mode === "work_from_home" ? "zero_cost" : "low_cost",
    });
  } else {
    sustainableRecs.push({
      title: "Maintain Low-Carbon Remote Routine",
      timeframe: "Ongoing",
      action: "Continue leveraging remote work and minimal motorized transit.",
      whyMechanism: "Zero commuting footprint supports urban clean-air goals.",
      directImpact: "Preserves zero transit carbon footprint.",
      effortLevel: "zero_cost",
    });
  }

  // Summary
  const summary = `Air quality in ${city} is currently ${snapshot.category} (NAQI ${snapshot.naqi}, dominant pollutant: ${snapshot.dominantPollutant.toUpperCase()}). For a ${profile.persona.replace(/_/g, " ")}${profile.hasRespiratorySensitivity ? " with respiratory sensitivity" : ""}, today's focus is ${isHighPollution ? "rigorous exposure avoidance and indoor sealing" : "temporal optimization of outdoor activities and commute protection"}.`;

  const disclaimer =
    "Disclaimer: VayuPlan provides deterministic environmental risk-mitigation insights based on CPCB NAQI guidelines and peer-reviewed exposure modeling. It is not personal medical advice. Consult a healthcare provider if experiencing respiratory distress.";

  return {
    mode: "deterministic_fallback",
    ...(fallbackReason ? { fallbackReason } : {}),
    summary,
    morningRoutine: morningRecs,
    afternoonRoutine: afternoonRecs,
    eveningRoutine: eveningRecs,
    indoorHacks: indoorRecs,
    sustainableAlternatives: sustainableRecs,
    disclaimer,
  };
}
