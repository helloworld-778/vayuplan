/**
 * Indoor Air Quality Infiltration & Action Lab.
 *
 * Simulates indoor particulate concentrations considering outdoor building envelope infiltration,
 * internal domestic sources (cooking, incense, mosquito coils), and air purifier HEPA filtration physics.
 * Quantifies precise indoor interventions to guide household action.
 */

import {
  HouseholdProfile,
  NaqiCategory,
  WindowsState,
} from "@/types/air-quality";
import { calculatePollutantSubIndex, getNaqiCategory } from "@/lib/aqi/naqi";

// ─── Building Envelope & Physics Constants ──────────────────────────

/** Building envelope infiltration fraction of ambient outdoor PM2.5 */
export const INFILTRATION_FACTORS: Record<WindowsState, number> = {
  open: 0.85,    // Free natural airflow
  cracked: 0.60, // Partial gap infiltration
  sealed: 0.35,  // Closed standard Indian residential windows/doors
};

/** Air purifier efficiency factor (fractional reduction of indoor particulate load) */
export const PURIFIER_REDUCTION_FACTORS: Record<WindowsState, number> = {
  sealed: 0.65,  // 65% reduction in closed room
  cracked: 0.35, // 35% reduction due to competing infiltration
  open: 0.10,    // 10% reduction — rapid continuous outdoor replacement overcomes purifier Clean Air Delivery Rate (CADR)
};

/** Internal emission loads (µg/m³) */
export const BASELINE_INDOOR_SOURCE_UG_M3 = 10; // Normal metabolic/cooking activity
export const INCENSE_SOLID_FUEL_PENALTY_UG_M3 = 45; // Burning agarbatti, dhoop, mosquito coil, or chulha

// ─── Interfaces ─────────────────────────────────────────────────────

export type VentilationDirective =
  | "OPEN_WINDOWS"
  | "BRIEF_VENTILATION"
  | "SEAL_WINDOWS";

export interface IndoorIntervention {
  id: string;
  title: string;
  projectedIndoorPm25: number;
  pm25SavedUgM3: number;
  percentReduction: number;
  explanation: string;
}

export interface IndoorAirAnalysis {
  outdoorPm25: number;
  outdoorNaqi: number;
  estimatedIndoorPm25: number;
  estimatedIndoorNaqi: number;
  estimatedIndoorCategory: NaqiCategory;
  ventilationDirective: VentilationDirective;
  ventilationAdvisory: string;
  interventions: IndoorIntervention[];
}

// ─── Pure Calculation Helper ────────────────────────────────────────

/**
 * Computes estimated steady-state indoor PM2.5 (µg/m³).
 *
 * Formula:
 *   Raw Indoor = (Outdoor PM2.5 * Infiltration Factor) + Indoor Sources
 *   Final Indoor = Raw Indoor * (1 - Purifier Reduction Factor)
 */
export function calculateIndoorPm25(
  outdoorPm25: number,
  windowsState: WindowsState,
  usesIncenseOrSolidFuel: boolean,
  hasAirPurifier: boolean
): number {
  const safeOutdoor = Math.max(0, outdoorPm25);
  const infiltration = INFILTRATION_FACTORS[windowsState] ?? 0.6;
  const indoorSources =
    BASELINE_INDOOR_SOURCE_UG_M3 +
    (usesIncenseOrSolidFuel ? INCENSE_SOLID_FUEL_PENALTY_UG_M3 : 0);

  const rawIndoor = safeOutdoor * infiltration + indoorSources;
  const purifierFactor = hasAirPurifier
    ? PURIFIER_REDUCTION_FACTORS[windowsState] ?? 0.35
    : 0;

  const indoorPm25 = rawIndoor * (1 - purifierFactor);
  return Number(indoorPm25.toFixed(1));
}

// ─── Ventilation Directive Helper ───────────────────────────────────

/**
 * Determines real-time ventilation directive based on outdoor NAQI:
 * - NAQI <= 100: OPEN_WINDOWS
 * - NAQI 101–150: BRIEF_VENTILATION
 * - NAQI > 150: SEAL_WINDOWS
 */
export function getVentilationDirective(outdoorNaqi: number): {
  directive: VentilationDirective;
  advisory: string;
} {
  if (outdoorNaqi <= 100) {
    return {
      directive: "OPEN_WINDOWS",
      advisory:
        "Outdoor air is Good to Satisfactory (NAQI ≤ 100). Open windows for cross-ventilation to flush out indoor carbon dioxide and stale air.",
    };
  }
  if (outdoorNaqi <= 150) {
    return {
      directive: "BRIEF_VENTILATION",
      advisory:
        "Moderate pollution (NAQI 101–150). Limit ventilation to 10–15 minute bursts during lowest-smog afternoon hours, then seal windows.",
    };
  }
  return {
    directive: "SEAL_WINDOWS",
    advisory:
      "High ambient pollution (NAQI > 150). Keep all external windows and doors sealed. Do not ventilate naturally.",
  };
}

// ─── Main Calculator ────────────────────────────────────────────────

/**
 * Evaluates indoor particulate dynamics and generates actionable intervention simulations.
 *
 * @param profile Household profile defining current window habits, air purifier status, and indoor fuel use.
 * @param outdoorPm25 Ambient outdoor PM2.5 in µg/m³.
 * @param outdoorNaqi Ambient outdoor NAQI.
 */
