"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/lib/types";
import { downloadReportPdf } from "@/lib/export-pdf";
import { ReportInterpreter } from "./ReportInterpreter";
import { CancerInsightCard } from "./report/CancerInsightCard";
import { OverallRiskBar } from "./report/OverallRiskBar";
import { MethodologySection } from "./report/MethodologySection";
import { ShareReportButton } from "./report/ShareReportButton";
import { AncestryConfidenceMeter } from "./report/AncestryConfidenceMeter";
import { ScreeningTimeline } from "./report/ScreeningTimeline";
import { PathogenicAlert } from "./report/PathogenicAlert";

interface ResultsPageProps {
  result: AnalysisResult;
  onReset: () => void;
}

export function ResultsPage({ result, onReset }: ResultsPageProps) {
  const [pdfLoading, setPdfLoading] = useState(false);

  const modeLabel =
    result.mode === "demo"
      ? "Demo report"
      : result.mode === "profile"
        ? "Profile-based estimate"
        : result.mode === "shared"
          ? "Shared report"
          : "DNA-based insights";

  return (
    <div className="space-y-10" id="genescreen-report">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-brand-600">{modeLabel}</p>
          <h1 className="text-2xl font-bold text-slate-900">Your risk insights</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pdfLoading}
            onClick={async () => {
              setPdfLoading(true);
              try {
                await downloadReportPdf(result);
              } finally {
                setPdfLoading(false);
              }
            }}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white"
          >
            {pdfLoading ? "PDF…" : "Download PDF"}
          </button>
          <ShareReportButton result={result} />
          <button
            type="button"
            onClick={onReset}
            className="rounded-lg border px-4 py-2 text-sm"
          >
            Home
          </button>
        </div>
      </div>

      {result.pathogenicScreen && (
        <PathogenicAlert screen={result.pathogenicScreen} />
      )}

      {result.populationDisclaimer && (
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          <strong>Important:</strong> {result.populationDisclaimer}
        </div>
      )}

      {result.reports.length > 0 && (
        <>
      <OverallRiskBar
        overall={result.overallRisk}
        precisionLevel={result.precisionLevel}
      />

      <section>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Section 2 · Cancer breakdown
        </p>
        <h2 className="mt-2 text-xl font-bold text-slate-900">By cancer type</h2>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          {result.reports.map((report) => (
            <CancerInsightCard key={report.cancerType} report={report} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Section 3 · Context
        </p>
        <h2 className="mt-2 text-xl font-bold text-slate-900">
          How to interpret this report
        </h2>

        {result.familyHistorySummary && result.familyHistorySummary.length > 0 && (
          <div className="mt-4 rounded-lg bg-violet-50 p-4">
            <p className="text-sm font-semibold text-violet-900">Family history</p>
            <ul className="mt-2 list-disc pl-5 text-sm text-violet-950">
              {result.familyHistorySummary.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {result.reports.slice(0, 2).map((r) => (
            <AncestryConfidenceMeter key={r.cancerType} confidence={r.ancestryConfidence} />
          ))}
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-800">Limitations</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
            {result.reports[0]?.limitations.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
            <li>Educational genetic information — not medical guidance.</li>
          </ul>
        </div>

        {result.reports[0] && (
          <div className="mt-6">
            <ScreeningTimeline items={result.reports[0].timeline} />
          </div>
        )}
      </section>

      <ReportInterpreter result={result} />
        </>
      )}

      <MethodologySection precisionLevel={result.precisionLevel} />

      <footer className="text-xs text-slate-500">{result.globalDisclaimer}</footer>
    </div>
  );
}
