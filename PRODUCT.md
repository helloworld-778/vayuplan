# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary Users**: Indian urban residents across metro cities (Delhi, Mumbai, Kolkata, Bengaluru) and Tier-2 cities navigating seasonal winter thermal inversions, dust events, and traffic pollution—specifically daily commuters, families with children, senior citizens, and student athletes.
- **Secondary Evaluators**: Google Prompt Wars Challenge 6 judges and technical reviewers evaluating pan-India live telemetry, scientific accuracy, AI grounding, and resilient fallback behavior via 1-click scenarios.

## Product Purpose

VayuPlan transforms raw pan-India air quality indices into personalized, physics-grounded daily protection and emission-reduction plans across three core questions: **when** to step outside safely, **how** to commute with lower inhaled PM2.5 and lower carbon emissions, and **how** to protect indoor air.

The product spans two coordinated web surfaces:
1. **Entry & Overview (`/`)**: Introduces India's urban smog challenge, VayuPlan's live CPCB + Gemini AI architecture, a live-city preview, and 1-click evaluator scenario launchers that transition directly into `/assistant` with city and profile state preserved.
2. **AI Air Intelligence Workspace (`/assistant`)**: An AI-first civic workspace where Gemini AI (Ask VayuPlan Copilot and Live Personalized Action Brief) remains continuously visible and central alongside the Diurnal Exposure Curve, Commute Impact Optimizer, and Indoor Action Lab.

## Positioning

Civic-scientific precision grounded in transparent telemetry and deterministic microenvironment physics: unlike generic AQI tickers that show static city numbers without context, VayuPlan computes personal inhaled PM2.5 mass balance, residential infiltration, and diurnal clearing windows from live CPCB/WAQI and Open-Meteo data, then synthesizes actionable guidance through a resilient multi-model Gemini cascade with instant mathematical fallback.

## Operating Context

- **Pan-India Discovery**: Supports city/district search across India (`/api/locations`), browser GPS reverse geocoding within India bounds, and 4 quick-test evaluator presets (`delhi-commuter`, `mumbai-family`, `kolkata-senior`, `bengaluru-student` in `src/lib/presets.ts`).
- **Seamless Surface Handoff**: Launching a preset or CTA from `/` opens `/assistant` with the chosen location and household profile preserved.
- **Telemetry & AI Pipeline**: Server-side telemetry fusion (`/api/air-quality`), deterministic Stage 2 physics orchestration, grounded AI plan and Q&A endpoints (`/api/assistant/plan`, `/api/assistant/chat`), and non-secret diagnostics (`/api/health`).
- **Localization & Units**: English interface formatted for Indian Standard Time (`Asia/Kolkata`, IST) and metric units (`µg/m³`, `mg/m³`, `km`, `g`/`kg` CO2).

## Capabilities and Constraints

- **Preserved Backend & Science**: All Stage 1–3 backend APIs, CPCB NAQI interpolation, US EPA-to-raw-concentration conversion, and Stage 2 calculators remain intact.
- **Reliability & Tests**: Maintain existing test coverage (126 passing backend, API, and UI/accessibility tests across 15 suites; floor >= 119) plus clean `typecheck`, `lint`, and Next.js production builds.
- **Security & Size**: Preserve zero client-side secrets, strict Content Security Policy headers in `next.config.ts`, sliding-window IP rate limiting, input sanitization, and under-10 MB repository size (currently ~0.68 MB excluding `node_modules` and `.next`).
- **Non-Medical Boundary**: Advisory output is strictly environmental risk mitigation grounded in CPCB guidelines and exposure physics, never personal medical advice.
- **Truthfulness Constraint**: Never fabricate customer counts, testimonials, pricing plans, press quotes, or unverified environmental claims.

## Brand Commitments

- **Name**: VayuPlan
- **Voice & Tone**: Civic-scientific precision—calm, authoritative, transparent public-interest advisor anchored strictly in live station telemetry and physical mechanisms.

## Evidence on Hand

- Official Indian CPCB NAQI segmented linear breakpoints and pollutant sub-index calculator (`src/lib/aqi/naqi.ts`).
- US EPA sub-index to raw PM2.5/PM10 inverse converter for WAQI station ingestion (`src/lib/aqi/waqi-convert.ts`).
- Deterministic exposure window, commute inhaled dose & CO2, and indoor infiltration calculators (`src/lib/calculators/`).
- Four coordinate-backed pan-India evaluator presets without hardcoded AQI scores (`src/lib/presets.ts`).
- Multi-model Gemini cascade (`gemini-4-hydrogen` -> `gemini-3.8-flash` -> `gemini-3.5-flash-lite` -> `gemini-3.6-flash` -> `gemini-3.1-flash-lite`) with automatic deterministic fallback and safe `fallbackReason` diagnostics (`src/lib/ai/gemini-assistant.ts`).
- **Confirmed Absences**: No user testimonials, commercial pricing, press coverage, or clinical validation studies exist; future work must not invent them.

## Product Principles

1. **Telemetry Before Commentary**: Every guidance claim must trace back to live station/model readings and calculated Stage 2 numbers.
2. **AI Visible, Math Guaranteed**: Keep grounded Gemini intelligence front-and-center on `/assistant` while guaranteeing instant, full-featured deterministic fallback under any API failure.
3. **Actionable Microenvironment Math**: Translate macro city indices into household-controllable levers (timing shifts, transit swaps, N95 fit, window sealing, purifier use, incense elimination).
4. **Radical Provenance Transparency**: Clearly distinguish live CPCB ground stations from CAMS model fallbacks, display IST timestamps, and state safe non-medical limits.

## Accessibility & Inclusion

- **Standard**: WCAG 2.1 AA compliance across all interactive surfaces.
- **Severity Encoding**: Never communicate NAQI severity through color alone; pair contrast-checked colors (`>= 4.5:1`) with explicit category labels, numeric ranges, and semantic icons.
- **Interaction & Devices**: Full keyboard navigation (including WAI-ARIA `tablist` arrow/Home/End support and visible focus states), `aria-live="polite"` status announcements, and overflow-free mobile support down to 375px viewports.
