"use client";

import React from "react";
import Link from "next/link";
import { Wind, ArrowRight } from "lucide-react";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-40 h-16 bg-[#FFFFFF] border-b border-[#DCE3EC]">
      <div className="max-w-[1440px] mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 group focus-visible:outline-2 focus-visible:outline-[#1D4ED8] rounded-md"
        >
          <span className="w-9 h-9 rounded-lg bg-[#0F172A] text-[#FFFFFF] flex items-center justify-center transition-colors group-hover:bg-[#1D4ED8]">
            <Wind className="w-5 h-5 text-[#93C5FD]" aria-hidden="true" />
          </span>
          <span className="font-display font-bold text-xl tracking-tight text-[#0F172A]">
            VayuPlan
          </span>
        </Link>

        <nav
          aria-label="Landing page sections"
          className="hidden md:flex items-center gap-8 text-sm font-medium text-[#334155]"
        >
          <a
            href="#science"
            className="hover:text-[#0F172A] transition-colors py-2"
          >
            Science
          </a>
          <a
            href="#architecture"
            className="hover:text-[#0F172A] transition-colors py-2"
          >
            Architecture
          </a>
          <a
            href="#scenarios"
            className="hover:text-[#0F172A] transition-colors py-2"
          >
            Scenarios
          </a>
        </nav>

        <Link
          href="/assistant"
          className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 min-h-[44px] rounded-lg bg-[#0F172A] hover:bg-[#1D4ED8] text-[#FFFFFF] text-sm font-semibold transition-all duration-150 hover:-translate-y-px"
        >
          <span>Launch Air Assistant</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}
