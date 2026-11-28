"use client";

import React from "react";
import Link from "next/link";
import { Wind, ArrowRight } from "lucide-react";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-40 h-16 bg-canvas border-b border-subtle">
      <div className="max-w-[1440px] mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 min-h-[44px] group rounded-md pr-2"
        >
          <span className="w-9 h-9 rounded-lg bg-obsidian group-hover:bg-accent text-ink-on-dark flex items-center justify-center transition-colors shrink-0">
            <Wind className="w-5 h-5 text-accent-on-dark" aria-hidden="true" />
          </span>
          <span className="font-display font-bold text-xl tracking-tight text-ink">
            VayuPlan
          </span>
        </Link>

        <nav
          aria-label="Landing page sections"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-ink-secondary"
        >
          <a
            href="#science"
            className="hover:text-ink transition-colors inline-flex items-center min-h-[44px] px-1"
          >
            Science
          </a>
          <a
            href="#architecture"
            className="hover:text-ink transition-colors inline-flex items-center min-h-[44px] px-1"
          >
            Architecture
          </a>
          <a
            href="#scenarios"
            className="hover:text-ink transition-colors inline-flex items-center min-h-[44px] px-1"
          >
            Scenarios
          </a>
        </nav>

        <Link
          href="/assistant"
          className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 min-h-[44px] rounded-lg bg-obsidian hover:bg-accent text-ink-on-dark hover:text-white text-sm font-semibold transition-all duration-150 hover:-translate-y-px shrink-0"
        >
          <span>Launch Air Assistant</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}
