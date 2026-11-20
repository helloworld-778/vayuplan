import { describe, it, expect } from "vitest";
import {
  calculateIndoorPm25,
  analyzeIndoorAir,
  getVentilationDirective,
  INFILTRATION_FACTORS,
  PURIFIER_REDUCTION_FACTORS,
  BASELINE_INDOOR_SOURCE_UG_M3,
  INCENSE_SOLID_FUEL_PENALTY_UG_M3,
} from "@/lib/calculators/indoor-air";
import { HouseholdProfile } from "@/types/air-quality";

describe("Indoor Air Quality Infiltration & Action Lab", () => {
  const baseProfile: HouseholdProfile = {
    persona: "family_with_kids",
    hasRespiratorySensitivity: false,
    commuteDistanceKm: 10,
    currentCommuteMode: "metro_transit",
    maskType: "n95",
    hasAirPurifier: false,
    windowsState: "open",
    usesIncenseOrSolidFuel: true,
  };

  // ─── Open vs Sealed Infiltration ───────────────────────────────────
  describe("Open vs Sealed Infiltration physics", () => {
    it("reflects envelope protection: 85% open vs 35% sealed", () => {
      expect(INFILTRATION_FACTORS.open).toBe(0.85);
      expect(INFILTRATION_FACTORS.cracked).toBe(0.60);
      expect(INFILTRATION_FACTORS.sealed).toBe(0.35);

      const outdoorPm25 = 200; // µg/m³
      // No incense, no purifier to isolate envelope physics
      // Open: 200 * 0.85 + 10 = 170 + 10 = 180 µg/m³
      const indoorOpen = calculateIndoorPm25(outdoorPm25, "open", false, false);
      expect(indoorOpen).toBe(180.0);

      // Cracked: 200 * 0.60 + 10 = 120 + 10 = 130 µg/m³
      const indoorCracked = calculateIndoorPm25(outdoorPm25, "cracked", false, false);
      expect(indoorCracked).toBe(130.0);

      // Sealed: 200 * 0.35 + 10 = 70 + 10 = 80 µg/m³
      const indoorSealed = calculateIndoorPm25(outdoorPm25, "sealed", false, false);
      expect(indoorSealed).toBe(80.0);

      // Sealing alone cuts indoor PM2.5 from 180 to 80 (55.6% reduction)
      expect(indoorSealed).toBeLessThan(indoorOpen);
    });
  });

  // ─── Purifier Efficiency: Sealed vs Open ───────────────────────────
  describe("Purifier effectiveness dynamics", () => {
    it("verifies purifier works far better when sealed (65%) than open (10%)", () => {
      expect(PURIFIER_REDUCTION_FACTORS.sealed).toBe(0.65);
      expect(PURIFIER_REDUCTION_FACTORS.open).toBe(0.10);
      expect(PURIFIER_REDUCTION_FACTORS.cracked).toBe(0.35);

      const outdoorPm25 = 200;

      // With open windows:
      // Raw = 200 * 0.85 + 10 = 180
      // With purifier (10% reduction): 180 * (1 - 0.10) = 162 µg/m³
      const openWithPurifier = calculateIndoorPm25(outdoorPm25, "open", false, true);
      expect(openWithPurifier).toBe(162.0);

      // With sealed windows:
      // Raw = 200 * 0.35 + 10 = 80
      // With purifier (65% reduction): 80 * (1 - 0.65) = 28 µg/m³
      const sealedWithPurifier = calculateIndoorPm25(outdoorPm25, "sealed", false, true);
      expect(sealedWithPurifier).toBe(28.0);

      // A sealed room with purifier drops PM2.5 to 28 µg/m³ (Good/Satisfactory),
      // whereas an open room with purifier remains at 162 µg/m³ (Moderate/Poor)!
      expect(sealedWithPurifier).toBeLessThan(openWithPurifier);
      expect(openWithPurifier - sealedWithPurifier).toBe(134.0);
    });
  });

  // ─── Incense / Solid Fuel Penalty & Delta ───────────────────────────
  describe("Incense and solid fuel combustion penalties", () => {
    it("verifies incense penalty (+45 µg/m³) and its removal savings", () => {
      expect(BASELINE_INDOOR_SOURCE_UG_M3).toBe(10);
      expect(INCENSE_SOLID_FUEL_PENALTY_UG_M3).toBe(45);

      const outdoorPm25 = 100;
      // In sealed room without purifier:
      // With incense: (100 * 0.35) + 10 + 45 = 35 + 55 = 90 µg/m³
      const withIncense = calculateIndoorPm25(outdoorPm25, "sealed", true, false);
      expect(withIncense).toBe(90.0);

      // Without incense: (100 * 0.35) + 10 = 45 µg/m³
      const withoutIncense = calculateIndoorPm25(outdoorPm25, "sealed", false, false);
      expect(withoutIncense).toBe(45.0);

      // Removing incense cuts exactly 45 µg/m³ (50% reduction in this sealed case)
      expect(withIncense - withoutIncense).toBe(45.0);
    });
  });

  // ─── Ventilation Directive Thresholds ──────────────────────────────
  describe("Ventilation directive thresholds", () => {
    it("issues OPEN_WINDOWS for outdoor NAQI <= 100", () => {
      expect(getVentilationDirective(50).directive).toBe("OPEN_WINDOWS");
      expect(getVentilationDirective(100).directive).toBe("OPEN_WINDOWS");
      expect(getVentilationDirective(100).advisory).toContain("Open windows");
    });

    it("issues BRIEF_VENTILATION for outdoor NAQI 101 to 150", () => {
      expect(getVentilationDirective(101).directive).toBe("BRIEF_VENTILATION");
      expect(getVentilationDirective(130).directive).toBe("BRIEF_VENTILATION");
      expect(getVentilationDirective(150).directive).toBe("BRIEF_VENTILATION");
      expect(getVentilationDirective(125).advisory).toContain("10–15 minute bursts");
    });

    it("issues SEAL_WINDOWS for outdoor NAQI > 150", () => {
      expect(getVentilationDirective(151).directive).toBe("SEAL_WINDOWS");
      expect(getVentilationDirective(250).directive).toBe("SEAL_WINDOWS");
      expect(getVentilationDirective(400).directive).toBe("SEAL_WINDOWS");
      expect(getVentilationDirective(300).advisory).toContain("sealed");
    });
  });

  // ─── Action Lab Interventions Array ────────────────────────────────
  describe("Action Lab Interventions Array Generation", () => {
    it("generates actionable what-if simulations tailored to user profile", () => {
      const outdoorPm25 = 180;
      const outdoorNaqi = 280;

      const analysis = analyzeIndoorAir(baseProfile, outdoorPm25, outdoorNaqi);

      expect(analysis.estimatedIndoorPm25).toBeGreaterThan(0);
      expect(analysis.ventilationDirective).toBe("SEAL_WINDOWS");
      expect(analysis.interventions.length).toBeGreaterThanOrEqual(3);

      const ids = analysis.interventions.map((i) => i.id);
      // Since baseProfile has windows: 'open', usesIncense: true, hasAirPurifier: false:
      expect(ids).toContain("seal_windows");
      expect(ids).toContain("eliminate_incense");
      expect(ids).toContain("add_purifier");
      expect(ids).toContain("clean_air_sanctuary");

      // Verify each intervention has positive savings
      for (const item of analysis.interventions) {
        expect(item.pm25SavedUgM3).toBeGreaterThan(0);
        expect(item.percentReduction).toBeGreaterThan(0);
        expect(item.projectedIndoorPm25).toBeLessThan(analysis.estimatedIndoorPm25);
      }
    });
  });
});
