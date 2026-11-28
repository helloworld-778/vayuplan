import { Wind } from "lucide-react";
import { LandingNav } from "@/components/landing/LandingNav";
import { HeroSection } from "@/components/landing/HeroSection";
import { ThreePillarsSection } from "@/components/landing/ThreePillarsSection";
import { ArchitecturePipeline } from "@/components/landing/ArchitecturePipeline";
import { ScenarioLaunchers } from "@/components/landing/ScenarioLaunchers";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink overflow-x-clip">
      <LandingNav />

      <main id="main-content" className="flex-1">
        <HeroSection />
        <ThreePillarsSection />
        <ArchitecturePipeline />
        <ScenarioLaunchers />
      </main>

      <footer className="border-t border-subtle bg-surface">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5 text-sm text-ink-secondary">
            <span className="w-7 h-7 rounded-md bg-obsidian text-ink-on-dark flex items-center justify-center shrink-0">
              <Wind className="w-4 h-4 text-accent-on-dark" aria-hidden="true" />
            </span>
            <span className="font-display font-bold text-ink">VayuPlan</span>
            <span aria-hidden="true" className="text-ink-muted">
              ·
            </span>
            <span className="text-xs text-ink-muted">
              Live WAQI/CPCB &amp; Open-Meteo CAMS telemetry
            </span>
          </div>

          <p className="text-xs text-ink-muted">
            Informational environmental guidance only—not medical advice, diagnosis, or clinical treatment.
          </p>
        </div>
      </footer>
    </div>
  );
}
