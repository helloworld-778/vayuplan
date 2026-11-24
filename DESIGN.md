---
name: VayuPlan
description: Atmospheric Sounding Strip-Chart design system for India's AI-first civic air intelligence platform.
colors:
  atmospheric-cobalt: "#1D4ED8"
  cobalt-deep: "#1E40AF"
  cobalt-wash: "#EFF6FF"
  stratospheric-navy: "#0F172A"
  graph-vellum: "#F7F8FA"
  sheet-white: "#FFFFFF"
  instrument-well: "#F1F4F8"
  carbon-ink: "#0F172A"
  slate-ink: "#334155"
  survey-muted: "#525E70"
  grid-hairline: "#DCE3EC"
  grid-strong: "#CBD5E1"
  naqi-good-text: "#065F46"
  naqi-good-bg: "#ECFDF5"
  naqi-good-border: "#6EE7B7"
  naqi-satisfactory-text: "#3F6212"
  naqi-satisfactory-bg: "#ECFCCB"
  naqi-satisfactory-border: "#BEF264"
  naqi-moderate-text: "#92400E"
  naqi-moderate-bg: "#FFFBEB"
  naqi-moderate-border: "#FCD34D"
  naqi-poor-text: "#9A3412"
  naqi-poor-bg: "#FFF7ED"
  naqi-poor-border: "#FDBA74"
  naqi-verypoor-text: "#991B1B"
  naqi-verypoor-bg: "#FEF2F2"
  naqi-verypoor-border: "#FCA5A5"
  naqi-severe-text: "#581C87"
  naqi-severe-bg: "#FAF5FF"
  naqi-severe-border: "#D8B4FE"
typography:
  display:
    fontFamily: "Bricolage Grotesque, Schibsted Grotesk, sans-serif"
    fontSize: "3.5rem"
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Bricolage Grotesque, Schibsted Grotesk, sans-serif"
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Schibsted Grotesk, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Schibsted Grotesk, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0em"
  label:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.06em"
rounded:
  xs: "2px"
  sm: "4px"
  md: "8px"
  lg: "12px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  section: "64px"
components:
  button-primary:
    backgroundColor: "{colors.stratospheric-navy}"
    textColor: "{colors.sheet-white}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
  button-primary-hover:
    backgroundColor: "{colors.atmospheric-cobalt}"
    textColor: "{colors.sheet-white}"
  button-accent:
    backgroundColor: "{colors.atmospheric-cobalt}"
    textColor: "{colors.sheet-white}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
  button-accent-hover:
    backgroundColor: "{colors.cobalt-deep}"
    textColor: "{colors.sheet-white}"
  button-secondary:
    backgroundColor: "{colors.sheet-white}"
    textColor: "{colors.carbon-ink}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  input-field:
    backgroundColor: "{colors.sheet-white}"
    textColor: "{colors.carbon-ink}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
  card-plate:
    backgroundColor: "{colors.sheet-white}"
    textColor: "{colors.carbon-ink}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Design System: VayuPlan

<!-- SEED: established with the user via /impeccable shape before redesign implementation; re-run /impeccable document once implementation settles to verify extracted tokens. -->

## Overview

**Creative North Star: "The Atmospheric Sounding Strip-Chart"**

VayuPlan bridges public civic storytelling and high-precision environmental decision support through the visual grammar of an Indian atmospheric observatory strip-chart laid over a crisp daylight structural grid. Across both the public entry surface (`/`) and the AI-first operating workspace (`/assistant`), telemetry never floats as isolated decorative boxes; every number, curve, and Gemini synthesis anchors onto a calm graph-vellum drafting plane ruled by subtle construction hairlines (`1px`), disciplined elevation tiers, and high-contrast daylight ink.

To replace the flat, boxed Stage 4 UI and make generative intelligence unmistakable, this system rejects dark-mode neon weather gauges, glassmorphism blur halos, nested card-in-card borders, and buried AI tabs. Instead, `/` speaks in **Persuade** mode with bold scale contrast and a live interactive city-sounding preview, while `/assistant` operates in **Operate** mode with an AI-synthesized **Today's Smart Brief** anchored at the top and a persistent right-hand **Ask VayuPlan Copilot** rail.

