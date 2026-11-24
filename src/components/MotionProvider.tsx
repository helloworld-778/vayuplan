"use client";

import React from "react";
import { MotionConfig } from "framer-motion";

interface MotionProviderProps {
  children: React.ReactNode;
}

/**
 * Global Framer Motion wrapper strictly honoring user reduced-motion preferences.
 */
export function MotionProvider({ children }: MotionProviderProps) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