export function analyzeIndoorAir(
  profile: HouseholdProfile,
  outdoorPm25: number,
  outdoorNaqi: number
): IndoorAirAnalysis {
  const currentIndoorPm25 = calculateIndoorPm25(
    outdoorPm25,
    profile.windowsState,
    profile.usesIncenseOrSolidFuel,
    profile.hasAirPurifier
  );

  // Compute equivalent NAQI for indoor PM2.5
  const indoorSubIndex = calculatePollutantSubIndex("pm25", currentIndoorPm25) ?? 0;
  const estimatedIndoorCategory = getNaqiCategory(indoorSubIndex);

  const { directive, advisory } = getVentilationDirective(outdoorNaqi);

  // Generate applicable what-if interventions
  const interventions: IndoorIntervention[] = [];

  // Intervention 1: Seal windows if open or cracked
  if (profile.windowsState !== "sealed") {
    const projected = calculateIndoorPm25(
      outdoorPm25,
      "sealed",
      profile.usesIncenseOrSolidFuel,
      profile.hasAirPurifier
    );
    const saved = Number((currentIndoorPm25 - projected).toFixed(1));
    const percent =
      currentIndoorPm25 > 0
        ? Number(((saved / currentIndoorPm25) * 100).toFixed(1))
        : 0;

    interventions.push({
      id: "seal_windows",
      title: "Seal Windows & Balcony Doors",
      projectedIndoorPm25: projected,
      pm25SavedUgM3: Math.max(0, saved),
      percentReduction: Math.max(0, percent),
      explanation: `Changing window state from '${profile.windowsState}' to 'sealed' lowers outdoor envelope infiltration from ${Math.round(INFILTRATION_FACTORS[profile.windowsState] * 100)}% to 35%.`,
    });
  }

  // Intervention 2: Eliminate incense / solid fuel
  if (profile.usesIncenseOrSolidFuel) {
    const projected = calculateIndoorPm25(
      outdoorPm25,
      profile.windowsState,
      false,
      profile.hasAirPurifier
    );
    const saved = Number((currentIndoorPm25 - projected).toFixed(1));
    const percent =
      currentIndoorPm25 > 0
        ? Number(((saved / currentIndoorPm25) * 100).toFixed(1))
        : 0;

    interventions.push({
      id: "eliminate_incense",
      title: "Stop Incense, Dhoop & Mosquito Coils",
      projectedIndoorPm25: projected,
      pm25SavedUgM3: Math.max(0, saved),
      percentReduction: Math.max(0, percent),
      explanation:
        "Burning incense or mosquito coils adds ~45 µg/m³ of hazardous PM2.5, volatile organic compounds, and polycyclic aromatic hydrocarbons directly inside.",
    });
  }

  // Intervention 3: Add HEPA air purifier (or run existing with sealed windows)
  if (!profile.hasAirPurifier) {
    const projected = calculateIndoorPm25(
      outdoorPm25,
      "sealed", // Air purifiers require sealed windows to achieve 65% reduction
      profile.usesIncenseOrSolidFuel,
      true
    );
    const saved = Number((currentIndoorPm25 - projected).toFixed(1));
    const percent =
      currentIndoorPm25 > 0
        ? Number(((saved / currentIndoorPm25) * 100).toFixed(1))
        : 0;

    interventions.push({
      id: "add_purifier",
      title: "Deploy HEPA Air Purifier (in sealed room)",
      projectedIndoorPm25: projected,
      pm25SavedUgM3: Math.max(0, saved),
      percentReduction: Math.max(0, percent),
      explanation:
        "A true HEPA air purifier in a sealed room reduces indoor airborne particulate concentration by 65%.",
    });
  } else if (profile.windowsState !== "sealed") {
    // Has purifier, but windows aren't sealed!
    const projected = calculateIndoorPm25(
      outdoorPm25,
      "sealed",
      profile.usesIncenseOrSolidFuel,
      true
    );
    const saved = Number((currentIndoorPm25 - projected).toFixed(1));
    const percent =
      currentIndoorPm25 > 0
        ? Number(((saved / currentIndoorPm25) * 100).toFixed(1))
        : 0;

    interventions.push({
      id: "optimize_purifier",
      title: "Seal Windows While Running Air Purifier",
      projectedIndoorPm25: projected,
      pm25SavedUgM3: Math.max(0, saved),
      percentReduction: Math.max(0, percent),
      explanation: `Currently running an air purifier with '${profile.windowsState}' windows yields only ${Math.round(PURIFIER_REDUCTION_FACTORS[profile.windowsState] * 100)}% cleaning efficiency. Sealing windows boosts efficiency to 65%.`,
    });
  }

  // Intervention 4: Full clean-air sanctuary (sealed + purifier + no incense)
  const isAlreadyOptimal =
    profile.windowsState === "sealed" &&
    profile.hasAirPurifier &&
    !profile.usesIncenseOrSolidFuel;

  if (!isAlreadyOptimal) {
    const optimalProjected = calculateIndoorPm25(outdoorPm25, "sealed", false, true);
    const saved = Number((currentIndoorPm25 - optimalProjected).toFixed(1));
    const percent =
      currentIndoorPm25 > 0
        ? Number(((saved / currentIndoorPm25) * 100).toFixed(1))
        : 0;

    interventions.push({
      id: "clean_air_sanctuary",
      title: "Maximum Protection (Sanctuary Mode)",
      projectedIndoorPm25: optimalProjected,
      pm25SavedUgM3: Math.max(0, saved),
      percentReduction: Math.max(0, percent),
      explanation:
        "Combine sealed windows, no indoor combustion, and continuous HEPA filtration for minimum particulate exposure.",
    });
  }

  return {
    outdoorPm25,
    outdoorNaqi,
    estimatedIndoorPm25: currentIndoorPm25,
    estimatedIndoorNaqi: indoorSubIndex,
    estimatedIndoorCategory,
    ventilationDirective: directive,
    ventilationAdvisory: advisory,
    interventions,
  };
}
