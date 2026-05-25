"use client";

import { useEffect, useState } from "react";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { DnaUploadFlow } from "@/components/home/DnaUploadFlow";
import { HomeEntry } from "@/components/home/HomeEntry";
import { ProfileBuilder } from "@/components/home/ProfileBuilder";
import { ResultsPage } from "@/components/ResultsPage";
import { useAnalysis } from "@/hooks/useAnalysis";
import { decodeSharePayload, readShareFromHash } from "@/lib/share-report";

type Screen = "home" | "demo" | "upload" | "profile";

export default function HomePage() {
  const [screen, setScreen] = useState<Screen>("home");
  const {
    result,
    loading,
    error,
    analyzeFile,
    runDemo,
    runProfile,
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

  const goHome = () => {
    reset();
    setScreen("home");
  };

  if (result) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <DisclaimerBanner />
        <ResultsPage result={result} onReset={goHome} />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-8 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-brand-600">
          GeneScope
        </p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">
          Health insights from your genetics
        </h1>
      </header>

      <DisclaimerBanner />

      <div className="mt-8">
        {screen === "home" && (
          <HomeEntry
            loading={loading}
            onDemo={() => {
              setScreen("demo");
              runDemo();
            }}
            onUpload={() => setScreen("upload")}
            onProfile={() => setScreen("profile")}
          />
        )}
        {screen === "upload" && (
          <DnaUploadFlow
            loading={loading}
            error={error}
            onBack={() => setScreen("home")}
            onUpload={analyzeFile}
          />
        )}
        {screen === "profile" && (
          <ProfileBuilder
            loading={loading}
            onBack={() => setScreen("home")}
            onSubmit={runProfile}
          />
        )}
        {screen === "demo" && loading && (
          <div className="rounded-2xl border border-brand-200 bg-brand-50/50 p-12 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
            <p className="mt-4 font-medium text-brand-900">
              Generating your sample report…
            </p>
            <p className="mt-1 text-sm text-slate-600">About 3 seconds</p>
          </div>
        )}
        {screen === "demo" && error && !loading && (
          <p className="text-center text-sm text-rose-700">{error}</p>
        )}
      </div>
    </main>
  );
}
