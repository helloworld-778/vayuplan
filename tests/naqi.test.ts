import { describe, it, expect } from "vitest";
import {
  calculatePollutantSubIndex,
  calculateNaqi,
  getNaqiCategory,
} from "@/lib/aqi/naqi";
import { PollutantReadings } from "@/types/air-quality";

describe("Official CPCB NAQI Calculator", () => {
  // ─── Category Mapping ───────────────────────────────────────────────
  describe("getNaqiCategory", () => {
    it("maps 0-50 to Good", () => {
      expect(getNaqiCategory(0)).toBe("Good");
      expect(getNaqiCategory(25)).toBe("Good");
      expect(getNaqiCategory(50)).toBe("Good");
    });

    it("maps 51-100 to Satisfactory", () => {
      expect(getNaqiCategory(51)).toBe("Satisfactory");
      expect(getNaqiCategory(75)).toBe("Satisfactory");
      expect(getNaqiCategory(100)).toBe("Satisfactory");
    });

    it("maps 101-200 to Moderate", () => {
      expect(getNaqiCategory(101)).toBe("Moderate");
      expect(getNaqiCategory(150)).toBe("Moderate");
      expect(getNaqiCategory(200)).toBe("Moderate");
    });

    it("maps 201-300 to Poor", () => {
      expect(getNaqiCategory(201)).toBe("Poor");
      expect(getNaqiCategory(250)).toBe("Poor");
      expect(getNaqiCategory(300)).toBe("Poor");
    });

    it("maps 301-400 to Very Poor", () => {
      expect(getNaqiCategory(301)).toBe("Very Poor");
      expect(getNaqiCategory(350)).toBe("Very Poor");
      expect(getNaqiCategory(400)).toBe("Very Poor");
    });

    it("maps 401-500+ to Severe", () => {
      expect(getNaqiCategory(401)).toBe("Severe");
      expect(getNaqiCategory(500)).toBe("Severe");
      expect(getNaqiCategory(600)).toBe("Severe");
    });
  });

  // ─── Exact CPCB Breakpoint Transitions ─────────────────────────────
  describe("calculatePollutantSubIndex breakpoints", () => {
    describe("PM2.5 [0-30->0-50, 30-60->51-100, 60-90->101-200, 90-120->201-300, 120-250->301-400, 250-380->401-500]", () => {
      it("calculates zero and boundary values correctly", () => {
        expect(calculatePollutantSubIndex("pm25", 0)).toBe(0);
        expect(calculatePollutantSubIndex("pm25", 30)).toBe(50);
        expect(calculatePollutantSubIndex("pm25", 60)).toBe(100);
        expect(calculatePollutantSubIndex("pm25", 90)).toBe(200);
        expect(calculatePollutantSubIndex("pm25", 120)).toBe(300);
        expect(calculatePollutantSubIndex("pm25", 250)).toBe(400);
        expect(calculatePollutantSubIndex("pm25", 380)).toBe(500);
      });

      it("calculates midpoints accurately via linear interpolation", () => {
        // PM2.5 = 15: (50/30) * 15 = 25
        expect(calculatePollutantSubIndex("pm25", 15)).toBe(25);
        // PM2.5 = 45: ((100-51)/(60-30)) * 15 + 51 = 1.6333 * 15 + 51 = 24.5 + 51 = 75.5 -> 76
        expect(calculatePollutantSubIndex("pm25", 45)).toBe(76);
      });
    });

    describe("PM10 [0-50->0-50, 50-100->51-100, 100-250->101-200, 250-350->201-300, 350-430->301-400, 430-510->401-500]", () => {
      it("calculates boundary values correctly", () => {
        expect(calculatePollutantSubIndex("pm10", 0)).toBe(0);
        expect(calculatePollutantSubIndex("pm10", 50)).toBe(50);
        expect(calculatePollutantSubIndex("pm10", 100)).toBe(100);
        expect(calculatePollutantSubIndex("pm10", 250)).toBe(200);
        expect(calculatePollutantSubIndex("pm10", 350)).toBe(300);
        expect(calculatePollutantSubIndex("pm10", 430)).toBe(400);
        expect(calculatePollutantSubIndex("pm10", 510)).toBe(500);
      });
    });

    describe("NO2 [0-40->0-50, 40-80->51-100, 80-180->101-200, 180-280->201-300, 280-400->301-400, 400-520->401-500]", () => {
      it("calculates boundary values correctly", () => {
        expect(calculatePollutantSubIndex("no2", 40)).toBe(50);
        expect(calculatePollutantSubIndex("no2", 80)).toBe(100);
        expect(calculatePollutantSubIndex("no2", 180)).toBe(200);
        expect(calculatePollutantSubIndex("no2", 280)).toBe(300);
        expect(calculatePollutantSubIndex("no2", 400)).toBe(400);
        expect(calculatePollutantSubIndex("no2", 520)).toBe(500);
      });
    });

    describe("SO2 [0-40->0-50, 40-80->51-100, 80-380->101-200, 380-800->201-300, 800-1600->301-400, 1600-2100->401-500]", () => {
      it("calculates boundary values correctly", () => {
        expect(calculatePollutantSubIndex("so2", 40)).toBe(50);
        expect(calculatePollutantSubIndex("so2", 80)).toBe(100);
        expect(calculatePollutantSubIndex("so2", 380)).toBe(200);
        expect(calculatePollutantSubIndex("so2", 800)).toBe(300);
        expect(calculatePollutantSubIndex("so2", 1600)).toBe(400);
        expect(calculatePollutantSubIndex("so2", 2100)).toBe(500);
      });
    });

    describe("O3 [0-50->0-50, 50-100->51-100, 100-168->101-200, 168-208->201-300, 208-748->301-400, 748-1000->401-500]", () => {
      it("calculates boundary values correctly", () => {
        expect(calculatePollutantSubIndex("o3", 50)).toBe(50);
        expect(calculatePollutantSubIndex("o3", 100)).toBe(100);
        expect(calculatePollutantSubIndex("o3", 168)).toBe(200);
        expect(calculatePollutantSubIndex("o3", 208)).toBe(300);
        expect(calculatePollutantSubIndex("o3", 748)).toBe(400);
        expect(calculatePollutantSubIndex("o3", 1000)).toBe(500);
      });
    });

    describe("CO conversion (input µg/m³ -> mg/m³ via co / 1000)", () => {
      it("verifies 2000 µg/m³ = 2.0 mg/m³ = sub-index 100, NOT 500", () => {
        // 2000 µg/m³ = 2.0 mg/m³, which is the top of bracket 1.0-2.0 -> sub-index 100
        expect(calculatePollutantSubIndex("co", 2000)).toBe(100);
      });

      it("calculates other CO breakpoints correctly", () => {
        expect(calculatePollutantSubIndex("co", 1000)).toBe(50);   // 1.0 mg/m³
        expect(calculatePollutantSubIndex("co", 10000)).toBe(200); // 10.0 mg/m³
        expect(calculatePollutantSubIndex("co", 17000)).toBe(300); // 17.0 mg/m³
        expect(calculatePollutantSubIndex("co", 34000)).toBe(400); // 34.0 mg/m³
        expect(calculatePollutantSubIndex("co", 50000)).toBe(500); // 50.0 mg/m³
      });
    });
  });

  // ─── Clamping & Edge Cases ──────────────────────────────────────────
  describe("clamping and invalid inputs", () => {
    it("clamps sub-index to 500 when concentration exceeds top breakpoint", () => {
      expect(calculatePollutantSubIndex("pm25", 500)).toBe(500);
      expect(calculatePollutantSubIndex("pm25", 1200)).toBe(500);
      expect(calculatePollutantSubIndex("pm10", 800)).toBe(500);
      expect(calculatePollutantSubIndex("co", 90000)).toBe(500);
    });

    it("returns null for negative, NaN, or non-finite numbers", () => {
      expect(calculatePollutantSubIndex("pm25", -10)).toBeNull();
      expect(calculatePollutantSubIndex("pm25", NaN)).toBeNull();
      expect(calculatePollutantSubIndex("pm25", Infinity)).toBeNull();
      expect(calculatePollutantSubIndex("pm25", null)).toBeNull();
      expect(calculatePollutantSubIndex("pm25", undefined)).toBeNull();
    });
  });

  // ─── Aggregate calculateNaqi ────────────────────────────────────────
  describe("calculateNaqi", () => {
    it("identifies dominant pollutant and computes max sub-index", () => {
      const readings: PollutantReadings = {
        pm25: 120, // sub-index: 300
        pm10: 100, // sub-index: 100
        no2: 40,   // sub-index: 50
        o3: null,
        co: null,
        so2: null,
      };

      const result = calculateNaqi(readings);
      expect(result.naqi).toBe(300);
      expect(result.dominantPollutant).toBe("pm25");
      expect(result.category).toBe("Poor");
      expect(result.pollutantCount).toBe(3);
      expect(result.meetsCpcbMinimum).toBe(true);
    });

    it("verifies meetsCpcbMinimum requirement: >=3 pollutants and at least one is pm25 or pm10", () => {
      // Case 1: 3 pollutants including PM2.5 -> meets
      const meets1: PollutantReadings = {
        pm25: 60,
        no2: 40,
        so2: 40,
        pm10: null,
        o3: null,
        co: null,
      };
      expect(calculateNaqi(meets1).meetsCpcbMinimum).toBe(true);

      // Case 2: 3 pollutants without PM2.5 or PM10 -> does not meet
      const noParticulate: PollutantReadings = {
        pm25: null,
        pm10: null,
        no2: 40,
        so2: 40,
        co: 1000,
        o3: null,
      };
      const resultNoPart = calculateNaqi(noParticulate);
      expect(resultNoPart.meetsCpcbMinimum).toBe(false);
      expect(resultNoPart.naqi).toBe(50); // Still computes gracefully!

      // Case 3: Only 2 pollutants (even with PM2.5) -> does not meet
      const onlyTwo: PollutantReadings = {
        pm25: 85,
        pm10: 150,
        no2: null,
        so2: null,
        co: null,
        o3: null,
      };
      const resultOnlyTwo = calculateNaqi(onlyTwo);
      expect(resultOnlyTwo.meetsCpcbMinimum).toBe(false);
      expect(resultOnlyTwo.pollutantCount).toBe(2);
      expect(resultOnlyTwo.naqi).toBeGreaterThan(0); // Computes max sub-index
    });

    it("handles all-null readings cleanly", () => {
      const allNull: PollutantReadings = {
        pm25: null,
        pm10: null,
        no2: null,
        o3: null,
        co: null,
        so2: null,
      };
      const result = calculateNaqi(allNull);
      expect(result.naqi).toBe(0);
      expect(result.category).toBe("Good");
      expect(result.dominantPollutant).toBeNull();
      expect(result.pollutantCount).toBe(0);
      expect(result.meetsCpcbMinimum).toBe(false);
    });
  });
});
