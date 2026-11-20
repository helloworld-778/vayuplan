/**
 * Commute Mode Exposure & Emissions Optimizer.
 *
 * Evaluates Indian urban transit options against inhaled particulate dose,
 * direct tailpipe/lifecycle greenhouse emissions, and health risk profiles.
 *
 * Inhaled dose formula:
 *   Inhaled Dose (µg) = Outdoor PM2.5 (µg/m³) * Microenvironment Factor * Mask Penetration Factor * Ventilation Rate (m³/hr) * Commute Duration (hr)
 */

import { CommuteMode, HouseholdProfile, MaskType } from "@/types/air-quality";

// ─── Indian Urban Microenvironment & Emission Constants ────────────

/** Microenvironment PM2.5 factor relative to ambient background */
export const MICROENVIRONMENT_FACTORS: Record<CommuteMode, number> = {
  two_wheeler: 1.35,   // Directly exposed in tailpipe exhaust plumes
  bicycle_walk: 1.15,  // Roadside footpath exposure
  petrol_car: 0.65,    // Closed cabin with recirculated AC filtration
  carpool: 0.65,       // Closed cabin with recirculated AC filtration
  metro_transit: 0.50, // Air-conditioned underground/elevated carriages
  work_from_home: 0,   // Zero transit exposure
};

/** Minute ventilation / breathing rate (m³/hr) */
export const VENTILATION_RATES: Record<CommuteMode, number> = {
  petrol_car: 0.65,     // Sedentary seated
  carpool: 0.65,        // Sedentary seated
  two_wheeler: 0.65,    // Sedentary seated
  metro_transit: 0.85,  // Light activity (platform walking, standing)
  bicycle_walk: 1.80,   // Strenuous physical exertion / deep lung ventilation
  work_from_home: 0,    // N/A
};

/** Average urban commuting speed in Indian metropolitan traffic (km/h) */
export const AVERAGE_SPEEDS_KMH: Record<CommuteMode, number> = {
  petrol_car: 22,
  carpool: 22,
  two_wheeler: 26,
  metro_transit: 32, // +0.25 hr (15 min) walk/wait station overhead
  bicycle_walk: 10,
  work_from_home: 0,
};

/** Real-world fit-adjusted mask penetration factors (fraction of PM2.5 passing through) */
export const MASK_PENETRATION_FACTORS: Record<MaskType, number> = {
  none: 1.0,     // 0% filtration -> 100% penetration
  cloth: 0.75,    // ~25% filtration -> 75% penetration
  surgical: 0.45, // ~55% filtration (with leakage) -> 45% penetration
  n95: 0.10,      // ~90% real-world fit filtration -> 10% penetration
};

/** Emissions per passenger-km */
export const EMISSIONS_PER_KM: Record<
  CommuteMode,
  { co2Grams: number; pm25Grams: number }
> = {
  petrol_car: { co2Grams: 170, pm25Grams: 0.045 },
  two_wheeler: { co2Grams: 55, pm25Grams: 0.03 },
  carpool: { co2Grams: 57, pm25Grams: 0.015 }, // Assuming 3 occupants
  metro_transit: { co2Grams: 28, pm25Grams: 0.005 },
  bicycle_walk: { co2Grams: 0, pm25Grams: 0 },
  work_from_home: { co2Grams: 0, pm25Grams: 0 },
};

// ─── Interfaces ─────────────────────────────────────────────────────

export interface ModeEvaluation {
  mode: CommuteMode;
  label: string;
  roundTripKm: number;
  durationHours: number;
  roundTripMinutes: number;
  inhaledPm25Ug: number;
  dailyCo2Grams: number;
  dailyPm25EmittedGrams: number;
  deltaInhaledPm25Percent: number;
  monthlyCo2SavedKg: number;
  monthlyPm25SavedGrams: number;
  healthAdvisory: string;
  isViableAlternative: boolean;
}

export interface MaskUpgradeImpact {
  currentMask: MaskType;
  upgradedMask: "n95";
  currentInhaledUg: number;
  upgradedInhaledUg: number;
  savedInhaledUg: number;
  percentSaved: number;
  explanation: string;
}

export interface CommuteAnalysis {
  roundTripKm: number;
  currentMode: CommuteMode;
  outdoorPm25: number;
  outdoorNaqi: number;
  modes: ModeEvaluation[];
  recommendedAlternative: ModeEvaluation | null;
  maskUpgradeImpact: MaskUpgradeImpact;
}

// ─── Mode Label Helper ──────────────────────────────────────────────

