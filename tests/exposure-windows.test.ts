import { describe, it, expect } from "vitest";
import {
  optimizeExposureWindows,
  parseHourFromIso,
  getDaypartForHour,
} from "@/lib/calculators/exposure-windows";
import { HourlyAirPoint, HouseholdProfile } from "@/types/air-quality";

describe("Hourly Exposure Window Optimizer", () => {
  // ─── Hour Extraction & Daypart Grouping ─────────────────────────────
  describe("parseHourFromIso & getDaypartForHour", () => {
    it("extracts 24h clock hour from various ISO formats", () => {
      expect(parseHourFromIso("2026-11-20T08:00:00+05:30")).toBe(8);
      expect(parseHourFromIso("2026-11-20T14:30:00+05:30")).toBe(14);
      expect(parseHourFromIso("2026-11-20T00:00:00+05:30")).toBe(0);
      expect(parseHourFromIso("2026-11-20T23:59:59+05:30")).toBe(23);
    });

    it("maps hours correctly to dayparts", () => {
      expect(getDaypartForHour(6)).toBe("morning");
      expect(getDaypartForHour(11)).toBe("morning");
      expect(getDaypartForHour(12)).toBe("afternoon");
      expect(getDaypartForHour(16)).toBe("afternoon");
      expect(getDaypartForHour(17)).toBe("evening");
      expect(getDaypartForHour(21)).toBe("evening");
      expect(getDaypartForHour(22)).toBe("night");
      expect(getDaypartForHour(2)).toBe("night");
    });
  });

  // ─── Delhi Winter Inversion Curve ──────────────────────────────────
  describe("Delhi winter thermal inversion diurnal profile", () => {
    // Classic Delhi winter profile:
    // Heavy smog early morning (thermal inversion trapping pollutants),
    // solar boundary layer expansion clears air in early afternoon (13:00–16:00),
    // radiation cooling rebuilds inversion in late evening & night.
    const createDelhiDayForecast = (): HourlyAirPoint[] => {
      const forecast: HourlyAirPoint[] = [];
      const baseDate = "2026-11-20";

      // 24 hours from 00:00 to 23:00
      const pm25Hourly = [
        280, 310, 340, 360, 380, 350, // 00 - 05: Night severe
        320, 290, 250, 210, 160, 110, // 06 - 11: Morning high smog clearing
        75, 60, 55, 65, 80,           // 12 - 16: Afternoon cleanest solar window
        140, 190, 230, 270, 300,      // 17 - 21: Evening traffic + inversion rebuild
        320, 340                      // 22 - 23: Night severe
      ];

      for (let h = 0; h < 24; h++) {
        const hourStr = h.toString().padStart(2, "0");
        const pm25 = pm25Hourly[h];
        forecast.push({
          timeIso: `${baseDate}T${hourStr}:00:00+05:30`,
          pm25,
          pm10: pm25 * 1.6,
          estimatedNaqi: pm25 > 250 ? 410 : pm25 > 120 ? 320 : pm25 > 90 ? 220 : pm25 > 60 ? 120 : 80,
          category: pm25 > 250 ? "Severe" : pm25 > 120 ? "Very Poor" : pm25 > 90 ? "Poor" : pm25 > 60 ? "Moderate" : "Satisfactory",
        });
      }
      return forecast;
    };

    it("identifies afternoon as cleanest window and morning/night as worst", () => {
      const forecast = createDelhiDayForecast();
      const analysis = optimizeExposureWindows(forecast);

      // Best window should be in the afternoon (around 13:00–15:00)
      expect(analysis.bestOutdoorWindow).not.toBeNull();
      expect(analysis.bestOutdoorWindow!.startHour).toBeGreaterThanOrEqual(12);
      expect(analysis.bestOutdoorWindow!.startHour).toBeLessThanOrEqual(15);
      expect(analysis.bestOutdoorWindow!.avgPm25).toBeLessThan(70);

      // Worst daytime smog window should be morning (e.g. 06:00-08:00)
      expect(analysis.worstSmogWindow).not.toBeNull();
      expect(analysis.worstSmogWindow!.startHour).toBeLessThanOrEqual(10);
      expect(analysis.worstSmogWindow!.avgPm25).toBeGreaterThan(250);

      // Rescheduling should yield significant PM2.5 reduction (>60%)
      expect(analysis.pm25ReductionPercent).toBeGreaterThan(60);

      // Check dayparts
      expect(analysis.dayparts.morning.safetyStatus).toBe("avoid_outdoors");
      expect(analysis.dayparts.afternoon.safetyStatus).toBe("caution"); // or safe based on maxNaqi
      expect(analysis.dayparts.night.safetyStatus).toBe("avoid_outdoors");
    });
  });

  // ─── Severe All-Day Smog & Ventilation Window ───────────────────────
  describe("Severe all-day forecast returning bestVentilationWindow: null", () => {
    it("returns null ventilation window when all hours exceed NAQI 100", () => {
      const severeForecast: HourlyAirPoint[] = [];
      for (let h = 6; h <= 21; h++) {
        const hourStr = h.toString().padStart(2, "0");
        severeForecast.push({
          timeIso: `2026-11-20T${hourStr}:00:00+05:30`,
          pm25: 220,
          pm10: 380,
          estimatedNaqi: 350,
          category: "Very Poor",
        });
      }

      const analysis = optimizeExposureWindows(severeForecast);
      expect(analysis.bestVentilationWindow).toBeNull();
      expect(analysis.ventilationReason).toContain("Outdoor air remains too polluted");
      expect(analysis.ventilationReason).toContain("> 100");
    });

    it("returns active ventilation window when cleanest daytime window has NAQI <= 100", () => {
      const cleanAfternoonForecast: HourlyAirPoint[] = [];
      for (let h = 6; h <= 21; h++) {
        const hourStr = h.toString().padStart(2, "0");
        const pm25 = h >= 13 && h <= 15 ? 25 : 120;
        const naqi = h >= 13 && h <= 15 ? 45 : 280;
        cleanAfternoonForecast.push({
          timeIso: `2026-11-20T${hourStr}:00:00+05:30`,
          pm25,
          pm10: pm25 * 1.5,
          estimatedNaqi: naqi,
          category: naqi <= 50 ? "Good" : "Poor",
        });
      }

      const analysis = optimizeExposureWindows(cleanAfternoonForecast);
      expect(analysis.bestVentilationWindow).not.toBeNull();
      expect(analysis.bestVentilationWindow!.avgNaqi).toBeLessThanOrEqual(100);
      expect(analysis.ventilationReason).toContain("Safe for brief open-window ventilation");
    });
  });

  // ─── Persona Sensitivity Tightening ────────────────────────────────
  describe("Persona sensitivity adjustments", () => {
    const borderlineForecast: HourlyAirPoint[] = [
      {
        timeIso: "2026-11-20T08:00:00+05:30",
        pm25: 75,
        pm10: 120,
        estimatedNaqi: 170, // Moderate (101-200)
        category: "Moderate",
      },
      {
        timeIso: "2026-11-20T09:00:00+05:30",
        pm25: 80,
        pm10: 130,
        estimatedNaqi: 175,
        category: "Moderate",
      },
    ];

    it("applies stricter avoid_outdoors (>150) for family_with_kids and respiratory sensitivity", () => {
      const standardProfile: Partial<HouseholdProfile> = {
        persona: "commuter",
        hasRespiratorySensitivity: false,
      };

      const sensitiveProfile: Partial<HouseholdProfile> = {
        persona: "family_with_kids",
        hasRespiratorySensitivity: false,
      };

      const respiratoryProfile: Partial<HouseholdProfile> = {
        persona: "commuter",
        hasRespiratorySensitivity: true,
      };

      const resStandard = optimizeExposureWindows(borderlineForecast, standardProfile);
      const resSensitive = optimizeExposureWindows(borderlineForecast, sensitiveProfile);
      const resResp = optimizeExposureWindows(borderlineForecast, respiratoryProfile);

      // NAQI 175: Standard commuter gets 'caution'
      expect(resStandard.dayparts.morning.safetyStatus).toBe("caution");

      // NAQI 175: Sensitive persona gets 'avoid_outdoors' (>150 threshold)
      expect(resSensitive.dayparts.morning.safetyStatus).toBe("avoid_outdoors");
      expect(resResp.dayparts.morning.safetyStatus).toBe("avoid_outdoors");
    });

    it("flags strenuous exercise caution for student_athlete starting at NAQI > 100", () => {
      const athleteForecast: HourlyAirPoint[] = [
        {
          timeIso: "2026-11-20T07:00:00+05:30",
          pm25: 65,
          pm10: 110,
          estimatedNaqi: 115,
          category: "Moderate",
        },
        {
          timeIso: "2026-11-20T08:00:00+05:30",
          pm25: 68,
          pm10: 115,
          estimatedNaqi: 120,
          category: "Moderate",
        },
      ];

      const athleteProfile: Partial<HouseholdProfile> = {
        persona: "student_athlete",
        hasRespiratorySensitivity: false,
      };

      const analysis = optimizeExposureWindows(athleteForecast, athleteProfile);
      expect(analysis.dayparts.morning.safetyStatus).toBe("caution");
      expect(analysis.dayparts.morning.advisory).toContain("Caution for athletes");
    });
  });

  // ─── Edge Cases (< 2 points or empty) ───────────────────────────────
  describe("Empty or short forecast arrays", () => {
    it("handles empty forecast without throwing", () => {
      const result = optimizeExposureWindows([]);
      expect(result.bestOutdoorWindow).toBeNull();
      expect(result.worstSmogWindow).toBeNull();
      expect(result.pm25ReductionPercent).toBe(0);
      expect(result.bestVentilationWindow).toBeNull();
      expect(result.forecastCount).toBe(0);
      expect(result.ventilationReason).toContain("Insufficient forecast data");
    });

    it("handles 1-point forecast without throwing", () => {
      const singlePoint: HourlyAirPoint[] = [
        {
          timeIso: "2026-11-20T08:00:00+05:30",
          pm25: 50,
          pm10: 80,
          estimatedNaqi: 90,
          category: "Satisfactory",
        },
      ];

      const result = optimizeExposureWindows(singlePoint);
      expect(result.bestOutdoorWindow).toBeNull();
      expect(result.worstSmogWindow).toBeNull();
      expect(result.pm25ReductionPercent).toBe(0);
      expect(result.forecastCount).toBe(1);
    });
  });
});
