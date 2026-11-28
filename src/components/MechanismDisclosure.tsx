"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface MechanismDisclosureProps {
  explanation: string;
  label?: string;
}

/**
 * Zero-reflow CSS Grid accordion hiding longer scientific mechanism notes by default.
 */
export function MechanismDisclosure({
  explanation,
  label = "Why this works",
}: MechanismDisclosureProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!explanation.trim()) return null;

  return (
    <div className="pt-2 border-t border-subtle">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-secondary hover:text-accent min-h-[44px] py-1.5 transition-colors"
      >
        <span>{label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-accent" : "text-ink-muted"
          }`}
          aria-hidden="true"
        />
      </button>

      <div
        data-open={isOpen ? "true" : "false"}
        aria-hidden={!isOpen}
        inert={!isOpen || undefined}
        className="disclosure-grid"
      >
        <div className="disclosure-grid-inner">
          <p className="pt-1 pb-2 text-xs text-ink-secondary leading-relaxed">
            {explanation}
          </p>
        </div>
      </div>
    </div>
  );
}