**Key Characteristics:**
- **Daylight Graph-Vellum Discipline:** Cool atmospheric mineral canvas (`#F7F8FA`) paired with pure plotted sheets (`#FFFFFF`) and faint structural ruling (`#DCE3EC`).
- **Dual-Voice Editorial & Operational Typography:** `Bricolage Grotesque` commands `/` hero storytelling and primary NAQI numerals, `Schibsted Grotesk` carries high-scanability UI and guidance copy, and `JetBrains Mono` (`tabular-nums`) handles sensor metrics, IST timestamps, and coordinate tags exclusively.
- **AI-First Spatial Hierarchy:** Gemini AI synthesis ("Today's Smart Brief" + persistent "Ask VayuPlan Copilot") occupies primary visual real estate on `/assistant` rather than hiding behind a secondary tab.
- **Scrubbable Strip-Chart Ergonomics:** Smooth cubic diurnal modeling with shaded safe/peak zones, vertical hover/touch crosshairs, and leader-dot floating inspection tooltips.
- **WCAG AA Severity Integrity:** Six CPCB NAQI categories combine high-contrast badges (`>= 4.5:1`), distinct icons, and explicit text labels.

---

## Colors

A daylight-calibrated palette combining cool mineral neutrals with an intentional atmospheric cobalt accent so live AI triggers, scrubbable crosshairs, and active controls stand apart cleanly from semantic pollution severity badges.

### Primary
- **Atmospheric Cobalt** (`#1D4ED8`, hover `#1E40AF`, wash `#EFF6FF`): Dedicated exclusively to Gemini AI triggers, active workspace navigation indicators, chart crosshair focal lines, and primary interactive states.
- **Stratospheric Navy** (`#0F172A`): High-authority action buttons ("Launch Air Assistant"), persistent Copilot header anchor, and primary ink.

### Neutral
- **Graph Vellum Canvas** (`#F7F8FA`): Base viewport ground across `/` and `/assistant`.
- **Pure Sheet White** (`#FFFFFF`): Elevated briefing sheets, active interactive cards, floating chart tooltips, and Copilot workspace surface.
- **Instrument Well** (`#F1F4F8`): Recessed metric wells, secondary input trays, and inactive table headers creating tonal depth without extra borders.
- **Carbon Ink** (`#0F172A`) & **Slate Ink** (`#334155`): Primary headlines and comfortable 65–75ch reading copy.
- **Survey Muted Ink** (`#525E70`): Secondary metadata, units, and timestamps calibrated strictly above `5.5:1` contrast against `#FFFFFF` and `#F7F8FA`.
- **Grid Hairlines** (`#DCE3EC` / `#CBD5E1`): `1px` structural grid lines and table dividers.

### Semantic (CPCB NAQI Severity Tiers)
Every tier enforces `>= 4.5:1` contrast and pairs badge color with a Lucide icon, text category label, and index range:
- **Good (0–50):** Text `#065F46`, surface `#ECFDF5`, border `#6EE7B7` (`ShieldCheck`).
- **Satisfactory (51–100):** Text `#3F6212`, surface `#ECFCCB`, border `#BEF264` (`CheckCircle2`).
- **Moderate (101–200):** Text `#92400E`, surface `#FFFBEB`, border `#FCD34D` (`AlertTriangle`).
- **Poor (201–300):** Text `#9A3412`, surface `#FFF7ED`, border `#FDBA74` (`AlertCircle`).
- **Very Poor (301–400):** Text `#991B1B`, surface `#FEF2F2`, border `#FCA5A5` (`Flame`).
- **Severe (401–500+):** Text `#581C87`, surface `#FAF5FF`, border `#D8B4FE` (`AlertOctagon`).

### Named Rules
**The Atmospheric Restraint Rule.** Atmospheric Cobalt (`#1D4ED8`) never decorates passive backgrounds or competes with CPCB severity badges; reserve it strictly for active focus, AI Copilot cues, and interactive chart scrubbers (`<= 12%` viewport saturation).
**The Color-Independent Severity Rule.** Pollution severity is never conveyed by color alone; every NAQI badge renders text category, numeric bounds, and its distinct semantic icon together.

---

## Typography

