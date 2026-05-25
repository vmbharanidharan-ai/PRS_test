"use client";

import type { AnalysisResult } from "@/lib/types";
import {
  buildClinicianCancerBlock,
  buildClinicianClosing,
  buildClinicianFamilyHistoryBlock,
  buildClinicianLetterIntro,
  buildClinicianLimitationsBlock,
  buildClinicianOverallBlock,
  buildClinicianPathogenicBlock,
} from "@/lib/clinician-summary";
import { PathogenicAlert } from "./PathogenicAlert";

function LetterBlock({ lines }: { lines: string[] }) {
  return (
    <div className="space-y-1 font-mono text-sm leading-relaxed text-slate-800">
      {lines.map((line, i) =>
        line === "" ? (
          <br key={i} />
        ) : (
          <p key={i} className={line.startsWith("•") ? "pl-2" : ""}>
            {line}
          </p>
        ),
      )}
    </div>
  );
}

interface ClinicianResearchSummaryProps {
  result: AnalysisResult;
}

export function ClinicianResearchSummary({
  result,
}: ClinicianResearchSummaryProps) {
  return (
    <article className="rounded-2xl border-2 border-slate-300 bg-white shadow-sm">
      <header className="border-b border-slate-200 bg-slate-50 px-6 py-5 sm:px-8">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-700">
          Research summary
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          GeneScope Research Summary
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Structured export of educational polygenic modeling (public PGS Catalog
          scores and raw metrics). Not a diagnosis and not phrased as personal
          medical advice.
        </p>
      </header>

      <div className="space-y-8 px-6 py-8 sm:px-8">
        <section>
          <LetterBlock lines={buildClinicianLetterIntro(result)} />
        </section>

        <section className="rounded-xl border-2 border-amber-300 bg-amber-50 p-5">
          <h2 className="text-sm font-bold text-amber-950">Limitations</h2>
          <div className="mt-3">
            <LetterBlock lines={buildClinicianLimitationsBlock()} />
          </div>
        </section>

        {result.pathogenicScreen && (
          <section>
            <PathogenicAlert screen={result.pathogenicScreen} />
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <LetterBlock lines={buildClinicianPathogenicBlock(result)} />
            </div>
          </section>
        )}

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
            Family history (patient-reported)
          </h2>
          <div className="mt-2">
            <LetterBlock lines={buildClinicianFamilyHistoryBlock(result)} />
          </div>
        </section>

        {result.reports.length > 0 && (
          <section className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Aggregate signal
            </h2>
            <div className="mt-2">
              <LetterBlock lines={buildClinicianOverallBlock(result)} />
            </div>
          </section>
        )}

        {result.reports.map((report) => (
          <section
            key={report.cancerType}
            className="rounded-xl border border-slate-200 p-5"
          >
            <h2 className="text-base font-bold text-slate-900">
              {report.label} — raw research data
            </h2>
            <div className="mt-4">
              <LetterBlock lines={buildClinicianCancerBlock(report)} />
            </div>
          </section>
        ))}

        <section className="border-t border-slate-200 pt-6">
          <LetterBlock lines={buildClinicianClosing()} />
        </section>

        {result.populationDisclaimer && (
          <p className="rounded-lg bg-violet-50 p-4 text-xs text-violet-950">
            {result.populationDisclaimer}
          </p>
        )}

        <footer className="text-xs text-slate-500">{result.globalDisclaimer}</footer>
      </div>
    </article>
  );
}
