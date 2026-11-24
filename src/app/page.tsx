import Link from 'next/link';
import { Wind } from 'lucide-react';
import { LandingNav } from '@/components/landing/LandingNav';
import { HeroSection } from '@/components/landing/HeroSection';
import { ThreePillarsSection } from '@/components/landing/ThreePillarsSection';
import { ArchitecturePipeline } from '@/components/landing/ArchitecturePipeline';
import { ScenarioLaunchers } from '@/components/landing/ScenarioLaunchers';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8FA] text-[#0F172A]">
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      <LandingNav />

      <main id="main-content" className="flex-1">
        <HeroSection />
        <ThreePillarsSection />
        <ArchitecturePipeline />
        <ScenarioLaunchers />
      </main>

      <footer className="border-t border-[#DCE3EC] bg-[#FFFFFF]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2">
              <span className="w-7 h-7 rounded-md bg-[#0F172A] text-[#FFFFFF] flex items-center justify-center">
                <Wind className="w-4 h-4 text-[#93C5FD]" aria-hidden="true" />
              </span>
              <span className="font-display font-bold text-base tracking-tight text-[#0F172A]">
                VayuPlan
              </span>
            </div>

            <p className="text-sm text-[#334155] leading-relaxed">
              Civic air-exposure planner computing Indian CPCB National Air Quality Index
              (NAQI) scores and hourly microenvironment estimates from live WAQI/CPCB station
              feeds and Open-Meteo forecasts.
            </p>

            <p className="text-xs text-[#525E70] leading-relaxed">
              Informational environmental guidance only—not medical advice, diagnosis, or
              clinical treatment. Consult a qualified clinician for respiratory symptoms or
              personalized health decisions.
            </p>
          </div>

          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap items-center gap-6 text-sm font-medium text-[#334155]"
          >
            <a href="#science" className="hover:text-[#0F172A] transition-colors">
              Science
            </a>
            <a href="#architecture" className="hover:text-[#0F172A] transition-colors">
              Architecture
            </a>
            <a href="#scenarios" className="hover:text-[#0F172A] transition-colors">
              Scenarios
            </a>
            <Link
              href="/assistant"
              className="font-semibold text-[#1D4ED8] hover:text-[#1E40AF] transition-colors"
            >
              Launch Air Assistant
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
