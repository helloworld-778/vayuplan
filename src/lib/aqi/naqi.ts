/**
 * Official Indian Central Pollution Control Board (CPCB) National Air Quality Index (NAQI) Calculator.
 *
 * Implements the standard CPCB linear interpolation formula:
 *   I_p = ((I_Hi - I_Lo) / (BP_Hi - BP_Lo)) * (C_p - BP_Lo) + I_Lo
 *
 * Sub-indices are rounded to the nearest integer.
 * Concentrations exceeding the highest breakpoint are clamped to [0, 500].
 */

import { NaqiCategory, PollutantReadings } from "@/types/air-quality";

// ─── CPCB Breakpoints ───────────────────────────────────────────────
// Format: [BP_Lo, BP_Hi, I_Lo, I_Hi]

interface Breakpoint {
  bpLo: number;
  bpHi: number;
  iLo: number;
  iHi: number;
}

const PM25_BREAKPOINTS: Breakpoint[] = [
  { bpLo: 0, bpHi: 30, iLo: 0, iHi: 50 },
  { bpLo: 30, bpHi: 60, iLo: 51, iHi: 100 },
  { bpLo: 60, bpHi: 90, iLo: 101, iHi: 200 },
  { bpLo: 90, bpHi: 120, iLo: 201, iHi: 300 },
  { bpLo: 120, bpHi: 250, iLo: 301, iHi: 400 },
  { bpLo: 250, bpHi: 380, iLo: 401, iHi: 500 },
];

const PM10_BREAKPOINTS: Breakpoint[] = [
  { bpLo: 0, bpHi: 50, iLo: 0, iHi: 50 },
  { bpLo: 50, bpHi: 100, iLo: 51, iHi: 100 },
  { bpLo: 100, bpHi: 250, iLo: 101, iHi: 200 },
  { bpLo: 250, bpHi: 350, iLo: 201, iHi: 300 },
  { bpLo: 350, bpHi: 430, iLo: 301, iHi: 400 },
  { bpLo: 430, bpHi: 510, iLo: 401, iHi: 500 },
];

const NO2_BREAKPOINTS: Breakpoint[] = [
  { bpLo: 0, bpHi: 40, iLo: 0, iHi: 50 },
  { bpLo: 40, bpHi: 80, iLo: 51, iHi: 100 },
  { bpLo: 80, bpHi: 180, iLo: 101, iHi: 200 },
  { bpLo: 180, bpHi: 280, iLo: 201, iHi: 300 },
  { bpLo: 280, bpHi: 400, iLo: 301, iHi: 400 },
  { bpLo: 400, bpHi: 520, iLo: 401, iHi: 500 },
];

const O3_BREAKPOINTS: Breakpoint[] = [
  { bpLo: 0, bpHi: 50, iLo: 0, iHi: 50 },
  { bpLo: 50, bpHi: 100, iLo: 51, iHi: 100 },
  { bpLo: 100, bpHi: 168, iLo: 101, iHi: 200 },
  { bpLo: 168, bpHi: 208, iLo: 201, iHi: 300 },
  { bpLo: 208, bpHi: 748, iLo: 301, iHi: 400 },
  { bpLo: 748, bpHi: 1000, iLo: 401, iHi: 500 },
];

const SO2_BREAKPOINTS: Breakpoint[] = [
  { bpLo: 0, bpHi: 40, iLo: 0, iHi: 50 },
  { bpLo: 40, bpHi: 80, iLo: 51, iHi: 100 },
  { bpLo: 80, bpHi: 380, iLo: 101, iHi: 200 },
  { bpLo: 380, bpHi: 800, iLo: 201, iHi: 300 },
  { bpLo: 800, bpHi: 1600, iLo: 301, iHi: 400 },
  { bpLo: 1600, bpHi: 2100, iLo: 401, iHi: 500 },
];

// CO breakpoints in mg/m³
const CO_BREAKPOINTS: Breakpoint[] = [
  { bpLo: 0, bpHi: 1.0, iLo: 0, iHi: 50 },
  { bpLo: 1.0, bpHi: 2.0, iLo: 51, iHi: 100 },
  { bpLo: 2.0, bpHi: 10.0, iLo: 101, iHi: 200 },
  { bpLo: 10.0, bpHi: 17.0, iLo: 201, iHi: 300 },
  { bpLo: 17.0, bpHi: 34.0, iLo: 301, iHi: 400 },
  { bpLo: 34.0, bpHi: 50.0, iLo: 401, iHi: 500 },
];

const POLLUTANT_BREAKPOINTS: Record<keyof PollutantReadings, Breakpoint[]> = {
  pm25: PM25_BREAKPOINTS,
  pm10: PM10_BREAKPOINTS,
  no2: NO2_BREAKPOINTS,
  o3: O3_BREAKPOINTS,
  so2: SO2_BREAKPOINTS,
  co: CO_BREAKPOINTS,
};

// ─── Category Mapping ───────────────────────────────────────────────

