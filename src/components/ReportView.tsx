"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/lib/types";
import { downloadReportPdf } from "@/lib/export-pdf";
import { RiskBadge } from "./RiskBadge";

interface ReportViewProps {
  result: AnalysisResult;
  onReset: () => void;
}

export function ReportView({ result, onReset }: ReportViewProps) {
  const [pdfLoading, setPdfLoading] = useState(false);

  const handlePdf = async () => {
    setPdfLoading(true);
    try {
      await downloadReportPdf(result);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="space-y-8" id="prs-report">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Your PRS report</h2>
          <p className="mt-1 text-sm text-slate-600">
            {result.variantsInFile.toLocaleString()} variants analyzed ·{" "}
            {result.vendor !== "unknown" ? result.vendor : "genotype file"} ·{" "}
            {new Date(result.analyzedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handlePdf}
            disabled={pdfLoading}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {pdfLoading ? "Preparing PDF…" : "Download PDF"}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Analyze another file
          </button>
        </div>
      </div>

      {result.familyHistorySummary && result.familyHistorySummary.length > 0 && (
        <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-4">
          <h3 className="text-sm font-semibold text-violet-900">
            Family history included in this report
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
          <article
            key={report.cancerType}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h3 className="text-xl font-semibold text-slate-900">
                {report.label}
              </h3>
              <RiskBadge tier={report.prs.riskTier} />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-2xl font-bold text-brand-700">
                  {report.prs.percentile.toFixed(0)}%
                </p>
                <p className="text-xs text-slate-500">Percentile</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-2xl font-bold text-slate-800">
                  {report.prs.zScore >= 0 ? "+" : ""}
                  {report.prs.zScore.toFixed(2)}
                </p>
                <p className="text-xs text-slate-500">Z-score</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-2xl font-bold text-slate-800">
                  {Math.round(report.prs.matchRate * 100)}%
                </p>
                <p className="text-xs text-slate-500">Variant match</p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-700">
              {report.plainLanguageSummary}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Score: {report.prs.pgsId} · {report.prs.name} ·{" "}
              {report.prs.citation}
            </p>

            <div className="mt-6">
              <h4 className="text-sm font-semibold text-slate-900">
                Screening considerations (guideline-informed)
              </h4>
              <ul className="mt-3 space-y-4">
                {report.screening.map((rec, i) => (
                  <li
                    key={i}
                    className="rounded-lg border border-brand-100 bg-brand-50/30 p-4 text-sm"
                  >
                    <p className="font-medium text-brand-900">
                      [{rec.source}] {rec.guideline}
                    </p>
                    <p className="mt-2 text-slate-700">{rec.recommendation}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {rec.rationale}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <details className="mt-4">
              <summary className="cursor-pointer text-xs font-medium text-slate-500">
                Limitations
              </summary>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-500">
                {report.limitations.map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ul>
            </details>
          </article>
        ))}
      </div>

      <footer className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-xs leading-relaxed text-slate-600">
        {result.globalDisclaimer}
      </footer>
    </div>
  );
}
