import type { CancerReport } from "@/lib/types";
import { RiskBadge } from "@/components/RiskBadge";
import { AncestryConfidenceMeter } from "./AncestryConfidenceMeter";
import { ScreeningTimeline } from "./ScreeningTimeline";
import { SnpContributors } from "./SnpContributors";
import clsx from "clsx";

export function CancerInsightCard({ report }: { report: CancerReport }) {
  const { riskStory, prs } = report;
  const emphasisRing =
    riskStory.emphasis === "attention"
      ? "ring-rose-200"
      : riskStory.emphasis === "reassuring"
        ? "ring-emerald-200"
        : "ring-slate-200";

  return (
    <article
      className={clsx(
        "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-2",
        emphasisRing,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-xl font-semibold text-slate-900">{report.label}</h3>
        <RiskBadge tier={prs.riskTier} />
      </div>

      <p className="mt-4 text-lg font-medium text-slate-900">{riskStory.headline}</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-700">
        {riskStory.lifetimeFraming}
      </p>
      <p className="mt-3 rounded-lg bg-brand-50/60 px-4 py-3 text-sm text-brand-950">
        {riskStory.populationComparison}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        <strong>What this means:</strong> {riskStory.plainMeaning}
      </p>

      <AncestryConfidenceMeter confidence={report.ancestryConfidence} />
      <ScreeningTimeline items={report.timeline} />
      <SnpContributors contributors={prs.topContributors} />

      <details className="mt-4 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium text-slate-600">
          Technical details
        </summary>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <p className="font-bold text-brand-700">{prs.percentile.toFixed(0)}%</p>
            <p className="text-xs text-slate-500">Percentile</p>
          </div>
          <div>
            <p className="font-bold">
              {prs.zScore >= 0 ? "+" : ""}
              {prs.zScore.toFixed(2)}
            </p>
            <p className="text-xs text-slate-500">Z-score</p>
          </div>
          <div>
            <p className="font-bold">{Math.round(prs.matchRate * 100)}%</p>
            <p className="text-xs text-slate-500">Variant match</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          {report.prs.pgsId} · {report.prs.name}
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-500">
          {report.limitations.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      </details>
    </article>
  );
}
