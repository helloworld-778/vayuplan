---
name: VayuPlan
description: Editorial Climate Flagship design system combining warm daylight editorial pacing, pine-obsidian live telemetry instrumentation, and frameless AI air guidance.
colors:
  bg-canvas: "#F9F8F5"
  bg-surface: "#FFFFFF"
  bg-subtle: "#F2F0EA"
  bg-obsidian: "#0B1412"
  bg-obsidian-elevated: "#13201D"
  ink-primary: "#111816"
  ink-secondary: "#374440"
  ink-muted: "#52605C"
  ink-on-dark: "#F4F6F5"
  ink-on-dark-muted: "#A7B7B2"
  accent-primary: "#0F766E"
  accent-primary-hover: "#115E59"
  accent-on-dark: "#2DD4BF"
  border-subtle: "#E3E0D7"
  border-control: "#6B7874"
  border-dark: "#243531"
  naqi-good-text: "#065F46"
  naqi-good-bg: "#ECFDF5"
  naqi-good-border: "#6EE7B7"
  naqi-good-dark-text: "#6EE7B7"
  naqi-good-dark-bg: "#0F2922"
  naqi-satisfactory-text: "#3F6212"
  naqi-satisfactory-bg: "#ECFCCB"
  naqi-satisfactory-border: "#BEF264"
  naqi-satisfactory-dark-text: "#BEF264"
  naqi-satisfactory-dark-bg: "#1F2C12"
  naqi-moderate-text: "#92400E"
  naqi-moderate-bg: "#FFFBEB"
  naqi-moderate-border: "#FCD34D"
  naqi-moderate-dark-text: "#FCD34D"
  naqi-moderate-dark-bg: "#2D210B"
  naqi-poor-text: "#9A3412"
  naqi-poor-bg: "#FFF7ED"
  naqi-poor-border: "#FDBA74"
  naqi-poor-dark-text: "#FDBA74"
  naqi-poor-dark-bg: "#311A0B"
  naqi-verypoor-text: "#991B1B"
  naqi-verypoor-bg: "#FEF2F2"
  naqi-verypoor-border: "#FCA5A5"
  naqi-verypoor-dark-text: "#FCA5A5"
  naqi-verypoor-dark-bg: "#331214"
  naqi-severe-text: "#581C87"
  naqi-severe-bg: "#FAF5FF"
  naqi-severe-border: "#D8B4FE"
  naqi-severe-dark-text: "#D8B4FE"
  naqi-severe-dark-bg: "#241433"
typography:
  display:
    fontFamily: "Bricolage Grotesque, Instrument Sans, sans-serif"
    fontSize: "clamp(2.75rem, 5.5vw, 4.5rem)"
    fontWeight: 700
    lineHeight: 1.03
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Bricolage Grotesque, Instrument Sans, sans-serif"
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Instrument Sans, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Instrument Sans, sans-serif"
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
  section: "72px"
components:
  button-primary:
    backgroundColor: "{colors.bg-obsidian}"
    textColor: "{colors.ink-on-dark}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
  button-primary-hover:
    backgroundColor: "{colors.accent-primary}"
    textColor: "#FFFFFF"
  button-accent:
    backgroundColor: "{colors.accent-primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "12px 20px"
  button-accent-hover:
    backgroundColor: "{colors.accent-primary-hover}"
    textColor: "#FFFFFF"
  button-secondary:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.ink-primary}"
    borderColor: "{colors.border-control}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  input-field:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.ink-primary}"
    borderColor: "{colors.border-control}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
  card-plate:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.ink-primary}"
    borderColor: "{colors.border-subtle}"
    rounded: "{rounded.lg}"
    padding: "24px"
  obsidian-banner:
    backgroundColor: "{colors.bg-obsidian}"
    textColor: "{colors.ink-on-dark}"
    borderColor: "{colors.border-dark}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Design System: VayuPlan — Editorial Climate Flagship