**Display Font:** `Bricolage Grotesque` (fallback `Schibsted Grotesk, sans-serif`) — expressive geometric warmth with technical character for `/` Persuade headlines and oversized NAQI index readouts.
**Body / UI Font:** `Schibsted Grotesk` (fallback `-apple-system, BlinkMacSystemFont, sans-serif`) — engineered clarity for dense Indian commuter tables, profiler controls, and AI chat dialogue.
**Telemetry / Label Font:** `JetBrains Mono` (with mandatory `.tabular-nums`) — reserved exclusively for numerical measurements (`µg/m³`, `mg/m³`, `kg CO₂`), IST timestamps, coordinates, and status chips.

**Character:** Combines high-contrast editorial authority on `/` with disciplined, zero-jitter `1.15–1.20` modular scaling on `/assistant` so changing live metrics never shift surrounding layout columns.

### Hierarchy
- **Display (Persuade Hero `/`):** `700` weight, fluid `clamp(2.5rem, 5vw, 3.75rem)`, `1.04` line-height, `-0.03em` tracking. Sets `/` hero thesis and problem narrative.
- **Hero Metric Readout:** `700` weight (`Bricolage Grotesque` or `JetBrains Mono` with `tabular-nums`), `3.25rem` (`52px`) on desktop / `2.5rem` (`40px`) on mobile, `1.0` line-height, `-0.03em` tracking.
- **Headline (Section / Brief Title):** `600` weight, `1.5rem`–`2rem` (`/` fluid, `/assistant` fixed `1.5rem`), `1.2` line-height, `-0.02em` tracking.
- **Title (Panel / Card Header):** `600` weight (`Schibsted Grotesk`), `1.0625rem`–`1.125rem` (`17px`–`18px`), `1.35` line-height.
- **Body (AI Explanations & Copy):** `400` weight (`Schibsted Grotesk`), `0.9375rem` (`15px`) workspace / `1rem` (`16px`) landing prose, `1.6` line-height, constrained to `65–75ch` measure for prose.
- **Label & Micro-Telemetry:** `600` weight (`JetBrains Mono`), `0.75rem` (`12px`) / `0.6875rem` (`11px`), `+0.06em` tracking, uppercase reserved solely for concise tabular/station labels.

### Named Rules
**The Zero-Costume Mono Rule.** Never set headings, narrative paragraphs, or buttons in `JetBrains Mono`; monospace is strictly an instrument of precision for live readings, timestamps, units, and provenance metadata.
**The Anti-Jitter Tabular Rule.** Every animating or dynamically updated numeric value (AQI dial, hourly tooltip, commute CO₂, character counter) carries `.tabular-nums` so numbers tick smoothly without horizontal shift.

---

## Layout

Two distinct surface topologies share one coordinate grid vocabulary (`max-w-[1440px]` outer container with generous `24px`–`32px` desktop gutters and `16px` mobile padding):

### Surface 1: Landing Page (`/`) — Persuade Mode
- **Spatial Grammar:** Full-bleed atmospheric graph-vellum canvas with subtle `32px` architectural drafting grid texture in the hero backdrop (fade-masked softly at edges), pacing smoothly across 5 intentional bands:
  1. **Sticky Minimal Top Nav (`64px` height):** VayuPlan mark, anchor links (*Crisis & Science*, *Scenarios*, *Architecture*), and primary `Launch Air Assistant →` CTA.
  2. **First Viewport Split-Thesis Hero (`min-h-[calc(100vh-64px)]` / balanced asymmetric 12-col):** Left 6 columns deliver the crisp smog crisis thesis headline, concise value statement (`When to step out • How to commute • How to shield indoors`), primary `Launch Air Assistant` CTA, and secondary `Explore Live Cities` jump. Right 6 columns render an **Interactive Live-City Sounding Preview Card** fetching real `/api/air-quality` across a 4-city segmented selector (`New Delhi`, `Mumbai`, `Kolkata`, `Bengaluru`), showing live CPCB NAQI, dominant pollutant, cleanest solar window, and a live mini-preview of the cubic diurnal curve with a direct button to open that city in `/assistant`.
  3. **Three Pillars Proof Strip:** Asymmetric editorial cadence demonstrating Timing Optimization, Modal Shift + Mask Dose Physics, and Indoor Envelope Infiltration with verified formulas and concrete numbers (no fake claims).
  4. **Architecture Strip (Visual Data Pipeline):** Horizontal 4-step pipeline diagram showing `CPCB / WAQI + Open-Meteo` → `Stage 2 Physics Engine` → `Multi-Model Gemini Cascade` → `Deterministic Fallback Guarantee`.
  5. **1-Click Evaluator Scenario Launchers & Footer:** 4 scenario launch cards strictly derived from `src/lib/presets.ts` (zero hardcoded AQI scores) linking directly to `/assistant?preset=<id>`, followed by a quiet non-medical civic footer.

