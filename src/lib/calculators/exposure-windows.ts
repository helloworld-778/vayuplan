/**
 * Hourly Exposure Window Optimizer.
 *
 * Implements scientifically grounded temporal planning over a 24–48h hourly air quality forecast.
 * Groups hours into dayparts, identifies best outdoor windows and peak smog periods,
 * calculates potential inhaled PM2.5 reduction from rescheduling, and evaluates natural ventilation safety.
 */

import {
  HourlyAirPoint,
  HouseholdProfile,
  NaqiCategory,
} from "@/types/air-quality";
import { getNaqiCategory } from "@/lib/aqi/naqi";

// ─── Interfaces ─────────────────────────────────────────────────────

export type DaypartName = "morning" | "afternoon" | "evening" | "night";

export type SafetyStatus = "safe" | "caution" | "avoid_outdoors";

export interface DaypartSummary {
  daypart: DaypartName;
  label: string;
  hoursRange: string;
  avgPm25: number | null;
  maxNaqi: number;
  dominantCategory: NaqiCategory;
  safetyStatus: SafetyStatus;
  advisory: string;
  pointCount: number;
}

export interface RollingWindow {
  startTimeIso: string;
  endTimeIso: string;
  startHour: number;
  endHour: number;
  avgPm25: number;
  avgNaqi: number;
  category: NaqiCategory;
}

export interface ExposureWindowsAnalysis {
  dayparts: Record<DaypartName, DaypartSummary>;
  bestOutdoorWindow: RollingWindow | null;
  worstSmogWindow: RollingWindow | null;
  pm25ReductionPercent: number;
  bestVentilationWindow: RollingWindow | null;
  ventilationReason: string;
  forecastCount: number;
}

// ─── Hour Extraction Helper ─────────────────────────────────────────

/**
 * Parses the wall-clock hour (0-23) from an ISO time string.
 * Supports strings like "2026-11-20T08:00:00+05:30", "2026-11-20T14:00:00Z", etc.
 */
export function parseHourFromIso(timeIso: string): number {
  const match = timeIso.match(/T(\d{2}):/);
  if (match) {
    return parseInt(match[1], 10);
  }
  const date = new Date(timeIso);
  return isNaN(date.getTime()) ? 0 : date.getHours();
}

/**
 * Classifies an hour (0-23) into its corresponding daypart:
 * - morning: 06:00–11:59 (6–11)
 * - afternoon: 12:00–16:59 (12–16)
 * - evening: 17:00–21:59 (17–21)
 * - night: 22:00–05:59 (22–23, 0–5)
 */
export function getDaypartForHour(hour: number): DaypartName {
  if (hour >= 6 && hour <= 11) return "morning";
  if (hour >= 12 && hour <= 16) return "afternoon";
  if (hour >= 17 && hour <= 21) return "evening";
  return "night";
}

// ─── Safety Evaluation Helper ───────────────────────────────────────

function evaluateSafetyStatus(
  maxNaqi: number,
  profile?: Partial<HouseholdProfile> | null
): { status: SafetyStatus; advisory: string } {
  const isSensitive =
    profile?.persona === "family_with_kids" ||
    profile?.persona === "senior_citizen" ||
    profile?.hasRespiratorySensitivity === true;

  const isAthlete = profile?.persona === "student_athlete";

  if (isSensitive) {
    if (maxNaqi <= 50) {
      return {
        status: "safe",
        advisory: "Air quality is Good. Safe for outdoor activities and children/seniors.",
      };
    }
    if (maxNaqi <= 150) {
      return {
        status: "caution",
        advisory:
          "Moderate air quality. Sensitive individuals and children should reduce prolonged or heavy outdoor exertion.",
      };
    }
    return {
      status: "avoid_outdoors",
      advisory:
        "High pollution (NAQI > 150). High risk for children, seniors, and respiratory patients. Avoid outdoor exposure.",
    };
  }

  if (isAthlete) {
    if (maxNaqi <= 100) {
      return {
        status: "safe",
        advisory: "Safe for outdoor endurance training and athletic drills.",
      };
    }
    if (maxNaqi <= 200) {
      return {
        status: "caution",
        advisory:
          "Caution for athletes: elevated ventilation rate (>1.8 m³/hr) increases deep lung particle deposition. Shift high-intensity cardio indoors.",
      };
    }
    return {
      status: "avoid_outdoors",
      advisory:
        "Unhealthy air (NAQI > 200). Heavy outdoor cardio strongly discouraged. Move all training indoors.",
    };
  }

  // Standard persona (commuter, general public)
  if (maxNaqi <= 100) {
    return {
      status: "safe",
      advisory: "Air quality is Good to Satisfactory. Normal outdoor activities permitted.",
    };
  }
  if (maxNaqi <= 200) {
    return {
      status: "caution",
      advisory:
        "Moderate pollution. Consider wearing an N95 mask during prolonged outdoor exposure or heavy traffic.",
    };
  }
  return {
    status: "avoid_outdoors",
    advisory:
      "Unhealthy air (NAQI > 200). Minimize outdoor time, avoid strenuous exertion, and wear an N95 mask outside.",
  };
}

