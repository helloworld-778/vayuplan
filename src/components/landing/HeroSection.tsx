"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Clock, TrainFront, Home } from "lucide-react";
import { LiveCitySoundingCard } from "./LiveCitySoundingCard";

const EASE_EDITORIAL = [0.16, 1, 0.3, 1] as const;

export function HeroSection() {
  return (
    <section className="bg-canvas border-b border-subtle">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 lg:py-20 min-h-[calc(100vh-64px)] flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left 6 Columns: Editorial Smog Thesis & Primary Actions */}
          <div className="lg:col-span-6 space-y-7">
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE_EDITORIAL }}
              className="font-display text-[clamp(2.75rem,5.5vw,4.5rem)] font-bold tracking-[-0.035em] leading-[1.03] text-ink"
            >
              Turn raw Indian AQI numbers into daily breathability decisions.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.06, ease: EASE_EDITORIAL }}
              className="text-base sm:text-lg text-ink-secondary leading-relaxed max-w-xl"
            >
              Thermal inversions trap morning smog while afternoon sun disperses street dust.
              VayuPlan turns live CPCB telemetry and exposure physics into daily action.
            </motion.p>

            {/* Primary & Secondary CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.12, ease: EASE_EDITORIAL }}
              className="flex flex-wrap items-center gap-3"
            >
              <Link
                href="/assistant"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] rounded-lg bg-obsidian hover:bg-accent active:scale-[0.98] text-ink-on-dark hover:text-white text-sm font-semibold transition-all duration-150 hover:-translate-y-px elevation-1 hover:elevation-2"
              >
                <span>Launch Air Assistant</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>

              <a
                href="#scenarios"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] rounded-lg bg-surface border border-control hover:border-obsidian active:scale-[0.98] text-ink text-sm font-semibold transition-all"
              >
                <span>Explore Live Cities</span>
              </a>
            </motion.div>

            {/* 3 Crisp Core Value Chips */}
            <motion.ul
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.18, ease: EASE_EDITORIAL }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl pt-1"
            >
              <li className="bg-surface border border-subtle rounded-lg px-3.5 py-2.5 elevation-1 flex items-center gap-2.5 text-xs font-semibold text-ink">
                <Clock className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
                <span>When to step out</span>
              </li>
              <li className="bg-surface border border-subtle rounded-lg px-3.5 py-2.5 elevation-1 flex items-center gap-2.5 text-xs font-semibold text-ink">
                <TrainFront className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
                <span>How to commute</span>
              </li>
              <li className="bg-surface border border-subtle rounded-lg px-3.5 py-2.5 elevation-1 flex items-center gap-2.5 text-xs font-semibold text-ink">
                <Home className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
                <span>How to shield indoors</span>
              </li>
            </motion.ul>
          </div>

          {/* Right 6 Columns: Deep Pine-Obsidian Live Sounding Preview */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.44, delay: 0.12, ease: EASE_EDITORIAL }}
            className="lg:col-span-6"
          >
            <LiveCitySoundingCard />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
