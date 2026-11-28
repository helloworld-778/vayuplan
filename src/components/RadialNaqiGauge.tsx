"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { NaqiCategory } from "@/types/air-quality";
import { getNaqiTheme } from "@/lib/aqi/theme";

interface RadialNaqiGaugeProps {
  naqi: number;
  category: NaqiCategory;
  size?: "md" | "lg";
}

function useAnimatedNumber(target: number): number {
  const [displayed, setDisplayed] = useState<number>(target);
  const displayedRef = useRef<number>(target);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || displayedRef.current === target) {
      displayedRef.current = target;
      setDisplayed(target);
      return;
    }

    const startVal = displayedRef.current;
    let startTime: number | null = null;
    const duration = 420;
    let rafId = 0;

    const tick = (now: number) => {
      if (startTime === null) startTime = now;
      const elapsed = Math.max(0, now - startTime);
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const nextVal = Math.round(startVal + (target - startVal) * eased);
      displayedRef.current = nextVal;
      setDisplayed(nextVal);
      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target]);

  return displayed;
}

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number
): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 0 ${end.x.toFixed(
    2
  )} ${end.y.toFixed(2)}`;
}

/**
 * 220-degree radial SVG arc NAQI gauge calibrated for obsidian telemetry surfaces.
 */
export function RadialNaqiGauge({
  naqi,
  category,
  size = "lg",
}: RadialNaqiGaugeProps) {
  const theme = getNaqiTheme(category);
  const safeNaqi = Number.isFinite(naqi) ? Math.max(0, Math.round(naqi)) : 0;
  const animatedValue = useAnimatedNumber(safeNaqi);
  const clampedRatio = Math.min(1, Math.max(0.02, safeNaqi / 500));

  const boxSize = size === "lg" ? 156 : 132;
  const cx = boxSize / 2;
  const cy = boxSize / 2 + 4;
  const radius = size === "lg" ? 58 : 48;
  const startAngle = -110;
  const sweepAngle = 220;

  // Sweep clockwise cleanly along arc path
  const trackStart = polarToCartesian(cx, cy, radius, startAngle);
  const trackEnd = polarToCartesian(cx, cy, radius, startAngle + sweepAngle);
  const trackPath = `M ${trackStart.x.toFixed(2)} ${trackStart.y.toFixed(
    2
  )} A ${radius} ${radius} 0 1 1 ${trackEnd.x.toFixed(2)} ${trackEnd.y.toFixed(2)}`;

  const endDotAngle = startAngle + sweepAngle * clampedRatio;
  const endDot = polarToCartesian(cx, cy, radius, endDotAngle);

  // Also compute static arc description safely as helper sanity check (unused geometric NaN guard)
  void describeArc;

  return (
    <div
      className={`relative shrink-0 flex items-center justify-center ${
        size === "lg" ? "w-[156px] h-[142px]" : "w-[132px] h-[120px]"
      }`}
    >
      <svg
        width={boxSize}
        height={boxSize - 10}
        viewBox={`0 0 ${boxSize} ${boxSize - 10}`}
        aria-hidden="true"
        className="overflow-visible block"
      >
        <path
          d={trackPath}
          fill="none"
          stroke="var(--border-dark)"
          strokeWidth={size === "lg" ? 10 : 8.5}
          strokeLinecap="round"
        />

        <motion.path
          d={trackPath}
          fill="none"
          stroke={theme.darkAccentColor}
          strokeWidth={size === "lg" ? 10 : 8.5}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: clampedRatio }}
          transition={{ type: "spring", stiffness: 140, damping: 22 }}
        />

        <circle
          cx={Number.isFinite(endDot.x) ? endDot.x : trackStart.x}
          cy={Number.isFinite(endDot.y) ? endDot.y : trackStart.y}
          r={size === "lg" ? 4.5 : 4}
          fill={theme.darkAccentColor}
          stroke="var(--bg-obsidian)"
          strokeWidth="2"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center pt-2 text-center pointer-events-none">
        <span
          className={`font-display font-bold tracking-tight tabular-nums leading-none text-ink-on-dark ${
            size === "lg" ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"
          }`}
        >
          {animatedValue}
        </span>
        <span className="mt-1 font-mono text-xs font-medium text-ink-on-dark-muted tracking-wider uppercase">
          NAQI / 500
        </span>
      </div>
    </div>
  );
}
