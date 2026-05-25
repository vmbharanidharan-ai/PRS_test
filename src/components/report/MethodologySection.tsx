import type { PrecisionLevel } from "@/lib/types";

export function MethodologySection({
  precisionLevel,
}: {
  precisionLevel: PrecisionLevel;
}) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        Section 4 · Learn more
      </p>
      <h2 className="mt-2 text-lg font-bold text-slate-900">Methodology</h2>
      <div className="mt-4 space-y-3 text-sm text-slate-600">
        {precisionLevel === "population" && (
          <p>
            <strong>Profile mode:</strong> Uses SEER/CDC-scale lifetime risk
            baselines, demographic conditioning (age, sex, ancestry), and
            family-history multipliers. Polygenic risk is modeled as a normal
            distribution — you receive a percentile <em>range</em>, not a personal
            score.
          </p>
        )}
        {(precisionLevel === "genetic" || precisionLevel === "demo") && (
          <p>
            <strong>DNA mode:</strong> Computes polygenic scores from PGS
            Catalog published weights (thousands of common variants). Compared to
            European-reference population mean and standard deviation.
          </p>
        )}
        <p>
          <strong>Progressive precision:</strong> Population estimate → profile
          conditioning → full DNA PRS. None of these replace clinical genetic
          testing (BRCA, Lynch) or medical advice.
        </p>
        <p>
          Sources: PGS Catalog, NCCN/USPSTF educational context, epidemiological
          priors. Not FDA-cleared.
        </p>
      </div>
    </section>
  );
}
