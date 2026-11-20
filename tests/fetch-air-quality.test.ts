import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchLiveAirQuality,
  TelemetryUnavailableError,
} from "@/lib/aqi/fetch-air-quality";
import { ResolvedLocation } from "@/types/air-quality";

describe("Live Air Quality Telemetry Engine", () => {
  const testLocation: ResolvedLocation = {
    name: "Delhi Central",
    state: "Delhi",
    country: "India",
    lat: 28.6139,
    lon: 77.209,
  };

  const mockOpenMeteoResponse = {
    current: {
      time: "2026-11-20T17:00",
      pm10: 160.0,
      pm2_5: 95.0,
      carbon_monoxide: 850.0,
      nitrogen_dioxide: 45.0,
      sulphur_dioxide: 15.0,
      ozone: 40.0,
    },
    hourly: {
      time: ["2026-11-20T17:00", "2026-11-20T18:00"],
      pm2_5: [95.0, 110.0],
      pm10: [160.0, 180.0],
      carbon_monoxide: [850.0, 900.0],
      nitrogen_dioxide: [45.0, 50.0],
      sulphur_dioxide: [15.0, 18.0],
      ozone: [40.0, 35.0],
    },
  };

  const mockWaqiResponse = {
    status: "ok",
    data: {
      city: { name: "ITO, Delhi - CPCB" },
      time: { v: Math.floor(Date.now() / 1000) - 1800 }, // 30 min ago
      iaqi: {
        pm25: { v: 180 }, // US EPA AQI 180 -> ~113.4 µg/m³
        pm10: { v: 120 }, // US EPA AQI 120 -> ~184 µg/m³
      },
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ─── Open-Meteo + WAQI Ground Merge Path ────────────────────────────
  it("merges WAQI ground station data when available and marks isFallback: false", async () => {
    process.env.WAQI_API_TOKEN = "test_waqi_token";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        if (url.includes("open-meteo.com")) {
          return Promise.resolve(new Response(JSON.stringify(mockOpenMeteoResponse)));
        }
        if (url.includes("api.waqi.info")) {
          return Promise.resolve(new Response(JSON.stringify(mockWaqiResponse)));
        }
        return Promise.reject(new Error("Unknown URL"));
      })
    );

    const snapshot = await fetchLiveAirQuality({
      ...testLocation,
      lat: 28.62, // Unique lat/lon to avoid cache hits from previous tests
      lon: 77.21,
    });

    expect(snapshot.source).toContain("CPCB/WAQI Ground Station");
    expect(snapshot.stationName).toBe("ITO, Delhi - CPCB");
    expect(snapshot.isFallback).toBe(false);

    // PM2.5 was converted from US EPA AQI 180 via epaAqiToPm25UgM3 (exact 111.7 µg/m³)
    expect(snapshot.pollutants.pm25).toBe(111.7);

    // NAQI follows CPCB formula
    expect(snapshot.naqi).toBeGreaterThan(0);
    expect(snapshot.hourlyForecast).toHaveLength(2);
  });

  // ─── WAQI Failure -> Open-Meteo Fallback Path ──────────────────────
  it("falls back to Open-Meteo model when WAQI fails and marks isFallback: true", async () => {
    process.env.WAQI_API_TOKEN = "test_waqi_token";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        if (url.includes("open-meteo.com")) {
          return Promise.resolve(new Response(JSON.stringify(mockOpenMeteoResponse)));
        }
        if (url.includes("api.waqi.info")) {
          return Promise.resolve(
            new Response(JSON.stringify({ status: "error", data: "Unknown station" }))
          );
        }
        return Promise.reject(new Error("Unknown URL"));
      })
    );

    const snapshot = await fetchLiveAirQuality({
      ...testLocation,
      lat: 28.71,
      lon: 77.31,
    });

    expect(snapshot.source).toContain("Open-Meteo CAMS Air Quality Model");
    expect(snapshot.isFallback).toBe(true);
    // Uses raw Open-Meteo PM2.5 (95 µg/m³) directly
    expect(snapshot.pollutants.pm25).toBe(95.0);
  });

  // ─── Cache Hit Avoids Duplicate Fetch ──────────────────────────────
  it("uses cached telemetry snapshot on subsequent calls for same coordinate bin", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes("open-meteo.com")) {
        return Promise.resolve(new Response(JSON.stringify(mockOpenMeteoResponse)));
      }
      return Promise.resolve(new Response(JSON.stringify({ status: "error" })));
    });
    vi.stubGlobal("fetch", fetchMock);

    const coords = { ...testLocation, lat: 28.85, lon: 77.45 };

    const first = await fetchLiveAirQuality(coords);
    const second = await fetchLiveAirQuality(coords);

    expect(first.fetchedAt).toBe(second.fetchedAt);
    expect(first.naqi).toBe(second.naqi);
    // Fetch should have been called twice on the first query (Open-Meteo + WAQI) and 0 additional times on second (cache hit)
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  // ─── Both Fail -> TelemetryUnavailableError ─────────────────────────
  it("throws TelemetryUnavailableError when both Open-Meteo and WAQI fail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network connection timeout"))
    );

    await expect(
      fetchLiveAirQuality({
        ...testLocation,
        lat: 28.99,
        lon: 77.99,
      })
    ).rejects.toThrow(TelemetryUnavailableError);
  });
});
