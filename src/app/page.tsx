"use client";

import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { ReportView } from "@/components/ReportView";
import { UploadPanel } from "@/components/UploadPanel";
import { useAnalysis } from "@/hooks/useAnalysis";

export default function HomePage() {
  const { result, loading, error, analyzeFile, reset } = useAnalysis();

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-10 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-brand-600">
          Polygenic risk re-interpretation
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          PRS Screen
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
          Turn your 23andMe or AncestryDNA raw file into updated cancer polygenic
          risk scores using published GWAS weights — with plain-language screening
          context from NCCN and USPSTF guidelines.
        </p>
      </header>

      <DisclaimerBanner />

      <div className="mt-8">
        {result ? (
          <ReportView result={result} onReset={reset} />
        ) : (
          <>
            <UploadPanel onAnalyze={analyzeFile} loading={loading} />
            {error && (
              <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {error}
              </p>
            )}
          </>
        )}
      </div>

      <section className="mt-16 grid gap-6 sm:grid-cols-3">
        {[
          {
            title: "Latest GWAS weights",
            body: "Scores from PGS Catalog (breast, colorectal, prostate, ovarian) — not outdated single-SNP reports.",
          },
          {
            title: "Private by design",
            body: "Analysis runs entirely in your browser. No account, no cloud storage of DNA.",
          },
          {
            title: "Clinician-ready context",
            body: "Percentiles plus guideline-linked screening notes to discuss with your doctor.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <h3 className="font-semibold text-slate-900">{item.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{item.body}</p>
          </div>
        ))}
      </section>

      <footer className="mt-12 border-t border-slate-200 pt-8 text-center text-xs text-slate-500">
        <a href="/privacy" className="hover:text-brand-600">
          Privacy
        </a>
        {" · "}
        <a href="/terms" className="hover:text-brand-600">
          Terms
        </a>
        {" · "}
        PGS Catalog · NCCN · USPSTF references for educational context only
      </footer>
    </main>
  );
}
