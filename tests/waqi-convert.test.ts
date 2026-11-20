import { describe, it, expect } from "vitest";
import {
  epaAqiToPm25UgM3,
  epaAqiToPm10UgM3,
} from "@/lib/aqi/waqi-convert";

describe("US EPA AQI to Raw Concentration Inverse Interpolation", () => {
  // ─── PM2.5 Inversion ────────────────────────────────────────────────
  describe("epaAqiToPm25UgM3", () => {
    it("verifies exact benchmark breakpoints for PM2.5", () => {
      // AQI 50 -> 12.0 µg/m³ (top of Good)
      expect(epaAqiToPm25UgM3(50)).toBe(12.0);

      // AQI 100 -> 35.4 µg/m³ (top of Moderate)
      expect(epaAqiToPm25UgM3(100)).toBe(35.4);

      // AQI 150 -> ~55.4 µg/m³ (top of Unhealthy for Sensitive Groups)
      expect(epaAqiToPm25UgM3(150)).toBe(55.4);

      // AQI 200 -> ~150.4 µg/m³ (top of Unhealthy)
      expect(epaAqiToPm25UgM3(200)).toBe(150.4);

      // AQI 300 -> 250.4 µg/m³ (top of Very Unhealthy)
      expect(epaAqiToPm25UgM3(300)).toBe(250.4);

      // AQI 500 -> 500.4 µg/m³ (top of Hazardous)
      expect(epaAqiToPm25UgM3(500)).toBe(500.4);
    });

    it("inverts mid-range values accurately", () => {
      // AQI 25 -> midpoint of 0-50 -> (25/50) * 12.0 = 6.0 µg/m³
      expect(epaAqiToPm25UgM3(25)).toBe(6.0);
    });

    it("handles zero and negative values cleanly", () => {
      expect(epaAqiToPm25UgM3(0)).toBe(0);
      expect(epaAqiToPm25UgM3(-10)).toBe(0);
    });

    it("extrapolates above 500 AQI", () => {
      const concentration = epaAqiToPm25UgM3(600);
      expect(concentration).toBeGreaterThan(500.4);
    });
  });

  // ─── PM10 Inversion ─────────────────────────────────────────────────
  describe("epaAqiToPm10UgM3", () => {
    it("verifies benchmark breakpoints for PM10", () => {
      // AQI 50 -> 54 µg/m³
      expect(epaAqiToPm10UgM3(50)).toBe(54.0);

      // AQI 100 -> 154 µg/m³
      expect(epaAqiToPm10UgM3(100)).toBe(154.0);

      // AQI 150 -> 254 µg/m³
      expect(epaAqiToPm10UgM3(150)).toBe(254.0);

      // AQI 200 -> 354 µg/m³
      expect(epaAqiToPm10UgM3(200)).toBe(354.0);
    });

    it("handles zero and boundary inputs cleanly", () => {
      expect(epaAqiToPm10UgM3(0)).toBe(0);
      expect(epaAqiToPm10UgM3(-5)).toBe(0);
    });
  });
});
