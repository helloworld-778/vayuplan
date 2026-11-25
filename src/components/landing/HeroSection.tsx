"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Clock, TrainFront, Home } from "lucide-react";
import { LiveCitySoundingCard } from "./LiveCitySoundingCard";

const EASE_OBSERVATORY = [0.16, 1, 0.3, 1] as const;

export function HeroSection() {
  return (
    <section className="relative bg-[#F7F8FA] overflow-hidden border-b border-[#DCE3EC]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-drafting-grid [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_88%)]"
      />

      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 min-h-[calc(100vh-64px)] flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left 6 Columns: Editorial Smog Thesis & Primary Actions */}
          <div className="lg:col-span-6 space-y-6">
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE_OBSERVATORY }}
              className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-[-0.03em] leading-[1.04] text-[#0F172A]"
            >
              Turn raw Indian AQI numbers into daily breathability decisions.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.06, ease: EASE_OBSERVATORY }}
              className="text-base sm:text-lg text-[#334155] leading-relaxed max-w-xl"
            >
              Thermal inversions trap morning smog while afternoon sun disperses street dust.
              VayuPlan turns live CPCB station feeds and microenvironment math into daily
              action.
            </motion.p>

            {/* 3 Core Decisions */}
            <motion.ul
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.12, ease: EASE_OBSERVATORY }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl"
            >
              <li className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-lg px-3.5 py-2.5 elevation-1 flex items-center gap-2.5 text-xs font-semibold text-[#0F172A]">
                <Clock className="w-4 h-4 text-[#1D4ED8] shrink-0" aria-hidden="true" />
                <span>When to step out</span>
              </li>
              <li className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-lg px-3.5 py-2.5 elevation-1 flex items-center gap-2.5 text-xs font-semibold text-[#0F172A]">
                <TrainFront className="w-4 h-4 text-[#1D4ED8] shrink-0" aria-hidden="true" />
                <span>How to commute</span>
              </li>
              <li className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-lg px-3.5 py-2.5 elevation-1 flex items-center gap-2.5 text-xs font-semibold text-[#0F172A]">
                <Home className="w-4 h-4 text-[#1D4ED8] shrink-0" aria-hidden="true" />
                <span>How to shield indoors</span>
              </li>
            </motion.ul>

            {/* Primary & Secondary CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.18, ease: EASE_OBSERVATORY }}
              className="flex flex-wrap items-center gap-3 pt-1"
            >
              <Link
                href="/assistant"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[46px] rounded-lg bg-[#0F172A] hover:bg-[#1D4ED8] active:scale-[0.98] text-[#FFFFFF] text-sm font-semibold transition-all duration-150 hover:-translate-y-px elevation-1 hover:elevation-2"
              >
                <span>Launch Air Assistant</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>

              <a
                href="#scenarios"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[46px] rounded-lg bg-[#FFFFFF] border border-[#CBD5E1] hover:border-[#0F172A] active:scale-[0.98] text-[#0F172A] text-sm font-semibold transition-all"
              >
                <span>Explore Live Cities</span>
              </a>
            </motion.div>
          </div>

          {/* Right 6 Columns: Live City Sounding Preview */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.44, delay: 0.12, ease: EASE_OBSERVATORY }}
            className="lg:col-span-6"
          >
            <LiveCitySoundingCard />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