### Surface 2: AI-First Workspace (`/assistant`) — Operate Mode
- **Spatial Grammar:** High-efficiency two-column **AI-First Split Cockpit** keeping Gemini AI continuously visible and central while avoiding hidden tabs for core intelligence:
  - **Top Utility Bar (`64px` sticky):** Brand link back to `/`, debounced Pan-India city search combobox, GPS `Locate Me` trigger, compact 4-preset quick-switcher pills, and inline **Household Context Bar** (collapsible crisp drawer trigger showing persona, commute mode/km, mask, purifier, windows at a glance).
  - **Main Split Workspace (`lg:grid-cols-[minmax(0,1fr)_390px]` / `xl:grid-cols-[minmax(0,1fr)_420px]`, `24px` gap):**
    - **Left Primary Intelligence Column (`min-w-0`):**
      1. **AI Hero Band — Live NAQI Dial + `Today's Smart Brief`:** Left summary anchor shows real-time CPCB NAQI hero score (smooth numeric transition), severity badge + icon, 6-pollutant telemetry micro-strip (`PM2.5`, `PM10`, `NO₂`, `O₃`, `CO`, `SO₂`), and station provenance/IST footer; directly adjacent sits **Today's Smart Brief**—a prominent AI-synthesized briefing card displaying the Gemini executive summary, top 3 immediate prioritized actions (`Morning`, `Transit`, `Indoor`), effort tags, and `Gemini AI` / `Deterministic Physics Fallback` status badge (never hidden in a tab!).
      2. **Workspace Analytical Tabs (`Daily Routine & Safe Hours` | `Commute & Emissions` | `Indoor Action Lab`):** Animated active underline via Framer Motion `layoutId`, keeping the interactive **Diurnal Exposure Curve** featured prominently in the default view above the 4 diurnal daypart cards (`06:00–11:59`, `12:00–16:59`, `17:00–21:59`, `22:00–05:59`) and structured Morning/Afternoon/Evening action protocol cards.
    - **Right Persistent AI Copilot Panel (`sticky top-[80px] h-[calc(100vh-96px)]` on `lg+`):**
      - Dedicated **Ask VayuPlan Copilot** always mounted and interactive alongside any analytical view—never buried in a tab! Includes active city/NAQI chip, 4 context-aware starter prompt chips, conversational message stream with cited live metric pills (`tabular-nums`), AI/Fallback diagnostic mode badge, and 400-character bounded prompt composer.
      - **Mobile / Tablet (`< 1024px`) Adaptation:** Right rail seamlessly transitions to a **prominent fixed bottom-right floating trigger pill** (`Ask VayuPlan AI`, minimum `48px` height, cobalt accent with subtle pulse-free ambient shadow) opening a full-height accessible slide-up Copilot drawer (`<dialog>` / Framer Motion sheet with Escape & focus trap), plus quick-ask anchor from `Today's Smart Brief`.

---

## Elevation & Depth

Surface depth is built through **tonal stepping + soft warm-slate ambient shadows + 1px structural hairlines**, replacing Stage 4's uniform flat `border` boxes:

- **Level 0 — Graph Vellum Ground (`#F7F8FA`):** Continuous workspace plane.
- **Level 1 — Plotted Sheet (`#FFFFFF`):** Subtle `1px solid #DCE3EC` border paired with soft grounding shadow (`0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.03)`).
- **Level 2 — Focused / Interactive Surface (`#FFFFFF` hover or Copilot Rail):** Crisp `#CBD5E1` border with medium elevation (`0 4px 16px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.04)`).
- **Level 3 — Floating Popovers, Tooltip Card & Mobile AI Sheet:** Sharp high-clarity elevation (`0 12px 32px -4px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(15, 23, 42, 0.05)`) with `1px solid #CBD5E1` edge definition and zero `backdrop-blur` glass slop.