// ─── Main Optimizer ─────────────────────────────────────────────────

/**
 * Analyzes an hourly air quality forecast to determine optimal activity and ventilation windows.
 *
 * @param forecast Array of consecutive hourly air points (typically 24–48 hours).
 * @param profile Optional household profile for persona-specific sensitivity adjustments.
 */
export function optimizeExposureWindows(
  forecast: HourlyAirPoint[],
  profile?: Partial<HouseholdProfile> | null
): ExposureWindowsAnalysis {
  // Graceful handling of empty or insufficient forecast
  if (!forecast || forecast.length < 2) {
    const emptyDayparts: Record<DaypartName, DaypartSummary> = {
      morning: {
        daypart: "morning",
        label: "Morning",
        hoursRange: "06:00 – 12:00",
        avgPm25: null,
        maxNaqi: 0,
        dominantCategory: "Good",
        safetyStatus: "safe",
        advisory: "No forecast data available.",
        pointCount: 0,
      },
      afternoon: {
        daypart: "afternoon",
        label: "Afternoon",
        hoursRange: "12:00 – 17:00",
        avgPm25: null,
        maxNaqi: 0,
        dominantCategory: "Good",
        safetyStatus: "safe",
        advisory: "No forecast data available.",
        pointCount: 0,
      },
      evening: {
        daypart: "evening",
        label: "Evening",
        hoursRange: "17:00 – 22:00",
        avgPm25: null,
        maxNaqi: 0,
        dominantCategory: "Good",
        safetyStatus: "safe",
        advisory: "No forecast data available.",
        pointCount: 0,
      },
      night: {
        daypart: "night",
        label: "Night",
        hoursRange: "22:00 – 06:00",
        avgPm25: null,
        maxNaqi: 0,
        dominantCategory: "Good",
        safetyStatus: "safe",
        advisory: "No forecast data available.",
        pointCount: 0,
      },
    };

    return {
      dayparts: emptyDayparts,
      bestOutdoorWindow: null,
      worstSmogWindow: null,
      pm25ReductionPercent: 0,
      bestVentilationWindow: null,
      ventilationReason: "Insufficient forecast data to determine ventilation window.",
      forecastCount: forecast ? forecast.length : 0,
    };
  }

  // 1. Group points into dayparts
  const daypartGroups: Record<DaypartName, HourlyAirPoint[]> = {
    morning: [],
    afternoon: [],
    evening: [],
    night: [],
  };

  for (const point of forecast) {
    const hour = parseHourFromIso(point.timeIso);
    const daypart = getDaypartForHour(hour);
    daypartGroups[daypart].push(point);
  }

  const dayparts: Record<DaypartName, DaypartSummary> = {
    morning: summarizeDaypart("morning", "Morning", "06:00 – 12:00", daypartGroups.morning, profile),
    afternoon: summarizeDaypart("afternoon", "Afternoon", "12:00 – 17:00", daypartGroups.afternoon, profile),
    evening: summarizeDaypart("evening", "Evening", "17:00 – 22:00", daypartGroups.evening, profile),
    night: summarizeDaypart("night", "Night", "22:00 – 06:00", daypartGroups.night, profile),
  };

  // 2. Compute 2-hour rolling windows
  const rollingWindows: RollingWindow[] = [];

  for (let i = 0; i < forecast.length - 1; i++) {
    const p1 = forecast[i];
    const p2 = forecast[i + 1];
    const h1 = parseHourFromIso(p1.timeIso);
    const h2 = parseHourFromIso(p2.timeIso);

    // Sum PM2.5 readings
    const validPm25s: number[] = [];
    if (p1.pm25 !== null && p1.pm25 !== undefined) validPm25s.push(p1.pm25);
    if (p2.pm25 !== null && p2.pm25 !== undefined) validPm25s.push(p2.pm25);

    const avgPm25 =
      validPm25s.length > 0
        ? Number((validPm25s.reduce((a, b) => a + b, 0) / validPm25s.length).toFixed(1))
        : 0;

    const avgNaqi = Math.round((p1.estimatedNaqi + p2.estimatedNaqi) / 2);

    rollingWindows.push({
      startTimeIso: p1.timeIso,
      endTimeIso: p2.timeIso,
      startHour: h1,
      endHour: (h2 + 1) % 24,
      avgPm25,
      avgNaqi,
      category: getNaqiCategory(avgNaqi),
    });
  }

  // 3. Find daytime windows (06:00 to 21:00)
  // Both points should fall within daytime hours (6 to 21 inclusive)
  const daytimeWindows = rollingWindows.filter(
    (w) => w.startHour >= 6 && w.startHour <= 20
  );

  const candidateWindows = daytimeWindows.length > 0 ? daytimeWindows : rollingWindows;

  let bestOutdoorWindow: RollingWindow | null = null;
  let worstSmogWindow: RollingWindow | null = null;

  for (const win of candidateWindows) {
    if (!bestOutdoorWindow || win.avgPm25 < bestOutdoorWindow.avgPm25) {
      bestOutdoorWindow = win;
    }
    if (!worstSmogWindow || win.avgPm25 > worstSmogWindow.avgPm25) {
      worstSmogWindow = win;
    }
  }

  // Calculate PM2.5 reduction percent
  let pm25ReductionPercent = 0;
  if (
    worstSmogWindow &&
    bestOutdoorWindow &&
    worstSmogWindow.avgPm25 > 0 &&
    worstSmogWindow.avgPm25 > bestOutdoorWindow.avgPm25
  ) {
    const rawReduction =
      ((worstSmogWindow.avgPm25 - bestOutdoorWindow.avgPm25) /
        worstSmogWindow.avgPm25) *
      100;
    pm25ReductionPercent = Number(rawReduction.toFixed(1));
  }

  // 4. Determine ventilation window
  let bestVentilationWindow: RollingWindow | null = null;
  let ventilationReason = "";

  if (bestOutdoorWindow && bestOutdoorWindow.avgNaqi <= 100) {
    bestVentilationWindow = bestOutdoorWindow;
    ventilationReason = `Cleanest daytime window from ${formatHour(bestOutdoorWindow.startHour)} to ${formatHour(bestOutdoorWindow.endHour)} has NAQI ${bestOutdoorWindow.avgNaqi} (${bestOutdoorWindow.category}). Safe for brief open-window ventilation.`;
  } else {
    bestVentilationWindow = null;
    const cleanestNaqi = bestOutdoorWindow ? bestOutdoorWindow.avgNaqi : 0;
    ventilationReason = `Outdoor air remains too polluted for open-window ventilation (cleanest daytime NAQI is ${cleanestNaqi} > 100). Keep windows sealed and run indoor air filtration.`;
  }

  return {
    dayparts,
    bestOutdoorWindow,
    worstSmogWindow,
    pm25ReductionPercent,
    bestVentilationWindow,
    ventilationReason,
    forecastCount: forecast.length,
  };
}

