"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/lib/types";

interface ReportInterpreterProps {
  result: AnalysisResult;
}

export function ReportInterpreter({ result }: ReportInterpreterProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filtered, setFiltered] = useState(false);
  const [question, setQuestion] = useState("");

  const suggestedQuestions = [
    "What does my percentile mean?",
    "How is this different from 23andMe?",
    "Why might ancestry affect my score?",
    "What can't a PRS tell me?",
  ];

  const fetchExplanation = async (followUp?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          result,
          question: followUp || undefined,
        }),
      });
      const data = (await res.json()) as {
        explanation?: string;
        error?: string;
        filtered?: boolean;
        disclaimer?: string;
      };

      if (!res.ok) {
        throw new Error(data.error ?? "Interpretation unavailable");
      }

      setExplanation(data.explanation ?? "");
      setFiltered(Boolean(data.filtered));
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not load explanation. This feature requires a hosted server with OPENAI_API_KEY (not available in static/mobile-only builds).",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Ask about your results{" "}
            <span className="font-normal text-slate-500">(optional)</span>
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Conversational, educational only — grounded in your computed insights,
            not medical advice.
          </p>
        </div>
        <span className="shrink-0 text-sm text-brand-600">
          {expanded ? "Hide" : "Learn more"}
        </span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <p className="font-medium">Before you continue</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
              <li>
                This uses an AI model to explain PRS concepts in plain language.
              </li>
              <li>
                Only summary statistics are sent — never your raw genotype file.
              </li>
              <li>
                It will not tell you what tests to get or what to do medically.
              </li>
              <li>Always discuss decisions with a licensed clinician.</li>
            </ul>
            <label className="mt-3 flex items-start gap-2 text-xs">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
              />
              I understand this is informational only, not medical advice.
            </label>
          </div>

          {!explanation && (
            <button
              type="button"
              disabled={!acknowledged || loading}
              onClick={() => fetchExplanation()}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Thinking…" : "Start conversation"}
            </button>
          )}

          {!explanation && acknowledged && (
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={loading}
                  onClick={() => fetchExplanation(q)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 hover:border-brand-300"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {error && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
              {error.includes("OPENAI") && (
                <span className="mt-2 block text-xs">
                  Add <code className="text-xs">OPENAI_API_KEY</code> to{" "}
                  <code className="text-xs">.env.local</code> and run{" "}
                  <code className="text-xs">npm run dev</code>.
                </span>
              )}
            </p>
          )}

          {explanation && (
            <div className="space-y-4">
              <div className="prose prose-sm max-w-none text-slate-700">
                {explanation.split("\n").map((para, i) =>
                  para.trim() ? (
                    <p key={i} className="mb-2 whitespace-pre-wrap">
                      {para}
                    </p>
                  ) : null,
                )}
              </div>
              {filtered && (
                <p className="text-xs text-amber-700">
                  Some phrasing was adjusted to keep this section informational
                  only.
                </p>
              )}
              <p className="text-xs text-slate-500">
                AI-generated educational text. Not a diagnosis. Not screening
                guidance. Discuss with your healthcare provider.
              </p>

              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setQuestion(q);
                      fetchExplanation(q);
                    }}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs hover:bg-slate-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  placeholder="Or type your own question…"
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  maxLength={500}
                />
                <button
                  type="button"
                  disabled={!acknowledged || loading || !question.trim()}
                  onClick={() => fetchExplanation(question.trim())}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                >
                  {loading ? "…" : "Ask"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
