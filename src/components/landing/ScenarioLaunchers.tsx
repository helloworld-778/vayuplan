'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, Home, MapPin, Route, ShieldAlert } from 'lucide-react';
import { EVALUATOR_PRESETS } from '@/lib/presets';
import type { CommuteMode, MaskType, WindowsState } from '@/types/air-quality';

const MODE_LABELS: Record<CommuteMode, string> = {
  petrol_car: 'Petrol car',
  two_wheeler: 'Two-wheeler',
  metro_transit: 'Metro / public transit',
  carpool: 'Carpool',
  bicycle_walk: 'Walking / cycling',
  work_from_home: 'Work from home',
};

const MASK_LABELS: Record<MaskType, string> = {
  none: 'No mask',
  cloth: 'Cloth mask',
  surgical: 'Surgical mask',
  n95: 'N95 / FFP2',
};

const WINDOW_LABELS: Record<WindowsState, string> = {
  open: 'Windows open',
  cracked: 'Windows cracked',
  sealed: 'Windows sealed',
};

export function ScenarioLaunchers() {
  const presets = Object.values(EVALUATOR_PRESETS);

  return (
    <section
      id="scenarios"
      aria-labelledby="scenarios-heading"
      className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 py-14 sm:py-16 border-t border-[#DCE3EC]"
    >
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="max-w-2xl">
          <h2
            id="scenarios-heading"
            className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#0F172A]"
          >
            Preconfigured urban household profiles
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[#334155]">
            Open the assistant with a real Indian commuter or household setup. Live station
            readings, commute exposure deltas, and AI recommendations hydrate dynamically on load.
          </p>
        </div>

        <Link
          href="/assistant"
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[#1D4ED8] hover:text-[#1E40AF] transition-colors"
        >
          <span>Configure custom profile</span>
          <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
        className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {presets.map((preset) => (
          <Link
            key={preset.id}
            href={`/assistant?preset=${encodeURIComponent(preset.id)}`}
            className="group rounded-xl border border-[#DCE3EC] bg-[#FFFFFF] p-6 elevation-1 hover:border-[#1D4ED8]/50 hover:elevation-2 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-semibold tracking-tight text-[#0F172A] group-hover:text-[#1D4ED8] transition-colors">
                    {preset.title}
                  </h3>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-[#525E70]">
                    <MapPin className="w-3.5 h-3.5 text-[#1D4ED8]" aria-hidden="true" />
                    <span>
                      {preset.location.name}, {preset.location.state}
                    </span>
                  </p>
                </div>

                {preset.profile.hasRespiratorySensitivity && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-[#DCE3EC] bg-[#F1F4F8] px-2 py-0.5 text-xs font-medium text-[#334155]">
                    <ShieldAlert className="w-3.5 h-3.5 text-[#1D4ED8]" aria-hidden="true" />
                    <span>Sensitive</span>
                  </span>
                )}
              </div>

              <p className="mt-3 text-sm leading-relaxed text-[#334155]">{preset.description}</p>
            </div>

            <div className="mt-5 pt-4 border-t border-[#DCE3EC] flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#334155]">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-[#F1F4F8] px-2.5 py-1 font-medium">
                  <Route className="w-3.5 h-3.5 text-[#525E70]" aria-hidden="true" />
                  <span>
                    <span className="font-mono tabular-nums">
                      {preset.profile.commuteDistanceKm}
                    </span>{' '}
                    km · {MODE_LABELS[preset.profile.currentCommuteMode]}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-[#F1F4F8] px-2.5 py-1 font-medium">
                  <Home className="w-3.5 h-3.5 text-[#525E70]" aria-hidden="true" />
                  <span>
                    {MASK_LABELS[preset.profile.maskType]} ·{' '}
                    {WINDOW_LABELS[preset.profile.windowsState]}
                  </span>
                </span>
              </div>

              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1D4ED8] group-hover:translate-x-0.5 transition-transform">
                <span>Launch preset</span>
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
              </span>
            </div>
          </Link>
        ))}
      </motion.div>
    </section>
  );
}