### Motion Choreography
All motion runs through GPU-composited `transform` and `opacity` properties (`framer-motion` `<MotionConfig reducedMotion="user">`) and collapses cleanly to instant state cuts when `prefers-reduced-motion: reduce` is active:
1. **`/` Hero Choreography:** Staggered vertical reveal (`y: 16 -> 0`, `opacity: 0 -> 1`, `duration: 0.42s`, exponential ease-out `[0.16, 1, 0.3, 1]`, `60ms` sibling stagger) landing crisp above the fold immediately; scroll sections reveal gently once (`viewport={{ once: true, amount: 0.2 }}`) without keeping content hidden on slow loads.
2. **Smooth Active Tab Indicator:** Framer Motion `layoutId="workspace-active-tab"` spring indicator (`stiffness: 420, damping: 34`) glides cleanly beneath the active tab on `/assistant` and `/` city preview switchers.
3. **Live AQI Score Transitions:** Smooth animated numeric interpolation (`0.45s` ease-out via `requestAnimationFrame` / Framer Motion spring counter, skipped instantly under reduced motion) whenever switching cities or refreshing live stations, paired with subtle opacity crossfade on telemetry strips.
4. **Drawer & Panel Reveals:** Smooth slide/expand transitions (`200ms`–`240ms`) for the collapsible Household Profiler panel, search combobox dropdown, and mobile Ask VayuPlan bottom drawer.

### Named Rules
**The Flat-Zero-Glow Rule.** Never apply zero-offset colored neon halos, blur glows, or `>1px` colored left/right accent borders on cards. Depth comes strictly from directional daylight shadows and tonal wells.

---

## Shapes

- **Sheet & Panel Containers:** `12px` radius (`--rounded-lg`) for primary workspace sheets, Today's Smart Brief, Copilot rail, and interactive chart canvas.
- **Buttons, Inputs & Sub-Cards:** `8px` radius (`--rounded-md`) for interactive buttons, form controls, select inputs, and action recommendation cards.
- **Metric Wells & Micro Badges:** `4px` radius (`--rounded-sm`) for inline pollutant tiles, CPCB severity badges, and cited metric chips; `2px` (`--rounded-xs`) for chart legend swatches.
- **Floating Triggers:** `9999px` pill reserved solely for the mobile floating `Ask VayuPlan` trigger button and compact status indicators.

---

## Components

### Buttons & Interactive Triggers
- **Primary Action (`Launch Air Assistant`):** `#0F172A` fill, `#FFFFFF` text, `8px` radius, minimum `44px` touch height, transitions `180ms` to `#1D4ED8` on hover with subtle `-1px` lift; `2px solid #1D4ED8` outer focus ring (`2px` offset).
- **AI Accent Trigger (`Ask`, `Update Plan`):** `#1D4ED8` fill, `#FFFFFF` text, `8px` radius, clear disabled opacity (`0.55`) and inline loading spinner state.
- **Secondary / Utility Controls (`GPS`, `Refresh`, `Edit Profile`):** `#FFFFFF` fill, `1px solid #CBD5E1`, `#0F172A` ink, minimum `40px`–`44px` comfortable touch target.

### Signature Component 1: Interactive Diurnal Exposure Curve (`HourlyExposureChart`)
- **Geometry:** Responsive SVG canvas (`viewBox="0 0 800 260"`) over crisp horizontal reference ticks (`1px` dashed `#E2E8F0`) and subtle baseline zero-axis.
- **Smooth Cubic Path:** Monotone cubic spline / smooth Catmull-Rom Bézier path (`2.5px` stroke `#0F172A` with subtle cobalt gradient overlay at peak contrast) paired with a soft vertical linear-gradient area fill (`rgba(29, 78, 216, 0.14)` fading to `rgba(29, 78, 216, 0.01)`).
- **Shaded Exposure Zones:**
  - `Best 2h Window`: Soft emerald wash (`rgba(5, 150, 105, 0.10)`) with top dashed cap (`#059669`) and clean `BEST 2H` badge label.
  - `Peak Smog Window`: Soft crimson wash (`rgba(220, 38, 38, 0.09)`) with top dashed cap (`#DC2626`) and clean `PEAK SMOG` badge label.
