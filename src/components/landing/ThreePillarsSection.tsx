"use client";

import React from "react";
import { motion } from "framer-motion";
import { Clock, Home, Route } from "lucide-react";

interface PillarItem {
  id: string;
  icon: typeof Clock;
  title: string;
  body: string;
  keyMetric: string;
  formulaParts: React.ReactNode;
}

const PILLARS: PillarItem[] = [
  {
    id: "diurnal-timing",
    icon: Clock,
    title: "Diurnal Timing & Solar Clearing",
    body: "Morning inversions trap smog while afternoon solar mixing lifts particulates—isolating your cleanest 2-hour window.",
    keyMetric: "2h cleanest solar window · NAQI <= 100 rule",
    formulaParts: (
      <>
        min Σ<sub>t∈w</sub> PM<sub>2.5</sub>(t) &nbsp;|&nbsp; NAQI ≤ 100
      </>
    ),
  },
  {
    id: "commute-dose",
    icon: Route,
    title: "Commute Dose & Carbon Savings",
    body: "Walking or cycling elevates lung ventilation rate, magnifying PM2.5 uptake vs. closed metro cars and N95 masks.",
    keyMetric: "1.80 m³/hr active vs 0.65 m³/hr cabin",
    formulaParts: (
      <>
        Dose = C<sub>eff</sub> × VentRate × Duration × P<sub>mask</sub>
      </>
    ),
  },
  {
    id: "indoor-envelope",
    icon: Home,
    title: "Indoor Envelope Physics",
    body: "Models window infiltration factors (open 0.85 to sealed 0.35), purifier CADR, and internal combustion loads.",
    keyMetric: "0.35–0.85 infiltration · +45 µg/m³ coil load",
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
      className="bg-canvas py-16 lg:py-20"
    >
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2
            id="science-heading"
            className="font-display text-3xl sm:text-4xl font-semibold tracking-[-0.025em] text-ink"
          >
            Microenvironment physics behind every decision
          </h2>
          <p className="mt-3 text-base leading-relaxed text-ink-secondary">
            City AQI tickers miss how solar timing, breathing rate, and indoor sealing drive real PM2.5 uptake.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 rounded-xl border border-subtle bg-border-subtle gap-px grid grid-cols-1 lg:grid-cols-3 overflow-hidden elevation-1"
        >
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <article
                key={pillar.id}
                className="bg-surface p-6 sm:p-7 flex flex-col justify-between gap-5"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-subtle border border-subtle text-accent flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <h3 className="font-display text-lg font-semibold tracking-tight text-ink">
                      {pillar.title}
                    </h3>
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
                    {pillar.body}
                  </p>
                </div>

                <div className="pt-4 border-t border-subtle space-y-2">
                  <p className="font-mono tabular-nums text-xs font-semibold text-ink">
                    {pillar.keyMetric}
                  </p>
                  <div className="rounded-lg bg-subtle px-3 py-2 font-mono tabular-nums text-xs text-ink-secondary overflow-x-auto">
                    {pillar.formulaParts}
                  </div>
                </div>
              </article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