export function getCommuteModeLabel(mode: CommuteMode): string {
  switch (mode) {
    case "petrol_car":
      return "Solo Petrol Car";
    case "two_wheeler":
      return "Motorcycle / Scooter";
    case "carpool":
      return "Carpool / Shared Cab";
    case "metro_transit":
      return "Metro / Rail Transit";
    case "bicycle_walk":
      return "Walking / Cycling";
    case "work_from_home":
      return "Work From Home (Remote)";
  }
}

// ─── Duration Helper ────────────────────────────────────────────────

export function calculateCommuteDurationHours(
  mode: CommuteMode,
  roundTripKm: number
): number {
  if (roundTripKm <= 0 || mode === "work_from_home") {
    return 0;
  }
  if (mode === "metro_transit") {
    // 32 km/h rail speed + 0.25 hr (15 min) walk/station access overhead
    return roundTripKm / AVERAGE_SPEEDS_KMH.metro_transit + 0.25;
  }
  const speed = AVERAGE_SPEEDS_KMH[mode];
  return speed > 0 ? roundTripKm / speed : 0;
}

// ─── Health Advisory Helper ─────────────────────────────────────────

function getHealthAdvisory(
  mode: CommuteMode,
  outdoorNaqi: number,
  maskType: MaskType
): string {
  if (mode === "work_from_home") {
    return "Optimal choice: zero commute inhalation and zero transit emissions.";
  }

  if (mode === "bicycle_walk") {
    if (outdoorNaqi > 200) {
      return "CRITICAL ADVISORY: Avoid active transit (walking/cycling) when NAQI > 200. Heavy exertion elevates breathing rate to 1.8 m³/hr, dramatically increasing deep lung PM2.5 deposition.";
    }
    if (outdoorNaqi > 100) {
      return "Moderate risk: active exertion increases inhaled dose. Use an N95 mask or choose metro transit.";
    }
    return "Healthy choice: zero emissions and safe ambient air quality for active transit.";
  }

  if (mode === "two_wheeler") {
    if (outdoorNaqi > 200 && maskType !== "n95") {
      return "HIGH RISK: Two-wheelers directly inhale concentrated vehicle exhaust plumes (1.35x microenvironment factor). An N95 respirator is essential.";
    }
    if (outdoorNaqi > 100) {
      return "Elevated road-level pollution. Ensure your helmet visor is down and an N95 mask is worn.";
    }
    return "Standard exposure. Routine commute.";
  }

  if (mode === "metro_transit") {
    return "Lowest inhaled dose among vehicular modes (0.50x factor) with air-conditioned filtration and minimal carbon footprint.";
  }

  if (mode === "carpool" || mode === "petrol_car") {
    return "Cabin air filters offer partial shielding (0.65x factor). Keep AC in recirculation mode to prevent outside exhaust intake.";
  }

  return "Standard commute.";
}

// ─── Main Calculator ────────────────────────────────────────────────

/**
 * Optimizes commute mode choices based on outdoor air quality, distance, and household profile.
 *
 * @param profile Household profile including current commute mode, distance, and mask type.
 * @param outdoorPm25 Ambient PM2.5 in µg/m³.
 * @param outdoorNaqi Ambient National Air Quality Index.
 */
