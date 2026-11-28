"use client";

import React from "react";
import { motion } from "framer-motion";
import { Calculator, Radio, ShieldCheck, Sparkles } from "lucide-react";

interface PipelineStage {
  step: string;
  icon: typeof Radio;
  title: string;
  description: string;
  spec: string;
}

const STAGES: PipelineStage[] = [
  {
    step: "01",
    icon: Radio,
    title: "CPCB / WAQI + Open-Meteo",
    description:
      "Live station particulates converted via Indian CPCB breakpoints paired with hourly forecasts.",
    spec: "15m TTL cache",
  },
  {
    step: "02",
    icon: Calculator,
    title: "Deterministic Physics",
    description:
      "Computes clean outdoor windows, inhaled PM2.5, CO₂ savings, and indoor infiltration first.",
    spec: "Zero LLM guesswork",
  },
  {
    step: "03",
    icon: Sparkles,
    title: "Gemini 4 / 3 Cascade",
    description:
      "Grounded JSON synthesis across Gemini 4 Hydrogen and Gemini 3 free-tier fallback models.",
    spec: "Schema-bound · 15s cap",
  },
  {
    step: "04",
    icon: ShieldCheck,
    title: "Fallback Guarantee",
    description:
      "Strict Zod validation seamlessly drops to deterministic physics whenever upstream models stall.",
    spec: "100% continuity",
  },
];

export function ArchitecturePipeline() {
  return (
    <section
      id="architecture"
      aria-labelledby="architecture-heading"
      className="bg-obsidian text-ink-on-dark border-y border-dark py-16 lg:py-20"
    >
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2
            id="architecture-heading"
            className="font-display text-3xl sm:text-4xl font-semibold tracking-[-0.025em] text-ink-on-dark"
          >
            Grounded pipeline built for live resilience
          </h2>
          <p className="mt-3 text-base leading-relaxed text-ink-on-dark-muted">
            Physics calculates first, Gemini synthesizes household routines, and deterministic plans cover API surges.
          </p>
        </div>

        <ol className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {STAGES.map((stage, index) => {
            const Icon = stage.icon;
            return (
              <motion.li
                key={stage.step}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.34,
                  delay: index * 0.06,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="rounded-xl border border-dark bg-obsidian-elevated p-6 flex flex-col justify-between gap-5"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-dark bg-obsidian font-mono tabular-nums text-xs font-semibold text-accent-on-dark">
                      {stage.step}
                    </span>
                    <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-dark bg-obsidian text-accent-on-dark">
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </div>
                  </div>

                  <h3 className="mt-5 font-display text-base font-semibold tracking-tight text-ink-on-dark">
                    {stage.title}
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-ink-on-dark-muted">
                    {stage.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-dark">
                  <span className="inline-flex items-center rounded-md border border-dark bg-obsidian px-2.5 py-1 font-mono tabular-nums text-xs font-medium text-ink-on-dark-muted">
                    {stage.spec}
                  </span>
                </div>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
