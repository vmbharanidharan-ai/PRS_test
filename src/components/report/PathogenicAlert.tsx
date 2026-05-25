"use client";

import type { PathogenicScreenResult } from "@/lib/types";

interface PathogenicAlertProps {
  screen: PathogenicScreenResult;
}

export function PathogenicAlert({ screen }: PathogenicAlertProps) {
  if (screen.findings.length === 0) return null;

  return (
    <div
      className="rounded-2xl border-2 border-red-600 bg-red-50 p-6 text-red-950"
      role="alert"
    >
      <h2 className="text-lg font-bold">Pathogenic variant signal detected</h2>
      <p className="mt-2 text-sm">
        A targeted screen found variant(s) associated with high-penetrance cancer
        risk. <strong>Monogenic risk overrides polygenic scores.</strong> Seek
        genetic counseling and clinical confirmatory testing — do not rely on
        PRS alone.
      </p>
      <ul className="mt-4 space-y-3 text-sm">
        {screen.findings.map((f) => (
          <li key={f.rsid} className="rounded-lg border border-red-200 bg-white p-3">
            <p className="font-semibold">
              {f.gene} — {f.variantLabel} ({f.rsid})
            </p>
            <p className="mt-1 text-slate-700">Your genotype: {f.userGenotype}</p>
            <p className="mt-2">{f.recommendation}</p>
          </li>
        ))}
      </ul>
      {screen.blocksPrsInterpretation && (
        <p className="mt-4 text-sm font-medium">
          Standard polygenic reports are withheld until clinical follow-up. Consumer
          arrays do not sequence all mutations — negative screen does not rule out
          pathogenic carriers.
        </p>
      )}
    </div>
  );
}
