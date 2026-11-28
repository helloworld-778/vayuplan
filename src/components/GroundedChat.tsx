"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AirQualitySnapshot,
  FallbackReason,
  HouseholdProfile,
} from "@/types/air-quality";
import {
  Send,
  Sparkles,
  Cpu,
  Tag,
  X,
  RotateCcw,
  Trash2,
} from "lucide-react";

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  mode?: "ai" | "deterministic_fallback";
  fallbackReason?: FallbackReason;
  citedMetrics?: string[];
  timestamp: string;
}

interface GroundedChatProps {
  snapshot: AirQualitySnapshot;
  profile: HouseholdProfile;
  messages?: ChatMessage[];
  onMessagesChange?: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  prefillRequest?: { text: string; seq: number } | null;
  onCloseDrawer?: () => void;
  className?: string;
}

function TypingDotsIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2.5 text-xs text-ink-secondary py-2"
    >
      <span className="inline-flex items-center gap-1" aria-hidden="true">
        {[0, 1, 2].map((idx) => (
          <motion.span
            key={idx}
            animate={{ y: [0, -3, 0], opacity: [0.45, 1, 0.45] }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              delay: idx * 0.16,
              ease: "easeInOut",
            }}
            className="w-1.5 h-1.5 rounded-full bg-accent"
          />
        ))}
      </span>
      <span>Consulting grounded atmospheric telemetry...</span>
    </motion.div>
  );
}