## Overview

**Creative North Star: "Editorial Climate Flagship"**

VayuPlan pairs the editorial poise of modern climate reporting with real-time Indian urban environmental instrumentation. Inspired by Watershed's calm mineral-ivory and deep-obsidian cadence alongside Electricity Maps' live atmospheric telemetry gauges and legible 24-hour curves, VayuPlan speaks in two distinct registers without generic SaaS boilerplate:

- **Persuade (`/`):** Tactile Warm Mineral Ivory (`#F9F8F5`) alternating cleanly with Deep Pine-Obsidian (`#0B1412`) showcase bands, bold tight-tracked editorial headlines, restrained card elevation, and a live pan-India telemetry showcase grounded strictly in `src/lib/presets.ts` and live API endpoints.
- **Operate (`/assistant`):** High-clarity daylight workspace (`#F9F8F5` ground, `#FFFFFF` structured sheets, `#F2F0EA` stone wells) anchored at the top by a Dark Obsidian **Atmospheric Telemetry Command Banner** (with a radial SVG arc NAQI gauge and 6 pollutant bars) and **Today's Smart Brief**, alongside a persistent, **Frameless Modern AI Copilot** (`Ask VayuPlan`).

---

## Colors

### Surface & Ink Tokens (CSS Custom Properties + `@theme inline`)
Every UI surface consumes semantic tokens from [globals.css](src/app/globals.css) rather than arbitrary inline hex literals:

| Token | Value | Purpose & Verified Contrast |
| --- | --- | --- |
| `--bg-canvas` | `#F9F8F5` | Warm Mineral Ivory primary page canvas |
| `--bg-surface` | `#FFFFFF` | Pure crisp content sheet & card surface |
| `--bg-subtle` | `#F2F0EA` | Warm Stone recessed wells & table headers |
| `--bg-obsidian` | `#0B1412` | Deep Pine-Obsidian showcase bands, Telemetry Command Hero & primary CTA |
| `--bg-obsidian-elevated` | `#13201D` | Elevated card/tile containers inside obsidian bands |
| `--ink-primary` | `#111816` | Deep Charcoal-Pine Ink (**16.96:1** on ivory, **18.01:1** on white) |
| `--ink-secondary` | `#374440` | Primary prose & guidance copy (**9.58:1** on ivory, **10.18:1** on white) |
| `--ink-muted` | `#52605C` | Metadata, units & timestamps (**6.21:1** on ivory, **6.59:1** on white, **5.78:1** on subtle) |
| `--ink-on-dark` | `#F4F6F5` | Primary ink inside obsidian sections (**17.23:1** on `#0B1412`, **15.45:1** on `#13201D`) |
| `--ink-on-dark-muted` | `#A7B7B2` | Muted labels inside obsidian sections (**8.96:1** on `#0B1412`, **8.03:1** on `#13201D`) |
| `--accent-primary` | `#0F766E` | Signal Pine-Teal for AI triggers, active tabs & chart crosshairs (**5.47:1** with `#FFFFFF`, **5.15:1** on ivory) |
| `--accent-primary-hover` | `#115E59` | Signal Pine-Teal hover state (**7.58:1** with `#FFFFFF`) |
| `--accent-on-dark` | `#2DD4BF` | Luminous Teal focal highlights & dark focus rings on obsidian (**10.05:1** on `#0B1412`) |
| `--border-subtle` | `#E3E0D7` | Soft light-surface structural hairlines |
| `--border-control` | `#6B7874` | **Solid** UI control boundary for inputs, selects & outline buttons (**4.60:1** on white, **4.33:1** on ivory, **4.04:1** on subtle; satisfies WCAG SC 1.4.11 without opacity dilution) |
| `--border-dark` | `#243531` | Structural hairlines inside obsidian bands |

### Semantic CPCB NAQI Severity Tokens (`>= 4.5:1` Light & Dark Verified)
Every NAQI tier pairs contrast-checked colors with its distinct Lucide icon, numeric bounds, and explicit label (never color alone):

