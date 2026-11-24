import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import LandingPage from '@/app/page';
import { EVALUATOR_PRESETS } from '@/lib/presets';
import type { AirQualitySnapshot, HourlyAirPoint, NaqiCategory } from '@/types/air-quality';

function makeHourlyForecast(basePm25: number, naqi: number, category: NaqiCategory): HourlyAirPoint[] {
  return Array.from({ length: 24 }, (_, hour) => {
    const diurnalOffset = hour >= 12 && hour <= 15 ? -20 : hour >= 6 && hour <= 9 ? 25 : 0;
    const pm25 = Math.max(12, basePm25 + diurnalOffset);
    const pointNaqi = Math.max(25, Math.round(naqi + diurnalOffset * 1.4));
    return {
      timeIso: `2026-11-25T${hour.toString().padStart(2, '0')}:00:00+05:30`,
      pm25,
      pm10: Math.round(pm25 * 1.55),
      estimatedNaqi: pointNaqi,
      category,
    };
  });
}

function buildSnapshotForCity(cityName: string): AirQualitySnapshot {
  const byCity: Record<
    string,
    {
      state: string;
      lat: number;
      lon: number;
      naqi: number;
      category: NaqiCategory;
      pm25: number;
      stationName: string;
    }
  > = {
    'New Delhi': {
      state: 'Delhi',
      lat: 28.6139,
      lon: 77.209,
      naqi: 246,
      category: 'Poor',
      pm25: 104.2,
      stationName: 'ITO CPCB Station, New Delhi',
    },
    Mumbai: {
      state: 'Maharashtra',
      lat: 19.076,
      lon: 72.8777,
      naqi: 84,
      category: 'Satisfactory',
      pm25: 41.6,
      stationName: 'Bandra Kurla Complex CPCB',
    },
    Kolkata: {
      state: 'West Bengal',
      lat: 22.5726,
      lon: 88.3639,
      naqi: 168,
      category: 'Moderate',
      pm25: 79.5,
      stationName: 'Ballygunge CPCB Station',
    },
    Bengaluru: {
      state: 'Karnataka',
      lat: 12.9716,
      lon: 77.5946,
      naqi: 62,
      category: 'Satisfactory',
      pm25: 32.8,
      stationName: 'BTM Layout CPCB Station',
    },
  };

  const cfg = byCity[cityName] ?? byCity['New Delhi'];

  return {
    location: {
      name: cityName,
      state: cfg.state,
      country: 'India',
      lat: cfg.lat,
      lon: cfg.lon,
    },
    naqi: cfg.naqi,
    dominantPollutant: 'pm25',
    category: cfg.category,
    pollutants: {
      pm25: cfg.pm25,
      pm10: Math.round(cfg.pm25 * 1.6),
      no2: 38.4,
      o3: 24.1,
      co: 1.1,
      so2: 11.2,
    },
    hourlyForecast: makeHourlyForecast(cfg.pm25, cfg.naqi, cfg.category),
    source: 'WAQI / CPCB Station + Open-Meteo',
    stationName: cfg.stationName,
    fetchedAt: '2026-11-25T08:00:00.000Z',
    isFallback: false,
  };
}

describe('Landing Page (/)', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const rawUrl = typeof input === 'string' ? input : input.toString();
      const parsed = new URL(rawUrl, 'http://localhost');
      const cityName = parsed.searchParams.get('name') ?? 'New Delhi';
      const snapshot = buildSnapshotForCity(cityName);

      return new Response(JSON.stringify(snapshot), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the hero thesis, Launch Air Assistant CTAs linking to /assistant, and non-medical disclosure', async () => {
    render(<LandingPage />);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /Turn raw Indian AQI numbers into daily breathability decisions/i,
      })
    ).toBeInTheDocument();

    const launchLinks = screen.getAllByRole('link', { name: /Launch Air Assistant/i });
    expect(launchLinks.length).toBeGreaterThanOrEqual(2);
    for (const link of launchLinks) {
      expect(link).toHaveAttribute('href', '/assistant');
    }

    expect(screen.getByText(/not medical advice, diagnosis, or clinical treatment/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('ITO CPCB Station, New Delhi')).toBeInTheDocument();
    });
  });

  it('fetches live telemetry for New Delhi initially and switches to Mumbai when clicking the Mumbai tab', async () => {
    render(<LandingPage />);

    await waitFor(() => {
      expect(screen.getByText('246')).toBeInTheDocument();
      expect(screen.getByText('ITO CPCB Station, New Delhi')).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/air-quality?lat=28.6139&lon=77.209&name=New%20Delhi'),
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );

    const mumbaiTab = screen.getByRole('tab', { name: 'Mumbai' });
    fireEvent.click(mumbaiTab);

    await waitFor(() => {
      expect(screen.getByText('84')).toBeInTheDocument();
      expect(screen.getByText('Bandra Kurla Complex CPCB')).toBeInTheDocument();
    });

    const deepDiveLink = screen.getByRole('link', { name: /Open Mumbai in Assistant/i });
    expect(deepDiveLink).toHaveAttribute('href', '/assistant?preset=mumbai-family');
  });

  it('renders all 4 evaluator scenario launcher links with preset query params and zero hardcoded AQI labels', async () => {
    render(<LandingPage />);

    await waitFor(() => {
      expect(screen.getByText('ITO CPCB Station, New Delhi')).toBeInTheDocument();
    });

    const scenarioSection = screen.getByRole('region', {
      name: /Preconfigured urban household profiles/i,
    });

    const expectedPresets = ['delhi-commuter', 'mumbai-family', 'kolkata-senior', 'bengaluru-student'];
    for (const presetId of expectedPresets) {
      const preset = EVALUATOR_PRESETS[presetId];
      const cardLink = within(scenarioSection).getByRole('link', {
        name: new RegExp(preset.title, 'i'),
      });
      expect(cardLink).toHaveAttribute('href', `/assistant?preset=${presetId}`);

      // Scenario launcher cards describe household setup, never hardcoded static AQI scores
      expect(cardLink.textContent).not.toMatch(/\bSevere\b|\bVery Poor\b|\bModerate PM2\.5\b|\bNAQI \d+/i);
    }
  });
});
