import type { CancerReport } from "@/lib/types";
import { RiskBadge } from "@/components/RiskBadge";
import { AncestryConfidenceMeter } from "./AncestryConfidenceMeter";
import { ScreeningTimeline } from "./ScreeningTimeline";
import { SnpContributors } from "./SnpContributors";

export function CancerInsightCard({ report }: { report: CancerReport }) {
  const { riskStory, population, prs } = report;
  const tier = prs?.riskTier ?? population.riskBand;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-xl font-semibold text-slate-900">{report.label}</h3>
        <RiskBadge tier={tier} />
      </div>

      {report.precision === "population" && (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {population.clinicalModel
            ? `${population.clinicalModel} — not from your DNA.`
            : `Population-based estimate — not from your DNA. Percentile range: ${population.percentileLow}th–${population.percentileHigh}th.`}
        </p>
      )}

      <p className="mt-4 text-lg font-medium text-slate-900">{riskStory.headline}</p>
      <p className="mt-3 rounded-lg border border-brand-100 bg-brand-50/40 px-3 py-2 text-sm font-medium text-brand-950">
        Relative risk vs reference: {population.relativeRisk.toFixed(2)}
        {population.uncertainty && (
          <span className="font-normal text-brand-800">
            {" "}
            (approx. {population.uncertainty.relativeRiskCiLow}–
            {population.uncertainty.relativeRiskCiHigh})
          </span>
        )}
      </p>
      <p className="mt-2 text-xs text-slate-500">
        Population baseline context (SEER-scale, not personalized): ~
        {population.populationBaselineLifetimePercent}% lifetime in general
        population
      </p>
      <p className="mt-2 text-sm text-slate-700">{riskStory.lifetimeFraming}</p>
      <p className="mt-3 rounded-lg bg-brand-50/50 px-3 py-2 text-sm text-brand-950">
        {riskStory.populationComparison}
      </p>
      <div className="mt-4">
        <p className="text-sm font-medium text-slate-800">What this means</p>
        <p className="mt-1 text-sm text-slate-600">{riskStory.plainMeaning}</p>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Confidence: {population.confidenceLevel} · {report.ancestryConfidence.label}
      </p>

      {report.precision === "population" && (
        <div className="mt-4 rounded-lg border border-slate-100 p-3">
          <p className="text-xs font-medium text-slate-700">What would shift this</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-600">
            {population.whatWouldShift.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-medium text-slate-600">
          Technical details
        </summary>
        <div className="mt-3 space-y-2 text-xs text-slate-500">
          {prs && (
            <p>
              PRS: {prs.pgsId} ·{" "}
              {prs.percentile != null
                ? `${prs.percentile.toFixed(0)}th percentile`
                : "uncalibrated (no matched 1KG panel)"}
              {prs.referencePopulation
                ? ` · ref ${prs.referencePopulation} (n≈${prs.referenceNIndividuals ?? "?"})`
                : ""}{" "}
              · {Math.round(prs.matchRate * 100)}% match
              {prs.calibrationMethod && (
                <span className="block">Calibration: {prs.calibrationMethod}</span>
              )}
            </p>
          )}
          <p>
            RR: {population.relativeRisk.toFixed(2)} · log(RR) ={" "}
            {population.absoluteRisk?.logRelativeRisk.toFixed(3) ?? "—"}
            {population.uncertainty && (
              <span className="block text-xs text-slate-600 mt-1">
                RR interval: {population.uncertainty.relativeRiskCiLow}–
                {population.uncertainty.relativeRiskCiHigh} · confidence{" "}
                {Math.round(population.uncertainty.confidenceScore * 100)}% · PRS
                coverage {Math.round(population.uncertainty.prsCoverage * 100)}%
              </span>
            )}
          </p>
        </div>
      </details>

      {prs && prs.topContributors.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <SnpContributors contributors={prs.topContributors} />
        </div>
      )}
    </article>
  );
}