/**
 * Maps an NAQI integer value to its official CPCB category.
 *
 * 0 - 50    -> Good
 * 51 - 100  -> Satisfactory
 * 101 - 200 -> Moderate
 * 201 - 300 -> Poor
 * 301 - 400 -> Very Poor
 * 401 - 500 -> Severe
 * > 500     -> Severe (clamped)
 */
export function getNaqiCategory(naqi: number): NaqiCategory {
  if (naqi <= 50) return "Good";
  if (naqi <= 100) return "Satisfactory";
  if (naqi <= 200) return "Moderate";
  if (naqi <= 300) return "Poor";
  if (naqi <= 400) return "Very Poor";
  return "Severe";
}

// ─── Sub-Index Calculation ──────────────────────────────────────────

/**
 * Calculates the CPCB sub-index for a single pollutant.
 *
 * @param pollutant The pollutant key ('pm25', 'pm10', 'no2', 'o3', 'so2', 'co').
 * @param concentration Concentration in µg/m³ (CO is internally converted to mg/m³).
 * @returns Calculated sub-index clamped to [0, 500], or null if invalid/negative/NaN.
 */
export function calculatePollutantSubIndex(
  pollutant: keyof PollutantReadings,
  concentration: number | null | undefined
): number | null {
  if (
    concentration === null ||
    concentration === undefined ||
    typeof concentration !== "number" ||
    isNaN(concentration) ||
    !isFinite(concentration) ||
    concentration < 0
  ) {
    return null;
  }

  // Convert CO from µg/m³ to mg/m³ for CPCB formula
  const cp = pollutant === "co" ? concentration / 1000 : concentration;

  if (cp === 0) {
    return 0;
  }

  const brackets = POLLUTANT_BREAKPOINTS[pollutant];
  if (!brackets || brackets.length === 0) {
    return null;
  }

  // Find matching bracket
  for (let i = 0; i < brackets.length; i++) {
    const { bpLo, bpHi, iLo, iHi } = brackets[i];

    // For the first bracket, 0 <= cp <= bpHi
    // For subsequent brackets, bpLo < cp <= bpHi (or cp == bpLo on edge)
    const inBracket = i === 0 ? cp >= 0 && cp <= bpHi : cp > bpLo && cp <= bpHi;

    if (inBracket) {
      const subIndex =
        ((iHi - iLo) / (bpHi - bpLo)) * (cp - bpLo) + iLo;
      return Math.min(500, Math.max(0, Math.round(subIndex)));
    }
  }

  // If concentration exceeds the top breakpoint, clamp to 500
  const topBracket = brackets[brackets.length - 1];
  if (cp > topBracket.bpHi) {
    return 500;
  }

  return null;
}

// ─── Aggregate NAQI Calculation ─────────────────────────────────────

export interface NaqiCalculationResult {
  naqi: number;
  category: NaqiCategory;
  dominantPollutant: keyof PollutantReadings | null;
  subIndices: Partial<Record<keyof PollutantReadings, number>>;
  pollutantCount: number;
  meetsCpcbMinimum: boolean;
}

/**
 * Calculates aggregate National Air Quality Index (NAQI) from pollutant readings.
 *
 * CPCB criteria:
 * - Aggregate NAQI is the maximum of all valid pollutant sub-indices.
 * - Dominant pollutant is the pollutant with the maximum sub-index.
 * - Minimum reporting requirement: at least 3 pollutants monitored, one of which MUST be PM2.5 or PM10.
 *   If criteria not met, `meetsCpcbMinimum` is false, but NAQI is still computed for fallback gracefully.
 */
export function calculateNaqi(readings: PollutantReadings): NaqiCalculationResult {
  const subIndices: Partial<Record<keyof PollutantReadings, number>> = {};
  const pollutants: (keyof PollutantReadings)[] = [
    "pm25",
    "pm10",
    "no2",
    "o3",
    "so2",
    "co",
  ];

  let maxSubIndex = -1;
  let dominant: keyof PollutantReadings | null = null;
  let validCount = 0;

  for (const p of pollutants) {
    const val = readings[p];
    if (val !== null && val !== undefined) {
      const sub = calculatePollutantSubIndex(p, val);
      if (sub !== null) {
        subIndices[p] = sub;
        validCount++;
        if (sub > maxSubIndex) {
          maxSubIndex = sub;
          dominant = p;
        }
      }
    }
  }

  if (validCount === 0 || maxSubIndex < 0) {
    return {
      naqi: 0,
      category: "Good",
      dominantPollutant: null,
      subIndices: {},
      pollutantCount: 0,
      meetsCpcbMinimum: false,
    };
  }

  const hasParticulate =
    subIndices.pm25 !== undefined || subIndices.pm10 !== undefined;
  const meetsCpcbMinimum = validCount >= 3 && hasParticulate;

  return {
    naqi: maxSubIndex,
    category: getNaqiCategory(maxSubIndex),
    dominantPollutant: dominant,
    subIndices,
    pollutantCount: validCount,
    meetsCpcbMinimum,
  };
}
