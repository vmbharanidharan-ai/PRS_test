"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/lib/types";
import { downloadReportPdf } from "@/lib/export-pdf";
import { ReportInterpreter } from "./ReportInterpreter";
import { ClinicianResearchSummary } from "./report/ClinicianResearchSummary";
import { MethodologySection } from "./report/MethodologySection";
import { ShareReportButton } from "./report/ShareReportButton";

interface ResultsPageProps {
  result: AnalysisResult;
  onReset: () => void;
}

export function ResultsPage({ result, onReset }: ResultsPageProps) {
  const [pdfLoading, setPdfLoading] = useState(false);

  const subtitle =
    result.mode === "dna"
      ? "Your DNA was modeled — structured research summary below"
      : result.mode === "demo"
        ? "Demo data — research summary preview"
        : result.mode === "profile"
          ? "Profile-based estimate — research summary preview"
          : "Shared research summary";

  return (
    <div className="space-y-8" id="genescreen-report">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-brand-600">{subtitle}</p>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            GeneScope research summary
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-600">
            Download or print this structured summary. It lists modeled polygenic
            data (PGS Catalog IDs, percentiles, raw metrics) for your own records
            — not personalized medical advice.
          </p>
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
            {pdfLoading ? "Preparing PDF…" : "Download PDF summary"}
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

      <ClinicianResearchSummary result={result} />

      <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <summary className="cursor-pointer text-sm font-medium text-slate-700">
          Optional: plain-language explainer (not for clinical decisions)
        </summary>
        <div className="mt-4">
          <ReportInterpreter result={result} />
        </div>
      </details>

      <MethodologySection precisionLevel={result.precisionLevel} />
    </div>
  );
}
