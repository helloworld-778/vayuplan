'use client';

import { motion } from 'framer-motion';
import { Calculator, Radio, ShieldCheck, Sparkles } from 'lucide-react';

interface PipelineStage {
  step: string;
  icon: typeof Radio;
  title: string;
  description: string;
  spec: string;
}

const STAGES: PipelineStage[] = [
  {
    step: '01',
    icon: Radio,
    title: 'CPCB / WAQI + Open-Meteo',
    description:
      'Live station particulates and gases blend with hourly meteorological forecasts, converted strictly via Indian CPCB linear sub-index breakpoints.',
    spec: '15m TTL cache · Pan-India geocoding',
  },
  {
    step: '02',
    icon: Calculator,
    title: 'Deterministic Physics Engine',
    description:
      'Computes cleanest outdoor windows, mode-by-mode inhaled µg dose, CO₂ deltas, and indoor PM2.5 concentrations before any AI call starts.',
    spec: 'Zero fabricated metrics',
  },
  {
    step: '03',
    icon: Sparkles,
    title: 'Multi-Model Gemini Cascade',
    description:
      'Structured JSON generation grounded in verified station telemetry cascades cleanly from Gemini 4 Hydrogen across Gemini 3 models.',
    spec: 'v1beta schema-bound · 15s cap',
  },
  {
    step: '04',
    icon: ShieldCheck,
    title: 'Fallback Guarantee',
    description:
      'Every AI response passes strict Zod validation; if upstream capacity drops or rate limits hit, deterministic physics powers a complete brief.',
    spec: '100% response continuity',
  },
];

export function ArchitecturePipeline() {
  return (
    <section
      id="architecture"
      aria-labelledby="architecture-heading"
      className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 py-14 sm:py-16 border-t border-[#DCE3EC]"
    >
      <div className="max-w-2xl">
        <h2
          id="architecture-heading"
          className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#0F172A]"
        >
          Grounded pipeline built for live resilience
        </h2>
        <p className="mt-3 text-base leading-relaxed text-[#334155]">
          Numeric calculations never rely on language model arithmetic. Physics runs first, Gemini
          synthesizes household actions, and deterministic plans cover upstream surges.
        </p>
      </div>

      <motion.ol
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
        className="mt-8 rounded-xl border border-[#DCE3EC] bg-[#FFFFFF] elevation-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#DCE3EC]"
      >
        {STAGES.map((stage, index) => {
          const Icon = stage.icon;
          const isLast = index === STAGES.length - 1;
          return (
            <li key={stage.step} className="relative p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#DCE3EC] bg-[#F1F4F8] font-mono tabular-nums text-xs font-semibold text-[#1D4ED8]">
                    {stage.step}
                  </span>
                  <div className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#334155]">
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </div>
                  {!isLast && (
                    <span
                      aria-hidden="true"
                      className="hidden lg:block flex-1 h-px bg-[#DCE3EC]"
                    />
                  )}
                </div>

                <h3 className="mt-4 font-display text-base sm:text-lg font-semibold tracking-tight text-[#0F172A]">
                  {stage.title}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-[#334155]">
                  {stage.description}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-[#DCE3EC]">
                <span className="inline-flex items-center rounded-md bg-[#F1F4F8] px-2.5 py-1 font-mono tabular-nums text-xs font-medium text-[#334155]">
                  {stage.spec}
                </span>
              </div>
            </li>
          );
        })}
      </motion.ol>
    </section>
  );
}
