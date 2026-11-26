# VayuPlan Stage 7A — Reference Design & Architectural Notes

**Target Aesthetics:** Editorial Climate Flagship (`/` Persuade + `/assistant` Operate)
**References:** `https://watershed.com/` (editorial cadence) & `https://www.electricitymaps.com/` (live intensity telemetry)
**Inspection Status:** Live headless Chrome inspection was unavailable in this session (`DevToolsActivePort ENOENT`); notes below capture the locked architectural direction and concrete adopt/reject rules for Stage 7B implementation, without fabricated browser measurements.

---

## 1. Visual Patterns to Adopt

### Editorial Rhythm & Contrast Cadence (Watershed-Inspired)
- **Warm Mineral Light ↔ Deep Pine-Obsidian Alternating Bands (`/`):** Alternate spacious `#F9F8F5` ivory sections with authoritative `#0B1412` obsidian showcase bands so storytelling sections feel architectural rather than SaaS-boxed.
- **Scale Contrast Over Decorative Ornament:** Pair high-scale tight-tracked display headlines (`clamp(2.75rem, 5.5vw, 4.5rem)`, `-0.035em` letter spacing) with generous open margins and disciplined `65ch` calm reading columns.
- **Restrained Border & Radius Discipline:** Use generous interior padding (`24px`–`32px`), subtle structural hairlines (`#E3E0D7` on light, `#243531` on obsidian), `12px` sheet radii, and quiet directional shadows (`rgba(11, 20, 18, ...)`).
- **Tactile Button Polish:** Crisp dark obsidian primary CTAs (`#0B1412` with `#F4F6F5` ink) transitioning subtly to `#0F766E` / `#115E59` signal pine-teal (`min-h-[44px]` enforced everywhere), paired with clean `#6B7874` solid outline controls (`>= 4.0:1` non-text contrast).

### Live Environmental Instrumentation (Electricity Maps-Inspired)
- **Dark Obsidian Atmospheric Telemetry Command Banner (`/assistant`):** Ground live CPCB NAQI stations on `#0B1412` / `#13201D` dark instrumentation panels featuring a **Radial SVG Arc NAQI Gauge** with smooth spring sweep and subtle live-severity tint, paired with 6 clean pollutant bar meters.
- **Mobile-Legible HTML-Labeled 24h Diurnal Curve:** Keep the SVG focused on the monotone spline curve, soft area wash, shaded `BEST 2H` / `PEAK SMOG` spans, vertical crosshair, and pointer-captured scrubbing (`setPointerCapture`); render Y/X axis ticks and window labels in crisp HTML (`11px`–`12px` minimum CSS px at `375px`).
- **Frameless Modern AI Copilot:** Drop chunky 2019 dark header bars and boxed grey chat bubbles; render Perplexity/Linear-style typographic AI answers directly on pure surface with clean bottom hairline separation, inline cited telemetry pills, and an auto-expanding rounded `<textarea>` composer.

---

## 2. Enterprise Fluff & Legacy Patterns to Reject

- **Zero Grid Paper & Cobalt SaaS Defaults:** Reject `.bg-drafting-grid` graph backgrounds and `#1D4ED8` cobalt blue across all routes.
- **Zero Fake Credibility & Marketing Bloat:** Reject fabricated customer logos, synthetic testimonials, enterprise pricing tiers, stock photography, hero eyebrow kickers, or fake AQI ticker claims outside `src/lib/presets.ts` and `/api/air-quality`.
- **Zero 2019 Visual Clutter & Audit Regressions:**
  - Reject semi-transparent `/70` borders (`< 3.0:1` WCAG 1.4.11 contrast); enforce solid `--border-control` (`#6B7874`).
  - Reject tiny SVG-scaled text (`< 5px` on phones) on chart axes and zone badges.
  - Reject `height: 0 -> "auto"` accordion reflows; use CSS Grid `.disclosure-grid` (`grid-template-rows: 0fr -> 1fr`).
  - Reject 1D `divide-x`/`divide-y` inside multi-row CSS Grids; use symmetrical `gap-px` hairline tracks.
  - Reject gradient text, >1px colored left borders, neon dark-mode halos, and decorative monospace headings.