| Tier (Range) | Light Badge (`text` / `bg` / `border`) | Light Ratio | Dark Surface Variant (`text` / `bg`) | Dark Ratio |
| --- | --- | --- | --- | --- |
| **Good (0–50)** | `#065F46` / `#ECFDF5` / `#6EE7B7` | **7.29:1** | `#6EE7B7` / `#0F2922` | **10.13:1** |
| **Satisfactory (51–100)** | `#3F6212` / `#ECFCCB` / `#BEF264` | **6.52:1** | `#BEF264` / `#1F2C12` | **11.26:1** |
| **Moderate (101–200)** | `#92400E` / `#FFFBEB` / `#FCD34D` | **6.84:1** | `#FCD34D` / `#2D210B` | **10.92:1** |
| **Poor (201–300)** | `#9A3412` / `#FFF7ED` / `#FDBA74` | **6.88:1** | `#FDBA74` / `#311A0B` | **9.70:1** |
| **Very Poor (301–400)** | `#991B1B` / `#FEF2F2` / `#FCA5A5` | **7.60:1** | `#FCA5A5` / `#331214` | **8.94:1** |
| **Severe (401–500+)** | `#581C87` / `#FAF5FF` / `#D8B4FE` | **10.14:1** | `#D8B4FE` / `#241433` | **9.71:1** |

### Named Color Rules
1. **The Signal Teal Discipline Rule:** Use `--accent-primary` (`#0F766E`) strictly for interactive AI calls-to-action, active navigation/tab state, focus rings, and chart crosshairs; use `--accent-on-dark` (`#2DD4BF`) strictly on `#0B1412` / `#13201D` obsidian surfaces.
2. **The Solid Boundary Rule:** Interactive controls (`<input>`, `<select>`, `<textarea>`, secondary outline buttons) must use solid `--border-control` (`#6B7874`), never translucent `/70` opacity borders.

---

## Typography

Loaded strictly via self-hosted `next/font/google` (`display: "swap"`) with tight weights to minimize payload and uphold CSP (`font-src 'self'`):

- **Display Font (`--font-display`):** `Bricolage Grotesque` (weights `600`, `700`) — expressive editorial presence on `/` (`clamp(2.75rem, 5.5vw, 4.5rem)`, line-height `1.03`, tracking `-0.035em`) and radial NAQI telemetry figures (`font-bold tabular-nums`).
- **Body / UI Font (`--font-sans`):** `Instrument Sans` (weights `400`, `500`, `600`, `700`) — crisp, modern neo-grotesque clarity for Indian commuter tables, form controls, and frameless AI prose (`0.9375rem`, line-height `1.6`, measure capped at `65–75ch`).
- **Telemetry Font (`--font-mono`):** `JetBrains Mono` (weights `500`, `600`) — strictly `.tabular-nums` for pollutant units (`µg/m³`, `mg/m³`), IST timestamps, coordinates, and index readouts; never used as decorative headings or body copy.

---

## Elevation, Motion & Structural Patterns

- **Elevation Tiers (Warm Charcoal-Pine Shadows):**
  - `Level 1`: `0 1px 2px rgba(11, 20, 18, 0.04), 0 4px 12px rgba(11, 20, 18, 0.03)` with `border-subtle`.
  - `Level 2`: `0 4px 16px rgba(11, 20, 18, 0.06), 0 1px 3px rgba(11, 20, 18, 0.04)` for elevated sheets and focused cards.
  - `Level 3`: `0 12px 32px -4px rgba(11, 20, 18, 0.14), 0 2px 6px rgba(11, 20, 18, 0.06)` for floating chart inspection tooltips, combobox popovers, and mobile modal drawers.