export function GroundedChat({
  snapshot,
  profile,
  messages: controlledMessages,
  onMessagesChange,
  prefillRequest = null,
  onCloseDrawer,
  className = "",
}: GroundedChatProps) {
  const [question, setQuestion] = useState("");
  const [internalMessages, setInternalMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedQuestion, setLastFailedQuestion] = useState<string | null>(
    null
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const messages = controlledMessages ?? internalMessages;
  const updateMessages = onMessagesChange ?? setInternalMessages;

  const city = snapshot.location.name;
  const cleanPersona = profile.persona.replaceAll("_", " ");

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(120, Math.max(44, el.scrollHeight))}px`;
  }, [question]);

  useEffect(() => {
    if (prefillRequest && prefillRequest.seq > 0) {
      setQuestion(prefillRequest.text.slice(0, 400));
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [prefillRequest]);

  useEffect(() => {
    if (
      messages.length > 0 &&
      typeof threadEndRef.current?.scrollIntoView === "function"
    ) {
      const prefersReduced =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      threadEndRef.current.scrollIntoView({
        behavior: prefersReduced ? "auto" : "smooth",
        block: "nearest",
      });
    }
  }, [messages.length]);

  const starterQuestions = [
    `Is it safe for a ${cleanPersona} to go outside at 6 PM in ${city}?`,
    `How much PM2.5 does an N95 mask save on my ${profile.commuteDistanceKm} km commute?`,
    `Should I open windows or keep them sealed today in ${city}?`,
    "What common indoor air pollution myth should I avoid?",
  ];

  const handleSubmit = async (
    textToSend: string,
    opts?: { isRetry?: boolean }
  ) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    setError(null);
    setLastFailedQuestion(null);

    if (!opts?.isRetry) {
      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        sender: "user",
        text: trimmed,
        timestamp: new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      updateMessages((prev) => [...prev, userMsg]);
      setQuestion("");
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: trimmed,
          snapshot,
          profile,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to receive answer.");
      }

      const data = await res.json();
      const botMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: "assistant",
        text: data.answer,
        mode: data.mode,
        fallbackReason: data.fallbackReason,
        citedMetrics: data.citedMetrics,
        timestamp: new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      updateMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setError((err as Error).message || "Chat service error.");
      setLastFailedQuestion(trimmed);
      if (!opts?.isRetry && !question.trim()) {
        setQuestion(trimmed);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`bg-surface border border-subtle rounded-xl elevation-2 overflow-hidden flex flex-col min-h-[380px] lg:min-h-0 ${className}`}
    >
      {/* Quiet Frameless Editorial Copilot Header */}
      <div className="px-5 py-3.5 bg-surface border-b border-subtle flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <Sparkles className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <h2 className="font-display text-base font-semibold tracking-tight text-ink truncate">
              Ask VayuPlan
            </h2>
            <p className="text-xs text-ink-muted truncate">
              Grounded AI Copilot
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs font-mono tabular-nums px-2.5 py-1 rounded-md bg-subtle border border-subtle text-ink-secondary">
            {city} · NAQI {snapshot.naqi}
          </span>

          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => {
                updateMessages([]);
                setError(null);
                setLastFailedQuestion(null);
              }}
              aria-label="Clear chat conversation"
              title="Clear chat"
              className="min-h-[44px] min-w-[44px] px-2.5 rounded-lg border border-control bg-surface hover:border-accent text-ink-secondary hover:text-ink flex items-center justify-center transition-colors"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>
          )}

          {onCloseDrawer && (
            <button
              type="button"
              onClick={onCloseDrawer}
              aria-label="Close Ask VayuPlan Copilot"
              className="min-h-[44px] min-w-[44px] rounded-lg border border-control bg-surface hover:border-obsidian text-ink flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Frameless Canvas Stream */}
      <div className="flex-1 p-5 space-y-5 overflow-y-auto overscroll-contain bg-surface">
        {messages.length === 0 ? (
          <div className="space-y-5 py-1">
            <div>
              <p className="text-sm font-semibold text-ink">
                Live Telemetry Advisor Ready
              </p>
              <p className="mt-1.5 text-xs text-ink-secondary leading-relaxed">
                Ask about your schedule, transit exposure, masks, or home ventilation in{" "}
                {city}. Answers cite live CPCB telemetry and microenvironment math directly.
              </p>
            </div>

            <div className="space-y-2.5">
              <p className="text-xs font-medium text-ink-muted">
                Suggested prompts for your context
              </p>
              <div className="grid grid-cols-1 gap-2">
                {starterQuestions.map((q, idx) => (
                  <motion.button
                    whileTap={{ scale: 0.99 }}
                    key={idx}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleSubmit(q)}
                    className="p-3.5 min-h-[44px] text-xs text-ink bg-canvas border border-subtle hover:border-accent hover:bg-accent-wash rounded-lg transition-colors text-left leading-relaxed"
                  >
                    &ldquo;{q}&rdquo;
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            className="space-y-5"
          >
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className={`flex flex-col ${
                    m.sender === "user" ? "items-end" : "items-start"
                  }`}
                >
                  {m.sender === "user" ? (
                    <div className="max-w-[88%] rounded-2xl rounded-br-sm bg-obsidian text-ink-on-dark px-4 py-2.5 text-sm leading-relaxed break-words">
                      {m.text}
                    </div>
                  ) : (
                    <article className="w-full pb-5 border-b border-subtle last:border-b-0 space-y-2.5 text-ink">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {m.mode === "ai" ? (
                          <span className="inline-flex items-center gap-1.5 font-semibold text-accent">
                            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Gemini AI</span>
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1.5 font-semibold text-ink-secondary"
                            title={
                              m.fallbackReason
                                ? `Computed via Stage 2 physics (${m.fallbackReason})`
                                : "Computed via Stage 2 microenvironment physics"
                            }
                            data-fallback-reason={m.fallbackReason}
                          >
                            <Cpu className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Deterministic Physics Fallback</span>
                            <span className="sr-only">
                              {" "}
                              — Rule-based backup answer while live Gemini AI is unavailable.
                            </span>
                          </span>
                        )}

                        <span className="text-xs font-mono tabular-nums text-ink-muted ml-auto">
                          {m.timestamp}
                        </span>
                      </div>

                      <div className="space-y-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-secondary break-words">
                        {m.text}
                      </div>

                      {m.citedMetrics && m.citedMetrics.length > 0 && (
                        <div className="pt-2 space-y-1.5">
                          <span className="text-xs font-semibold text-ink-muted flex items-center gap-1">
                            <Tag className="w-3 h-3" aria-hidden="true" />
                            <span>Cited Live Metrics</span>
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {m.citedMetrics.map((metric, i) => (
                              <span
                                key={i}
                                className="text-xs font-mono tabular-nums px-2 py-0.5 rounded bg-subtle text-ink border border-subtle"
                              >
                                {metric}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </article>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {isLoading && <TypingDotsIndicator />}

        {error && (
          <div
            role="alert"
            className="p-3 bg-danger-surface border border-danger text-danger text-xs rounded-lg flex items-center justify-between gap-2"
          >
            <span>{error}</span>
            {lastFailedQuestion && (
              <button
                type="button"
                onClick={() =>
                  handleSubmit(lastFailedQuestion, { isRetry: true })
                }
                className="inline-flex items-center gap-1 px-3 min-h-[44px] rounded-lg bg-surface border border-danger font-semibold text-danger shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Retry</span>
              </button>
            )}
          </div>
        )}

        <div ref={threadEndRef} />
      </div>

      {/* Auto-Expanding Textarea Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(question);
        }}
        className="p-3.5 border-t border-subtle bg-canvas"
      >
        <div className="flex items-end gap-2 bg-surface border border-control focus-within:border-accent rounded-xl p-1.5 transition-colors">
          <textarea
            ref={textareaRef}
            rows={1}
            value={question}
            maxLength={400}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(question);
              }
            }}
            placeholder="Ask anything about today's air quality, masks, windows..."
            aria-label="Ask VayuPlan a question"
            disabled={isLoading}
            className="flex-1 min-w-0 resize-none text-base sm:text-sm px-2.5 py-2.5 min-h-[44px] max-h-[120px] bg-transparent text-ink placeholder:text-ink-muted focus:outline-none leading-snug"
          />
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading || !question.trim()}
            aria-label="Send question"
            className="px-4 min-h-[44px] bg-accent hover:bg-accent-hover text-white rounded-lg disabled:opacity-55 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Send className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Ask</span>
          </motion.button>
        </div>

        <div className="flex justify-between items-center text-xs text-ink-muted mt-1.5 px-1">
          <span>Enter to send · Shift+Enter for new line</span>
          <span className="font-mono tabular-nums">
            {question.length} / 400
          </span>
        </div>
      </form>
    </div>
  );
}
