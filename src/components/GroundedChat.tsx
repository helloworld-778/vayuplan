"use client";

import React, { useState } from "react";
import {
  AirQualitySnapshot,
  HouseholdProfile,
} from "@/types/air-quality";
import {
  MessageSquare,
  Send,
  Loader2,
  Sparkles,
  Cpu,
  HelpCircle,
  Tag,
} from "lucide-react";

interface GroundedChatProps {
  snapshot: AirQualitySnapshot;
  profile: HouseholdProfile;
}

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  mode?: "ai" | "deterministic_fallback";
  citedMetrics?: string[];
  timestamp: string;
}

export function GroundedChat({ snapshot, profile }: GroundedChatProps) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const city = snapshot.location.name;

  // 4 dynamic starter questions tailored to city & persona
  const starterQuestions = [
    `Is it safe for a ${profile.persona.replace("_", " ")} to go outside at 6 PM in ${city}?`,
    `How much PM2.5 does an N95 mask save on my ${profile.commuteDistanceKm} km commute?`,
    `Should I open windows or keep them sealed today in ${city}?`,
    "What common indoor air pollution myth should I avoid?",
  ];

  const handleSubmit = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    setError(null);
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: trimmed,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");
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
        citedMetrics: data.citedMetrics,
        timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setError((err as Error).message || "Chat service error.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#E2DFD6] rounded-lg overflow-hidden shadow-xs flex flex-col min-h-[500px]">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-[#EAE7DF] bg-[#FAF9F6] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <MessageSquare className="w-4 h-4 text-[#14181F]" />
          <div>
            <h3 className="text-sm font-bold text-[#14181F]">
              Ask VayuPlan — Grounded Environmental Advisor
            </h3>
            <p className="text-xs text-[#5E6470]">
              Cites verified Stage 2 telemetry & envelope physics in real-time
            </p>
          </div>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#EFECE6] border border-[#DDD9CE] text-[#474D58]">
          {city} • NAQI {snapshot.naqi}
        </span>
      </div>

      {/* Message History */}
      <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <HelpCircle className="w-8 h-8 text-[#A2A8B5] mx-auto mb-2" />
            <h4 className="text-xs font-bold text-[#14181F] mb-1">
              Ask any specific question about your routine or environment
            </h4>
            <p className="text-xs text-[#6E7582] max-w-sm mx-auto mb-6">
              Answers are strictly grounded in live CPCB/Open-Meteo readings and Stage 2 math — no invented figures.
            </p>

            {/* Starter Questions */}
            <div className="max-w-lg mx-auto grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
              {starterQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleSubmit(q)}
                  className="p-2.5 text-xs text-[#2B303B] bg-[#FAF9F6] border border-[#DDD9CE] hover:border-[#14181F] hover:bg-[#FFFFFF] rounded-md transition-all text-left"
                >
                  &ldquo;{q}&rdquo;
                </button>
              ))}
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
                className={`max-w-xl rounded-lg p-3.5 text-xs leading-relaxed ${
                  m.sender === "user"
                    ? "bg-[#14181F] text-[#FFFFFF]"
                    : "bg-[#FAF9F6] border border-[#DDD9CE] text-[#14181F]"
                }`}
              >
                {/* Assistant Mode Badge */}
                {m.sender === "assistant" && (
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#EAE7DF]">
                    {m.mode === "ai" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#1B4F72]">
                        <Sparkles className="w-3 h-3 text-[#2980B9]" />
                        Gemini 2.5 Flash
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#2C3E50]">
                        <Cpu className="w-3 h-3 text-[#34495E]" />
                        Deterministic Fallback
                      </span>
                    )}
                    <span className="text-[10px] text-[#7A8290] ml-auto">
                      {m.timestamp}
                    </span>
                  </div>
                )}

                <p>{m.text}</p>

                {/* Cited Metrics Tags */}
                {m.citedMetrics && m.citedMetrics.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-[#EAE7DF] space-y-1">
                    <span className="text-[10px] font-mono font-bold text-[#6E7582] uppercase flex items-center gap-1">
                      <Tag className="w-2.5 h-2.5" />
                      Cited Live Metrics:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {m.citedMetrics.map((metric, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#EFECE6] text-[#2B303B] border border-[#DDD9CE]"
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
          <div className="flex items-center gap-2 text-xs text-[#6E7582] bg-[#FAF9F6] p-3 rounded-md w-fit border border-[#DDD9CE]">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#14181F]" />
            <span>Consulting grounded atmospheric models...</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 text-xs rounded-md">
            {error}
          </div>
        )}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(question);
        }}
        className="p-3 border-t border-[#EAE7DF] bg-[#FAF8F5]"
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={question}
            maxLength={400}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask anything about today's air quality, masks, windows, or safe hours..."
            aria-label="Ask VayuPlan a question"
            disabled={isLoading}
            className="flex-1 text-xs px-3.5 py-2.5 bg-[#FFFFFF] border border-[#DDD9CE] rounded-md text-[#14181F] placeholder:text-[#8C93A0] focus:outline-none focus:border-[#14181F]"
          />
          <button
            type="submit"
            disabled={isLoading || !question.trim()}
            aria-label="Send question"
            className="px-4 py-2.5 bg-[#14181F] text-[#FFFFFF] rounded-md hover:bg-[#2B303B] active:bg-[#000000] disabled:opacity-50 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ask</span>
          </button>
        </div>

        <div className="flex justify-between items-center text-[10px] text-[#7A8290] mt-1.5 px-1 font-mono">
          <span>Grounded strictly in active city telemetry</span>
          <span>{question.length} / 400</span>
        </div>
      </form>
    </div>
  );
}
