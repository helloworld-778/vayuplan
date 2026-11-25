'use client';

import { motion } from 'framer-motion';
import { Clock, Home, Route } from 'lucide-react';

interface PillarItem {
  id: string;
  icon: typeof Clock;
  title: string;
  body: string;
  keyMetric: string;
  formulaLabel: string;
  formulaParts: React.ReactNode;
}

const PILLARS: PillarItem[] = [
  {
    id: 'diurnal-timing',
    icon: Clock,
    title: 'Diurnal Timing & Solar Clearing',
    body: 'Morning inversions trap surface smog while afternoon solar mixing lifts particulates—isolating your cleanest 2-hour window.',
    keyMetric: '2h cleanest solar window · NAQI <= 100 aeration rule',
    formulaLabel: 'Clean window objective',
    formulaParts: (
      <>
        min Σ<sub>t∈w</sub> PM<sub>2.5</sub>(t) &nbsp;|&nbsp; NAQI ≤ 100
      </>
    ),
  },
  {
    id: 'commute-dose',
    icon: Route,
    title: 'Commute Dose & Carbon Savings',
    body: 'Walking or cycling doubles lung ventilation rate, magnifying PM2.5 dose compared with sealed AC metro cars and N95 filtration.',
    keyMetric: '1.80 m³/hr active vs 0.65 m³/hr shielded cabin',
    formulaLabel: 'Inhaled particulate dose',
    formulaParts: (
      <>
        Dose = C<sub>eff</sub> × VentRate × Duration × P<sub>mask</sub>
      </>
    ),
  },
  {
    id: 'indoor-envelope',
    icon: Home,
    title: 'Indoor Envelope Physics',
    body: 'Combines window infiltration factors (open 0.85 to sealed 0.35), purifier CADR, and internal combustion loads.',
    keyMetric: '0.35–0.85 infiltration · +45 µg/m³ agarbatti penalty',
    formulaLabel: 'Steady-state indoor load',
    formulaParts: (
      <>
        C<sub>in</sub> = (C<sub>out</sub> × P<sub>inf</sub> + S<sub>int</sub>) × (1 − η)
      </>
    ),
  },
];

export function ThreePillarsSection() {
  return (
    <section
      id="science"
      aria-labelledby="science-heading"
      className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 py-12 sm:py-14"
    >
      <div className="max-w-2xl">
        <h2
          id="science-heading"
          className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#0F172A]"
        >
          Microenvironment physics behind every decision
        </h2>
        <p className="mt-2.5 text-sm sm:text-base leading-relaxed text-[#334155]">
          Ambient AQI stations miss how solar timing, breathing rate, and indoor sealing control real PM2.5 uptake.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
        className="mt-7 rounded-xl border border-[#DCE3EC] bg-[#FFFFFF] elevation-1 grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-[#DCE3EC]"
      >
        {PILLARS.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <article key={pillar.id} className="p-6 flex flex-col justify-between gap-5">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#F1F4F8] border border-[#DCE3EC] text-[#1D4ED8] flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-lg font-semibold tracking-tight text-[#0F172A]">
                    {pillar.title}
                  </h3>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-[#334155]">
                  {pillar.body}
                </p>
              </div>

              <div className="pt-4 border-t border-[#DCE3EC] space-y-2">
                <p className="font-mono tabular-nums text-xs font-semibold text-[#0F172A]">
                  {pillar.keyMetric}
                </p>
                <div className="rounded-lg bg-[#F1F4F8] px-3 py-2 font-mono tabular-nums text-xs text-[#334155] overflow-x-auto">
                  {pillar.formulaParts}
                </div>
              </div>
            </article>
          );
        })}
      </motion.div>
    </section>
  );
}
