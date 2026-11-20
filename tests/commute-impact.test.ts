import { describe, it, expect } from "vitest";
import {
  analyzeCommuteImpact,
  MICROENVIRONMENT_FACTORS,
  VENTILATION_RATES,
  EMISSIONS_PER_KM,
  MASK_PENETRATION_FACTORS,
} from "@/lib/calculators/commute-impact";
import { HouseholdProfile } from "@/types/air-quality";

describe("Commute Mode Exposure & Emissions Optimizer", () => {
  const baseProfile: HouseholdProfile = {
    persona: "commuter",
    hasRespiratorySensitivity: false,
    commuteDistanceKm: 15, // Round-trip = 30 km
    currentCommuteMode: "petrol_car",
    maskType: "none",
    hasAirPurifier: false,
    windowsState: "sealed",
    usesIncenseOrSolidFuel: false,
  };

  // ─── Evaluation of all 6 modes ──────────────────────────────────────
  describe("All 6 transit modes evaluated", () => {
    it("evaluates petrol_car, two_wheeler, metro_transit, carpool, bicycle_walk, and work_from_home", () => {
      const outdoorPm25 = 150; // µg/m³
      const outdoorNaqi = 250; // Poor

      const result = analyzeCommuteImpact(baseProfile, outdoorPm25, outdoorNaqi);

      expect(result.roundTripKm).toBe(30);
      expect(result.modes).toHaveLength(6);

      const modesMap = new Map(result.modes.map((m) => [m.mode, m]));

      expect(modesMap.has("petrol_car")).toBe(true);
      expect(modesMap.has("two_wheeler")).toBe(true);
      expect(modesMap.has("metro_transit")).toBe(true);
      expect(modesMap.has("carpool")).toBe(true);
      expect(modesMap.has("bicycle_walk")).toBe(true);
      expect(modesMap.has("work_from_home")).toBe(true);

      // Verify work_from_home has zero emissions and zero inhaled PM2.5
      const wfh = modesMap.get("work_from_home")!;
      expect(wfh.inhaledPm25Ug).toBe(0);
      expect(wfh.dailyCo2Grams).toBe(0);
      expect(wfh.dailyPm25EmittedGrams).toBe(0);
      expect(wfh.roundTripMinutes).toBe(0);

      // Verify two-wheeler has highest microenvironment factor (1.35)
      expect(MICROENVIRONMENT_FACTORS.two_wheeler).toBe(1.35);

      // Verify bicycle/walk has highest ventilation rate (1.80 m³/hr)
      expect(VENTILATION_RATES.bicycle_walk).toBe(1.8);
    });
  });

  // ─── N95 90% Dose Reduction ─────────────────────────────────────────
  describe("Mask upgrade impact", () => {
    it("verifies N95 cuts inhaled dose by exactly 90% vs no mask", () => {
      const unmaskedProfile: HouseholdProfile = {
        ...baseProfile,
        maskType: "none", // 100% penetration
      };
      const outdoorPm25 = 200;
      const outdoorNaqi = 320;

      const result = analyzeCommuteImpact(unmaskedProfile, outdoorPm25, outdoorNaqi);

      expect(MASK_PENETRATION_FACTORS.none).toBe(1.0);
      expect(MASK_PENETRATION_FACTORS.n95).toBe(0.1);

      // N95 reduces penetration from 1.0 to 0.10 -> 90% reduction
      expect(result.maskUpgradeImpact.percentSaved).toBe(90.0);
      expect(result.maskUpgradeImpact.savedInhaledUg).toBeGreaterThan(0);
      expect(result.maskUpgradeImpact.currentMask).toBe("none");
      expect(result.maskUpgradeImpact.upgradedMask).toBe("n95");
    });

    it("reports 0% saved when user is already wearing an N95", () => {
      const n95Profile: HouseholdProfile = {
        ...baseProfile,
        maskType: "n95",
      };

      const result = analyzeCommuteImpact(n95Profile, 100, 180);
      expect(result.maskUpgradeImpact.percentSaved).toBe(0);
      expect(result.maskUpgradeImpact.savedInhaledUg).toBe(0);
      expect(result.maskUpgradeImpact.explanation).toContain("already using an N95");
    });
  });

  // ─── Critical Safety Guard: Never Recommend bicycle_walk when NAQI > 200 ───
  describe("Critical safety guard for active transit", () => {
    it("NEVER recommends bicycle_walk when outdoor NAQI > 200 despite 0 emissions", () => {
      const petrolCarProfile: HouseholdProfile = {
        ...baseProfile,
        currentCommuteMode: "petrol_car",
      };

      // Severe smog scenario: NAQI 350
      const result = analyzeCommuteImpact(petrolCarProfile, 220, 350);

      // bicycle_walk has 0 CO2, but MUST NOT be recommended
      expect(result.recommendedAlternative).not.toBeNull();
      expect(result.recommendedAlternative!.mode).not.toBe("bicycle_walk");

      // Verify bicycle_walk is marked non-viable as alternative when NAQI > 200
      const bikeMode = result.modes.find((m) => m.mode === "bicycle_walk")!;
      expect(bikeMode.isViableAlternative).toBe(false);
      expect(bikeMode.healthAdvisory).toContain("CRITICAL ADVISORY");
      expect(bikeMode.healthAdvisory).toContain("Avoid active transit");

      // Recommended mode should prioritize metro_transit, carpool, or WFH
      expect(["work_from_home", "metro_transit", "carpool"]).toContain(
        result.recommendedAlternative!.mode
      );
    });

    it("allows bicycle_walk when outdoor NAQI <= 200", () => {
      const cleanAirProfile: HouseholdProfile = {
        ...baseProfile,
        currentCommuteMode: "petrol_car",
        commuteDistanceKm: 3, // short 6 km round-trip
      };

      const result = analyzeCommuteImpact(cleanAirProfile, 35, 75); // Satisfactory NAQI 75
      const bikeMode = result.modes.find((m) => m.mode === "bicycle_walk")!;
      expect(bikeMode.isViableAlternative).toBe(true);
      expect(bikeMode.healthAdvisory).toContain("Healthy choice");
    });
  });

  // ─── 22-Day Monthly CO2 Savings Math ────────────────────────────────
  describe("Monthly emissions calculations (22 workdays)", () => {
    it("calculates accurate 22-day monthly CO2 and PM2.5 savings", () => {
      const carProfile: HouseholdProfile = {
        ...baseProfile,
        commuteDistanceKm: 10, // 20 km round-trip
        currentCommuteMode: "petrol_car",
      };

      // Petrol car: 170 g CO2/km -> 20 km * 170 = 3400 g CO2/day
      // Metro: 28 g CO2/km -> 20 km * 28 = 560 g CO2/day
      // Daily difference = 3400 - 560 = 2840 g = 2.84 kg
      // Monthly 22 days = 2.84 * 22 = 62.48 kg CO2 saved
      const result = analyzeCommuteImpact(carProfile, 100, 180);
      const metro = result.modes.find((m) => m.mode === "metro_transit")!;

      expect(metro.dailyCo2Grams).toBe(560);
      expect(metro.monthlyCo2SavedKg).toBe(62.48);

      // Tailpipe PM2.5:
      // Petrol car: 0.045 g/km -> 20 km * 0.045 = 0.9 g/day
      // Metro: 0.005 g/km -> 20 km * 0.005 = 0.1 g/day
      // Difference = 0.8 g/day * 22 days = 17.6 g PM2.5 saved
      expect(metro.dailyPm25EmittedGrams).toBe(0.1);
      expect(metro.monthlyPm25SavedGrams).toBe(17.6);
    });
  });

  // ─── Zero-Distance & WFH Edge Case ─────────────────────────────────
  describe("Zero-distance and remote work edge cases", () => {
    it("handles zero commute distance cleanly", () => {
      const zeroDistProfile: HouseholdProfile = {
        ...baseProfile,
        commuteDistanceKm: 0,
      };

      const result = analyzeCommuteImpact(zeroDistProfile, 150, 250);
      expect(result.roundTripKm).toBe(0);
      for (const m of result.modes) {
        expect(m.inhaledPm25Ug).toBe(0);
        expect(m.dailyCo2Grams).toBe(0);
        expect(m.monthlyCo2SavedKg).toBe(0);
      }
    });

    it("handles user already on work_from_home", () => {
      const wfhProfile: HouseholdProfile = {
        ...baseProfile,
        currentCommuteMode: "work_from_home",
      };

      const result = analyzeCommuteImpact(wfhProfile, 150, 250);
      expect(result.recommendedAlternative).toBeNull(); // Already at optimal
    });
  });
});