- **Full-Column Vertical Crosshair Scrubber:** Invisible vertical hit-columns spanning the full plot height (`0` to `chartHeight`) trigger pointer move (`onPointerMove`), click/tap (`onPointerDown`), and keyboard horizontal scrubbing (`ArrowLeft`/`ArrowRight` across focusable hour markers). On active index:
  - Draws a crisp `1.5px` vertical crosshair line (`#1D4ED8`), glowing-free concentric active node ring (`6px` white center, `2.5px` cobalt stroke), and horizontal subtle guide dot.
  - Renders a **crisp floating tooltip card** (HTML overlay positioned dynamically inside chart bounds without clipping at edges, flipping left/right near boundaries) displaying: **Exact Hour (IST)**, **PM2.5 (`µg/m³`)**, **PM10 (`µg/m³`)**, color-coded + icon-paired **CPCB NAQI Badge**, and concise **Safety Posture** string.
- **Mathematical Safety:** Handles `0` points (clean accessible empty state + `sr-only`), `1` point (centered coordinate without `NaN`), and flat curves (`min === max` bounded cleanly with positive ceiling).

### Signature Component 2: Always-Visible AI Hero + Persistent Copilot (`Today's Smart Brief` & `Ask VayuPlan`)
- **Today's Smart Brief (`/assistant` Top Hero Card):** Displays a verified mode pill (`Gemini AI` with `Sparkles` icon vs. `Deterministic Physics Fallback` + non-secret diagnostic code), Gemini's personalized 2–3 sentence summary, and 3 top prioritized action pills (`Morning Window`, `Best Transit`, `Home Sealing`) linking directly into detailed workspace panels.
- **Persistent Right-Hand Copilot (`Ask VayuPlan`):** Fixed-right sticky rail (`390px–420px`) on `lg+` viewports containing header (`Ask VayuPlan` + live city/NAQI chip), scrollable thread with user bubbles (`#0F172A`), AI cards (`#F1F4F8` well + `#DCE3EC` border + cited live metric pills + mode badge), 4 dynamic city/persona starter chips, and sticky bottom prompt form (`400`-char live counter + Enter-to-send). On mobile (`<1024px`), collapses into a bottom-right floating action button opening an animated sheet drawer.

### Evaluators, Tables & Profilers
- **Household Profiler:** Compact top bar summarizing active persona, commute mode/distance (`0`–`60` km slider auto-locked to `0` km when `work_from_home`), mask, window state, purifier, and incense toggles inside a smooth collapsible drawer (`Edit Settings` / `Apply Changes` / `Reset`).
- **Commute Optimizer Table:** Horizontally scrollable (`overflow-x-auto`, `min-w-[620px]`) on narrow screens (`375px`) with clear `CURRENT` and `PICK` pills, `tabular-nums` alignment, and automatic severe-smog warning banner whenever `NAQI > 200`.

---

## Do's and Don'ts

### Do:
- **Do** keep `Ask VayuPlan Copilot` and `Today's Smart Brief` immediately visible on `/assistant` without requiring a tab switch.
- **Do** enforce WCAG AA (`>= 4.5:1`) contrast on all text, including muted telemetry labels (`#525E70` minimum darkness on `#FFFFFF`/`#F7F8FA`) and all 6 CPCB NAQI severity tiers.
- **Do** wrap all Framer Motion sequences in `<MotionConfig reducedMotion="user">` so `prefers-reduced-motion: reduce` disables spatial transitions cleanly.
- **Do** preserve `AbortController` race-condition protection on city/preset fetches and `min-w-[...]` inside `overflow-x-auto` containers for zero horizontal overflow at `375px`.

### Don't:
- **Don't** render `JetBrains Mono` as decorative display/paragraph copy, or use dark-mode neon gradients, glassmorphism blur backdrops, or `>1px` colored left borders.
- **Don't** bury `/` scenario launchers behind generic marketing claims; every preset card on `/` must derive from `src/lib/presets.ts` with zero hardcoded static AQI numbers.
- **Don't** expose `GEMINI_API_KEY`, `WAQI_API_TOKEN`, or add third-party external CDN scripts that violate `next.config.ts` strict CSP.
