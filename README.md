# VayuPlan — Pan-India Urban Air Quality & Low-Emission Assistant

> **Google Prompt Wars Challenge 6**  
> An evidence-grounded civic instrument for Indian cities that transforms real-time atmospheric telemetry into actionable exposure-reduction routines, modal shift recommendations, and building envelope directives.

[![CI](https://github.com/vayuplan/vayuplan/actions/workflows/ci.yml/badge.svg)](https://github.com/vayuplan/vayuplan/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8_Strict-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.4_Turbopack-black.svg)](https://nextjs.org/)
[![Tests](https://img.shields.io/badge/Tests-119_Passed-brightgreen.svg)](https://vitest.dev/)
[![A11y](https://img.shields.io/badge/WCAG-AA_Compliant-success.svg)](https://www.w3.org/WAI/WCAG21/quickref/)

---

## 1. Problem Statement & Core Pillars

Indian urban centers face distinct atmospheric dynamics: seasonal winter thermal inversions trap surface particulate mass, high ambient dust loads elevate PM10, and high-density mixed traffic creates severe localized roadside plumes. Generic air quality apps display abstract numbers without contextualizing biological mechanisms or actionable interventions.

VayuPlan addresses this challenge across **three core pillars**:

1. **Daily Routine & Diurnal Exposure Optimization**: Analyzes 24–36 hour forecast curves to schedule daily activities around the cleanest solar boundary-layer windows (typically early afternoon) while strictly avoiding nocturnal and morning inversion peaks.
2. **Low-Emission Commute Optimization**: Quantifies personal inhaled PM2.5 dose (µg) alongside carbon footprints across 6 Indian transit modes, recommending modal shifts and demonstrating the protection delta of N95 respirators over cloth masks.
3. **Indoor Action Lab & Building Physics**: Estimates residential microenvironment infiltration based on window states (open, cracked, sealed), air purifier Clean Air Delivery Rate (CADR), and internal emission penalties (incense/agarbatti/cooking).

---

## 2. System Architecture

VayuPlan enforces a zero-trust client boundary: all API keys and external queries remain strictly server-side.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CLIENT (Browser / Mobile)                         │
│  - Warm Alabaster Daylight Theme (#F7F6F2) • JetBrains Mono Tabular Numerals│
│  - WCAG AA CPCB Severity Encoding • Zero-Dependency Accessible SVG Curves   │
│  - Debounced Indian Geocoding & HTML5 GPS Geolocation                       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTPS (JSON API)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    NEXT.JS 16 APP ROUTER (Server-Side Engine)               │
│                                                                             │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌──────────────────┐ │
│  │ In-Memory TTL Cache   │  │ Sliding Window        │  │ Input Sanitizer  │ │
│  │ (Bounded LRU Evict)   │  │ Rate Limiter (IP)     │  │ & Security Envs  │ │
│  └───────────────────────┘  └───────────────────────┘  └──────────────────┘ │
│                                      │                                      │
│        ┌─────────────────────────────┴─────────────────────────────┐        │
│        ▼                                                           ▼        │
│  ┌───────────────────────────────┐           ┌───────────────────────────┐  │
│  │ Atmospheric Telemetry Client  │           │ Grounded AI Engine        │  │
│  │  - Open-Meteo CAMS Forecast   │           │  - Gemini AI Orchestration│  │
│  │  - WAQI Ground Station Cache  │           │  - Structured Zod Schema  │  │
│  └───────────────┬───────────────┘           │  - Instant Math Fallback  │  │
│                  │                           └─────────────┬─────────────┘  │
│                  ▼                                         │                │
│  ┌─────────────────────────────────────────────────────────┴─────────────┐  │
│  │                STAGE 2 DETERMINISTIC ENVIRONMENTAL PHYSICS            │  │
│  │  • Official Indian CPCB NAQI Multi-Pollutant Linear Interpolation     │  │
│  │  • US EPA Sub-Index to Raw Concentration Inverse Interpolation        │  │
│  │  • Commute Inhaled Mass Balance: Dose = C_eff * VentRate * Duration   │  │
│  │  • Indoor Envelope Infiltration: C_in = (C_out * P_inf + S) * (1 - η) │  │
│  │  • Diurnal Daypart & 2-Hour Rolling Ventilation Optimizer             │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Scientific & Mathematical Methodology

### 3.1 Official Indian CPCB NAQI Interpolation
The Central Pollution Control Board (CPCB) calculates the National Air Quality Index (NAQI) using linear segmented interpolation across breakpoints:

$$I_p = \frac{I_{\text{Hi}} - I_{\text{Lo}}}{\text{BP}_{\text{Hi}} - \text{BP}_{\text{Lo}}} \cdot (C_p - \text{BP}_{\text{Lo}}) + I_{\text{Lo}}$$

- **Breakpoints**: PM2.5, PM10, NO₂, O₃, CO, and SO₂ breakpoints strictly follow CPCB standards.
- **CO Conversion**: Carbon monoxide concentrations in $\mu\text{g/m}^3$ are converted to $\text{mg/m}^3$ ($C_{\text{CO}} / 1000$) before applying breakpoints.
- **Aggregated Index**: The final NAQI is the maximum sub-index across all pollutants, provided CPCB minimum reporting criteria ($\ge 3$ pollutants including at least PM2.5 or PM10) are met.

### 3.2 US EPA to Raw Concentration Inversion (WAQI)
World Air Quality Index (WAQI) stations often report US EPA sub-indices rather than raw concentration. VayuPlan implements inverse piecewise linear interpolation to reconstruct raw $\mu\text{g/m}^3$ before calculating Indian CPCB NAQI scores.

### 3.3 Commute Inhaled Particulate Dose
Inhaled PM2.5 mass ($\mu\text{g}$) per round-trip is calculated based on transport microenvironments:

$$\text{Dose} = C_{\text{ambient}} \cdot F_{\text{cabin}} \cdot \text{VentRate} \cdot T_{\text{commute}} \cdot P_{\text{mask}}$$

| Commute Mode | Cabin Factor ($F_{\text{cabin}}$) | Vent Rate ($\text{m}^3\text{/hr}$) | Speed (km/h) |
| :--- | :--- | :--- | :--- |
| **Solo Car** | 0.50 (closed windows / recirc) | 0.72 | 24 |
| **Two-Wheeler** | 1.00 (direct exhaust plume) | 1.08 | 30 |
| **Metro Rail** | 0.35 (filtered underground/coach) | 0.78 | 33 |
| **Carpool** | 0.50 (shared vehicle cabin) | 0.72 | 24 |
| **Bicycle / Walk** | 1.00 (ambient street air) | 1.80 (elevated cardio) | 15 |
| **Remote (WFH)** | 0.00 (zero street transit) | 0.60 | 0 |

### 3.4 Indoor Envelope Infiltration & Microenvironment Mass Balance
Steady-state indoor PM2.5 concentration is modeled using building physics:

$$C_{\text{in}} = \left( C_{\text{out}} \cdot P_{\text{inf}} + S_{\text{internal}} \right) \cdot (1 - \eta_{\text{purifier}})$$

- **Infiltration Factor ($P_{\text{inf}}$)**: Sealed windows ($0.35$), cracked windows ($0.60$), open windows ($0.85$).
- **Internal Emissions ($S_{\text{internal}}$)**: Baseline metabolic load ($10\,\mu\text{g/m}^3$) + Incense/dhoop/agarbatti penalty ($+45\,\mu\text{g/m}^3$).
- **Purifier Efficiency ($\eta_{\text{purifier}}$)**: In sealed room ($65\%$), in cracked room ($35\%$), in open room ($10\%$).

---

## 4. Evaluator Quick-Test Guide (4 Live Presets)

The application includes a prominent one-click preset strip for testing diverse geographic, meteorological, and lifestyle profiles across India:

| Preset | Location | Persona | Profile Highlights | Testing Goal |
| :--- | :--- | :--- | :--- | :--- |
| **Delhi Corporate Commuter** | New Delhi | Commuter | 14 km petrol car, cracked windows, surgical mask | High traffic winter smog, arterial road emissions |
| **Mumbai Coastal Family** | Mumbai | Family with Kids | 8 km carpool, coastal humidity, active prayer incense | Indoor vs outdoor balance, agarbatti penalty |
| **Kolkata Homebound Senior** | Kolkata | Senior Citizen | 0 km (WFH), high respiratory sensitivity, open windows | Industrial particulate infiltration, cardiac safety |
| **Bengaluru Student Athlete** | Bengaluru | Student Athlete | 10 km two-wheeler scooter, cloth mask | Heavy physical ventilation, direct roadway exposure |

---

## 5. Security & Engineering Highlights

- **Zero Client-Side Secrets**: All Gemini API keys, WAQI tokens, and geocoding credentials reside exclusively server-side. Bundle audits guarantee zero exposure to `process.env`.
- **Content Security Policy (CSP)**: Hardened headers with `default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, and `Strict-Transport-Security: max-age=63072000; includeSubDomains`.
- **In-Memory Caching & Rate Limiting**: 15-minute TTL caching on air quality telemetry, 1-hour caching on geocoding queries, and IP-based sliding-window rate limiters across `/api/*`.
- **Race Condition Protection**: All client queries use `AbortController` cancellation to eliminate race conditions during rapid city or preset switching.
- **Accessibility & Contrast**: Built with WAI-ARIA `tablist` semantics, keyboard arrow navigation (`ArrowRight`, `ArrowLeft`, `Home`, `End`), screen reader announcements (`aria-live="polite"`), and WCAG AA contrast compliance across all 6 CPCB NAQI severity badges.
- **Zero-Dependency Visualizations**: Interactive exposure curves render via pure SVG without external charting library bloat, ensuring ultra-fast load times.

---

## 6. Local Development & Setup

### Prerequisites
- Node.js 20 or 22
- npm 10+

### Setup Instructions
1. Clone the repository:
   ```bash
   git clone https://github.com/vayuplan/vayuplan.git
   cd vayuplan
   ```

2. Install dependencies:
   ```bash
   npm ci
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Add your Gemini API key and optional WAQI token in `.env.local`:
   ```ini
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-2.5-flash
   WAQI_API_TOKEN=your_optional_waqi_token_here
   ```
   *(Note: If no API key is provided, VayuPlan automatically operates in Deterministic Physics Fallback mode without crashing).*

4. Run the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 7. Quality & Verification Suite

VayuPlan enforces rigorous quality standards across four verification gates:

```bash
# 1. TypeScript Strict Verification (zero errors)
npm run typecheck

# 2. ESLint Code Quality (zero errors, zero warnings)
npm run lint

# 3. Vitest Unit & Accessibility Suite (119 passing tests)
npm test

# 4. Turbopack Production Compilation
npm run build
```

---

## 8. License

This project is licensed under the Apache 2.0 License.