// ─── Helper Functions ───────────────────────────────────────────────

function summarizeDaypart(
  daypart: DaypartName,
  label: string,
  hoursRange: string,
  points: HourlyAirPoint[],
  profile?: Partial<HouseholdProfile> | null
): DaypartSummary {
  if (points.length === 0) {
    return {
      daypart,
      label,
      hoursRange,
      avgPm25: null,
      maxNaqi: 0,
      dominantCategory: "Good",
      safetyStatus: "safe",
      advisory: "No points recorded in this daypart.",
      pointCount: 0,
    };
  }

  const validPm25s = points
    .map((p) => p.pm25)
    .filter((v): v is number => v !== null && v !== undefined);

  const avgPm25 =
    validPm25s.length > 0
      ? Number((validPm25s.reduce((a, b) => a + b, 0) / validPm25s.length).toFixed(1))
      : null;

  const maxNaqi = Math.max(...points.map((p) => p.estimatedNaqi));
  const dominantCategory = getNaqiCategory(maxNaqi);
  const { status, advisory } = evaluateSafetyStatus(maxNaqi, profile);

  return {
    daypart,
    label,
    hoursRange,
    avgPm25,
    maxNaqi,
    dominantCategory,
    safetyStatus: status,
    advisory,
    pointCount: points.length,
  };
}

function formatHour(h: number): string {
  const padded = h.toString().padStart(2, "0");
  return `${padded}:00`;
}
