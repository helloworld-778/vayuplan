"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface MechanismDisclosureProps {
  explanation: string;
  label?: string;
}

/**
 * Shared progressive-disclosure accordion hiding longer scientific mechanism notes by default.
 */
export function MechanismDisclosure({
  explanation,
  label = "Why this works",
}: MechanismDisclosureProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!explanation.trim()) return null;

  return (
    <div className="pt-2 border-t border-[#DCE3EC]">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#334155] hover:text-[#1D4ED8] min-h-[36px] py-1 transition-colors"
      >
        <span>{label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#1D4ED8]" : "text-[#525E70]"
          }`}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="pt-1.5 pb-1 text-xs text-[#334155] leading-relaxed">
              {explanation}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