export function analyzeCommuteImpact(
  profile: HouseholdProfile,
  outdoorPm25: number,
  outdoorNaqi: number
): CommuteAnalysis {
  const roundTripKm = Math.max(0, profile.commuteDistanceKm) * 2;
  const currentMaskPenetration = MASK_PENETRATION_FACTORS[profile.maskType] ?? 1.0;
  const allModes: CommuteMode[] = [
    "petrol_car",
    "two_wheeler",
    "metro_transit",
    "carpool",
    "bicycle_walk",
    "work_from_home",
  ];

  // 1. First pass: compute raw metrics for the current mode as baseline
  const currentDuration = calculateCommuteDurationHours(
    profile.currentCommuteMode,
    roundTripKm
  );
  const currentMicroEnv = MICROENVIRONMENT_FACTORS[profile.currentCommuteMode];
  const currentVentRate = VENTILATION_RATES[profile.currentCommuteMode];
  const currentInhaled =
    outdoorPm25 * currentMicroEnv * currentMaskPenetration * currentVentRate * currentDuration;
  const currentDailyCo2 =
    roundTripKm * EMISSIONS_PER_KM[profile.currentCommuteMode].co2Grams;
  const currentDailyPm25 =
    roundTripKm * EMISSIONS_PER_KM[profile.currentCommuteMode].pm25Grams;

  // 2. Evaluate each commute mode
  const evaluations: ModeEvaluation[] = allModes.map((mode) => {
    const durationHours = calculateCommuteDurationHours(mode, roundTripKm);
    const roundTripMinutes = Math.round(durationHours * 60);

    const microEnv = MICROENVIRONMENT_FACTORS[mode];
    const ventRate = VENTILATION_RATES[mode];
    // Inhaled dose using the user's current mask
    const inhaledPm25Ug = Number(
      (outdoorPm25 * microEnv * currentMaskPenetration * ventRate * durationHours).toFixed(2)
    );

    const emissions = EMISSIONS_PER_KM[mode];
    const dailyCo2Grams = Number((roundTripKm * emissions.co2Grams).toFixed(1));
    const dailyPm25EmittedGrams = Number(
      (roundTripKm * emissions.pm25Grams).toFixed(3)
    );

    // Comparison vs current mode
    let deltaInhaledPm25Percent = 0;
    if (currentInhaled > 0) {
      deltaInhaledPm25Percent = Number(
        (((inhaledPm25Ug - currentInhaled) / currentInhaled) * 100).toFixed(1)
      );
    } else if (inhaledPm25Ug > 0) {
      deltaInhaledPm25Percent = 100;
    }

    // 22 work days per month
    const monthlyCo2SavedKg = Number(
      (((currentDailyCo2 - dailyCo2Grams) * 22) / 1000).toFixed(2)
    );
    const monthlyPm25SavedGrams = Number(
      ((currentDailyPm25 - dailyPm25EmittedGrams) * 22).toFixed(2)
    );

    const healthAdvisory = getHealthAdvisory(mode, outdoorNaqi, profile.maskType);

    // CRITICAL SAFETY RULE: Never recommend bicycle_walk when outdoorNaqi > 200
    const isViableAlternative =
      mode !== profile.currentCommuteMode &&
      !(mode === "bicycle_walk" && outdoorNaqi > 200);

    return {
      mode,
      label: getCommuteModeLabel(mode),
      roundTripKm,
      durationHours: Number(durationHours.toFixed(2)),
      roundTripMinutes,
      inhaledPm25Ug,
      dailyCo2Grams,
      dailyPm25EmittedGrams,
      deltaInhaledPm25Percent,
      monthlyCo2SavedKg,
      monthlyPm25SavedGrams,
      healthAdvisory,
      isViableAlternative,
    };
  });

  // 3. Select recommended alternative
  // Prioritize lower emissions and lower inhaled dose
  // Prefer: work_from_home > metro_transit > carpool > bicycle_walk (if <= 200)
  let recommendedAlternative: ModeEvaluation | null = null;

  if (profile.currentCommuteMode === "work_from_home") {
    recommendedAlternative = null; // Already at the ideal mode
  } else {
    const candidates = evaluations.filter((m) => m.isViableAlternative);

    // Priority ordering for alternatives
    const priorityOrder: CommuteMode[] =
      outdoorNaqi > 200
        ? ["work_from_home", "metro_transit", "carpool"]
        : ["work_from_home", "metro_transit", "bicycle_walk", "carpool"];

    for (const prefMode of priorityOrder) {
      const match = candidates.find((c) => c.mode === prefMode);
      if (match) {
        recommendedAlternative = match;
        break;
      }
    }
  }

  // 4. Compute Mask Upgrade Impact (Current mask -> N95)
  const n95Penetration = MASK_PENETRATION_FACTORS.n95; // 0.10
  const n95InhaledUg = Number(
    (outdoorPm25 * currentMicroEnv * n95Penetration * currentVentRate * currentDuration).toFixed(2)
  );

  const currentInhaledUg = Number(currentInhaled.toFixed(2));
  const savedInhaledUg = Number(
    Math.max(0, currentInhaledUg - n95InhaledUg).toFixed(2)
  );
  const percentSaved =
    currentInhaledUg > 0
      ? Number((((currentInhaledUg - n95InhaledUg) / currentInhaledUg) * 100).toFixed(1))
      : 0;

  const maskUpgradeImpact: MaskUpgradeImpact = {
    currentMask: profile.maskType,
    upgradedMask: "n95",
    currentInhaledUg,
    upgradedInhaledUg: n95InhaledUg,
    savedInhaledUg,
    percentSaved,
    explanation:
      profile.maskType === "n95"
        ? "You are already using an N95 respirator. Excellent protection."
        : `Upgrading from ${profile.maskType} to an N95 respirator reduces inhaled particulate dose by ${percentSaved}% (saving ${savedInhaledUg} µg of PM2.5 per round-trip).`,
  };

  return {
    roundTripKm,
    currentMode: profile.currentCommuteMode,
    outdoorPm25,
    outdoorNaqi,
    modes: evaluations,
    recommendedAlternative,
    maskUpgradeImpact,
  };
}
