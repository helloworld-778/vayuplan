"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  AirQualitySnapshot,
  FallbackReason,
  HouseholdProfile,
} from "@/types/air-quality";
import {
  MessageSquare,
  Send,
  Loader2,
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

  const inputRef = useRef<HTMLInputElement>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const messages = controlledMessages ?? internalMessages;
  const updateMessages = onMessagesChange ?? setInternalMessages;

  const city = snapshot.location.name;
  const cleanPersona = profile.persona.replaceAll("_", " ");

  useEffect(() => {
    if (prefillRequest && prefillRequest.seq > 0) {
      setQuestion(prefillRequest.text.slice(0, 400));
      const timer = setTimeout(() => {
        inputRef.current?.focus();
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
      className={`bg-[#FFFFFF] border border-[#CBD5E1] rounded-xl elevation-2 overflow-hidden flex flex-col min-h-[380px] lg:min-h-0 ${className}`}
    >
      {/* Stratospheric Navy Header Anchor */}
      <div className="px-4 py-3.5 bg-[#0F172A] text-[#FFFFFF] flex items-center justify-between gap-2 border-b border-[#1E293B]">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-8 h-8 rounded-lg bg-[#1E293B] border border-[#334155] flex items-center justify-center shrink-0">
            <MessageSquare
              className="w-4 h-4 text-[#93C5FD]"
              aria-hidden="true"
            />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-sm font-semibold tracking-tight text-[#FFFFFF] truncate">
              Ask VayuPlan
            </h2>
            <p className="text-xs text-[#CBD5E1] truncate">
              Grounded AI Copilot
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs font-mono tabular-nums px-2.5 py-1 rounded bg-[#1E293B] border border-[#334155] text-[#E2E8F0]">
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
              className="min-h-[36px] px-2 rounded-lg bg-[#1E293B] hover:bg-[#334155] text-[#E2E8F0] flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-[#93C5FD]"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}

          {onCloseDrawer && (
            <button
              type="button"
              onClick={onCloseDrawer}
              aria-label="Close Ask VayuPlan Copilot"
              className="min-h-[44px] min-w-[44px] rounded-lg bg-[#1E293B] hover:bg-[#334155] text-[#FFFFFF] flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-[#93C5FD]"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Message Stream */}
      <div
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        className="flex-1 p-4 space-y-4 overflow-y-auto overscroll-contain bg-[#FFFFFF]"
      >
        {messages.length === 0 ? (
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-[#F1F4F8] p-3.5">
              <p className="text-xs font-semibold text-[#0F172A]">
                Live Telemetry Advisor Ready
              </p>
              <p className="mt-1 text-xs text-[#334155] leading-relaxed">
                Ask about your schedule, transit exposure, masks, or home ventilation in{" "}
                {city}. Replies cite active CPCB readings and Stage 2 physics—never fabricated numbers.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-[#525E70]">
                Suggested prompts for your context
              </p>
              <div className="grid grid-cols-1 gap-2">
                {starterQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleSubmit(q)}
                    className="p-3 min-h-[44px] text-xs text-[#0F172A] bg-[#F1F4F8] border border-[#DCE3EC] hover:border-[#1D4ED8] hover:bg-[#EFF6FF] rounded-lg transition-colors text-left leading-relaxed"
                  >
                    &ldquo;{q}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${
                m.sender === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[92%] rounded-lg p-3.5 text-sm leading-relaxed break-words ${
                  m.sender === "user"
                    ? "bg-[#0F172A] text-[#FFFFFF]"
                    : "bg-[#F1F4F8] border border-[#DCE3EC] text-[#0F172A]"
                }`}
              >
                {m.sender === "assistant" && (
                  <div className="flex flex-wrap items-center gap-2 mb-2 pb-2 border-b border-[#DCE3EC]">
                    {m.mode === "ai" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1D4ED8]">
                        <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Gemini AI</span>
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#334155]"
                        title={
                          m.fallbackReason
                            ? `Computed via Stage 2 physics (${m.fallbackReason})`
                            : "Computed via Stage 2 microenvironment physics"
                        }
                        data-fallback-reason={m.fallbackReason}
                      >
                        <Cpu className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Deterministic Physics Fallback</span>
                      </span>
                    )}

                    <span className="text-xs font-mono tabular-nums text-[#525E70] ml-auto">
                      {m.timestamp}
                    </span>
                  </div>
                )}

                <div className="space-y-1.5 whitespace-pre-line text-sm leading-relaxed break-words">
                  {m.text}
                </div>

                {m.citedMetrics && m.citedMetrics.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-[#DCE3EC] space-y-1.5">
                    <span className="text-xs font-semibold text-[#525E70] flex items-center gap-1">
                      <Tag className="w-3 h-3" aria-hidden="true" />
                      <span>Cited Live Metrics</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {m.citedMetrics.map((metric, i) => (
                        <span
                          key={i}
                          className="text-xs font-mono tabular-nums px-2 py-0.5 rounded bg-[#FFFFFF] text-[#0F172A] border border-[#DCE3EC]"
                        >
                          {metric}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-[#334155] bg-[#F1F4F8] p-3 rounded-lg w-fit border border-[#DCE3EC]">
            <Loader2
              className="w-3.5 h-3.5 animate-spin text-[#1D4ED8]"
              aria-hidden="true"
            />
            <span>Consulting grounded atmospheric telemetry...</span>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-xs rounded-lg flex items-center justify-between gap-2"
          >
            <span>{error}</span>
            {lastFailedQuestion && (
              <button
                type="button"
                onClick={() =>
                  handleSubmit(lastFailedQuestion, { isRetry: true })
                }
                className="inline-flex items-center gap-1 px-2.5 min-h-[36px] rounded bg-[#FFFFFF] border border-[#FCA5A5] font-semibold text-[#991B1B] shrink-0"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                <span>Retry</span>
              </button>
            )}
          </div>
        )}

        <div ref={threadEndRef} />
      </div>

      {/* Sticky Bottom 400-Char Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(question);
        }}
        className="p-3 border-t border-[#DCE3EC] bg-[#F7F8FA]"
      >
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={question}
            maxLength={400}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask anything about today's air quality, masks, windows..."
            aria-label="Ask VayuPlan a question"
            disabled={isLoading}
            className="flex-1 min-w-0 text-base sm:text-sm px-3.5 min-h-[44px] bg-[#FFFFFF] border border-[#64748B]/70 rounded-lg text-[#0F172A] placeholder:text-[#525E70] focus:border-[#1D4ED8] transition-colors"
          />
          <button
            type="submit"
            disabled={isLoading || !question.trim()}
            aria-label="Send question"
            className="px-4 min-h-[44px] bg-[#1D4ED8] hover:bg-[#1E40AF] text-[#FFFFFF] rounded-lg disabled:opacity-55 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Send className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Ask</span>
          </button>
        </div>

        <div className="flex justify-between items-center text-xs text-[#525E70] mt-1.5 px-1">
          <span>Grounded strictly in live station data</span>
          <span className="font-mono tabular-nums">
            {question.length} / 400
          </span>
        </div>
      </form>
    </div>
  );
}
