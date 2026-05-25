"use client";

import { useState } from "react";
import {
  allStatementsChecked,
  DNA_REPORT_ACK_STATEMENTS,
  recordDnaReportAcknowledgement,
} from "@/lib/dna-disclaimer";

interface DnaReportUnlockGateProps {
  onUnlock: () => void;
  onCancel: () => void;
}

export function DnaReportUnlockGate({
  onUnlock,
  onCancel,
}: DnaReportUnlockGateProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const complete = allStatementsChecked(checked);

  return (
    <div className="mx-auto max-w-xl rounded-2xl border-2 border-amber-400 bg-amber-50/80 p-8 shadow-lg">
      <p className="text-xs font-bold uppercase tracking-wide text-amber-900">
        Required before your report unlocks
      </p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">
        Please read carefully
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-800">
        Your DNA file has been analyzed locally. GeneScope will show a{" "}
        <strong>structured research summary</strong> — not a diagnosis and not a
        guarantee of safety. You must confirm each statement below before the
        report is displayed or downloaded.
      </p>

      <ul className="mt-6 space-y-4">
        {DNA_REPORT_ACK_STATEMENTS.map((stmt) => (
          <li key={stmt.id}>
            <label className="flex cursor-pointer gap-3 rounded-xl border border-amber-200 bg-white p-4 text-sm leading-relaxed text-slate-900 shadow-sm">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 shrink-0 accent-amber-700"
                checked={!!checked[stmt.id]}
                onChange={(e) =>
                  setChecked((prev) => ({
                    ...prev,
                    [stmt.id]: e.target.checked,
                  }))
                }
              />
              <span>{stmt.text}</span>
            </label>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700"
        >
          Cancel and return home
        </button>
        <button
          type="button"
          disabled={!complete}
          onClick={() => {
            recordDnaReportAcknowledgement();
            onUnlock();
          }}
          className="flex-1 rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          I understand — unlock research summary
        </button>
      </div>

      <p className="mt-4 text-xs text-amber-950/80">
        This gate is separate from Terms of Service. Checking boxes here does not
        waive your right to seek clinical care.
      </p>
    </div>
  );
}