- **Zero-Reflow Disclosures (`.disclosure-grid`):** Accordions (`HouseholdProfiler`, `MechanismDisclosure`) animate via CSS `grid-template-rows: 0fr -> 1fr`, eliminating frame-by-frame `height: auto` layout reflow.
- **Reduced Motion Compliance:** `<MotionConfig reducedMotion="user">` wraps the application, and `@media (prefers-reduced-motion: reduce)` explicitly halts `.animate-spin`, `.animate-ping`, `.animate-pulse`, and smooth scrolling.
- **Symmetrical Multi-Row Grids:** Multi-row responsive cards use hairline `bg-[var(--border-subtle)] gap-px` tracks rather than 1D `divide-x`/`divide-y` modifiers.

---

## Signature Surface Patterns

### 1. Alternating Editorial Surface Cadence (`/`)
Warm Mineral Ivory (`bg-canvas`) hero & analytical explainer bands alternate cleanly with full-bleed Pine-Obsidian (`bg-obsidian`) live telemetry & pipeline showcase sections, maintaining generous vertical cadence without grid backgrounds, eyebrow kickers, gradient text, or fabricated social proof.

### 2. Obsidian Atmospheric Telemetry Command Banner (`/assistant`)
Mounted at the head of `/assistant` using `--bg-obsidian` (`#0B1412`) and `--bg-obsidian-elevated` (`#13201D`) with subtle live-severity radial tint:
- **Radial SVG Arc NAQI Gauge:** Animated spring sweep (`0–500` CPCB scale) framing oversized `tabular-nums` NAQI telemetry alongside its dark-variant CPCB severity pill.
- **6-Pollutant Progress Strip:** Crisp progress meters for `PM2.5`, `PM10`, `NO₂`, `O₃`, `CO`, and `SO₂` relative to CPCB benchmarks.

### 3. Frameless Modern AI Copilot (`Ask VayuPlan` & `Today's Smart Brief`)
- Rejects chunky 2019 boxed grey chat bubbles and heavy dark header bars.
- Renders clean typographic AI synthesis directly on `--bg-surface` / `--bg-canvas` with hairline dividers (`--border-subtle`), inline `tabular-nums` metric pills, accessible screen-reader fallback clarity, `min-h-[44px]` action triggers, and a rounded auto-expanding `<textarea>` composer (`400`-char live counter).
- On `< 1024px`, transitions cleanly to a mobile drawer that applies `inert` / `aria-hidden` to obscured sibling page regions.

### 4. Mobile-Legible HTML-Labeled Diurnal Curve (`HourlyExposureChart`)
- **SVG Canvas:** Renders the monotone cubic spline, gradient area wash, shaded `BEST 2H` / `PEAK SMOG` zones, and crisp `--accent-primary` (`#0F766E`) crosshair line (`setPointerCapture` enabled for smooth mobile touch scrubbing).
- **HTML Axis & Band Labels:** Y-axis scale ticks (`0`, `100`, `200`, `300`, `400`), X-axis IST hour markers, and `BEST 2H` / `PEAK SMOG` callout pills render in DOM HTML (`11px`–`12px` CSS floor at `375px` width) rather than inside shrinking SVG `viewBox` coordinates.

---

## Do's and Don'ts

- **Do** consume CSS token utilities (`bg-canvas`, `bg-surface`, `bg-subtle`, `bg-obsidian`, `bg-obsidian-elevated`, `text-ink`, `text-ink-muted`, `border-subtle`, `border-control`, `bg-accent`, `text-accent`) everywhere instead of hardcoded hex utilities.
- **Do** keep every interactive button, tab, switch hit wrapper, and disclosure toggle at `min-h-[44px]` (`44px` minimum touch ergonomics) with solid `>= 3:1` boundaries and visible `2px` focus rings.
- **Don't** render eyebrow kickers above section headings, >1px colored left borders on cards, gradient text, neon blur halos, or drafting-grid patterns.
- **Don't** compromise `next.config.ts` strict CSP, server-side secret isolation, or non-medical environmental advisory disclosures.
