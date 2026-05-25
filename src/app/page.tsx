"use client";

import { useEffect } from "react";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { ReportView } from "@/components/ReportView";
import { useAnalysis } from "@/hooks/useAnalysis";
import { decodeSharePayload, readShareFromHash } from "@/lib/share-report";

export default function HomePage() {
  const {
    result,
    loading,
    error,
    analyzeFile,
    runDemo,
    loadSharedResult,
    reset,
  } = useAnalysis();

  useEffect(() => {
    const encoded = readShareFromHash();
    if (!encoded) return;
    decodeSharePayload(encoded).then((shared) => {
      if (shared) loadSharedResult(shared);
    });
  }, [loadSharedResult]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-brand-600">
          Personal cancer risk insights
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          PRS Screen
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-600">
          Understand what your DNA data may suggest — in plain language, powered
          by published polygenic scores.{" "}
          <span className="font-medium text-slate-800">
            Educational only, not medical advice.
          </span>
        </p>
      </header>

      <DisclaimerBanner />

      <div className="mt-8">
        {result ? (
          <ReportView result={result} onReset={reset} />
        ) : (
          <OnboardingFlow
            loading={loading}
            error={error}
            onDemo={runDemo}
            onUpload={analyzeFile}
          />
        )}
      </div>
    </main>
  );
}
