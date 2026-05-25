"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/lib/types";
import { downloadReportPdf } from "@/lib/export-pdf";
import { ReportInterpreter } from "./ReportInterpreter";
import { CancerInsightCard } from "./report/CancerInsightCard";
import { ShareReportButton } from "./report/ShareReportButton";

interface ReportViewProps {
  result: AnalysisResult;
  onReset: () => void;
}

export function ReportView({ result, onReset }: ReportViewProps) {
  const [pdfLoading, setPdfLoading] = useState(false);

  const modeLabel =
    result.mode === "demo"
      ? "Sample data demo"
      : result.mode === "shared"
        ? "Shared report"
        : "Your personal insights";

  return (
    <div className="space-y-8" id="prs-report">
      <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-6">
        <p className="text-sm font-medium text-brand-700">{modeLabel}</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">
          Your cancer risk insights
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Educational genetic information based on polygenic scores — not a
          diagnosis and not medical guidance. Discuss with a licensed clinician.
        </p>
        {result.mode === "demo" && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
            This report used synthetic demo data. Upload your own file for
            personal insights.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={async () => {
              setPdfLoading(true);
              try {
                await downloadReportPdf(result);
              } finally {
                setPdfLoading(false);
              }
            }}
            disabled={pdfLoading}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {pdfLoading ? "Preparing PDF…" : "Download PDF"}
          </button>
          <ShareReportButton result={result} />
        </div>
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Start over
        </button>
      </div>

      {result.familyHistorySummary && result.familyHistorySummary.length > 0 && (
        <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-4">
          <h3 className="text-sm font-semibold text-violet-900">
            Family context you shared
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-violet-950">
            {result.familyHistorySummary.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {result.reports.map((report) => (
          <CancerInsightCard key={report.cancerType} report={report} />
        ))}
      </div>

      <ReportInterpreter result={result} />

      <footer className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-xs leading-relaxed text-slate-600">
        {result.globalDisclaimer}
      </footer>
    </div>
  );
}
