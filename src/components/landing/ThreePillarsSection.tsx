'use client';

import { motion } from 'framer-motion';
import { Clock, Home, Route } from 'lucide-react';

interface PillarItem {
  id: string;
  icon: typeof Clock;
  title: string;
  body: string;
  formulaLabel: string;
  formulaParts: React.ReactNode;
  telemetryNote: string;
}

const PILLARS: PillarItem[] = [
  {
    id: 'diurnal-timing',
    icon: Clock,
    title: 'Diurnal Timing & Solar Clearing',
    body: 'Overnight surface inversions trap particulate matter until daytime convection lifts the boundary layer. VayuPlan scans hourly forecasts to isolate the cleanest continuous 2-hour window alongside four daily time-of-day blocks.',
    formulaLabel: 'Clean window objective',
    formulaParts: (
      <>
        min Σ<sub>t∈w</sub> PM<sub>2.5</sub>(t) &nbsp;|&nbsp; NAQI ≤ 100
      </>
    ),
    telemetryNote: 'Dayparts: 06:00–11:59 · 12:00–16:59 · 17:00–21:59 · 22:00–05:59',
  },
  {
    id: 'commute-dose',
    icon: Route,
    title: 'Commute Dose & Carbon Savings',
    body: 'Exertion during open-air walking or cycling raises respiratory ventilation to 1.80 m³/hr, increasing lung deposition. Comparing corridor infiltration, mask penetration, and travel speed quantifies both inhaled microgram dose and tailpipe CO₂ avoided.',
    formulaLabel: 'Inhaled particulate dose',
    formulaParts: (
      <>
        Dose = C<sub>eff</sub> × VentRate × Duration × P<sub>mask</sub>
      </>
    ),
    telemetryNote: '1.80 m³/hr active ventilation vs 0.65 m³/hr shielded cabin',
  },
  {
    id: 'indoor-envelope',
    icon: Home,
    title: 'Indoor Envelope Physics',
    body: 'Ambient readings stop at the facade. Modeling window penetration across open, cracked, and sealed states alongside indoor combustion sources reveals when cross-ventilation helps—and when HEPA sealing protects indoor air.',
    formulaLabel: 'Steady-state indoor load',
    formulaParts: (
      <>
        C<sub>in</sub> = (C<sub>out</sub> × P<sub>inf</sub> + S<sub>int</sub>) × (1 − η)
      </>
    ),
    telemetryNote: '0.35–0.85 infiltration factor · +45 µg/m³ incense/agarbatti penalty',
  },
];

export function ThreePillarsSection() {
  return (
    <section
      id="science"
      aria-labelledby="science-heading"
      className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 py-14 sm:py-16"
    >
      <div className="max-w-2xl">
        <h2
          id="science-heading"
          className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#0F172A]"
        >
          Microenvironment physics behind every recommendation
        </h2>
        <p className="mt-3 text-base leading-relaxed text-[#334155]">
          Citywide index numbers alone hide how breathing rate, solar dispersion, and home
          envelopes shift personal PM2.5 exposure hour by hour.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
        className="mt-8 rounded-xl border border-[#DCE3EC] bg-[#FFFFFF] elevation-1 grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-[#DCE3EC]"
      >
        {PILLARS.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <article key={pillar.id} className="p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-lg bg-[#F1F4F8] border border-[#DCE3EC] text-[#1D4ED8] flex items-center justify-center">
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </div>

                <h3 className="mt-5 font-display text-xl font-semibold tracking-tight text-[#0F172A]">
                  {pillar.title}
                </h3>

                <p className="mt-2.5 text-sm leading-relaxed text-[#334155]">
                  {pillar.body}
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-[#DCE3EC]">
                <p className="text-xs font-medium text-[#525E70]">{pillar.formulaLabel}</p>
                <div className="mt-2 rounded-lg bg-[#F1F4F8] border border-[#DCE3EC] px-3 py-2 font-mono tabular-nums text-xs text-[#0F172A] overflow-x-auto">
                  {pillar.formulaParts}
                </div>
                <p className="mt-2 font-mono tabular-nums text-xs text-[#525E70]">
                  {pillar.telemetryNote}
                </p>
              </div>
            </article>
          );
        })}
      </motion.div>
    </section>
  );
}
