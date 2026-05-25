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
            <strong>Profile mode:</strong> Breast — simplified Gail or Tyrer-Cuzick
            (IBIS); colorectal — PREMM5-inspired Lynch probability. Absolute risk:
            P = 1 − (1 − R<sub>base</sub>)<sup>RR</sup> with SEER baselines.
          </p>
        )}
        {(precisionLevel === "genetic" || precisionLevel === "demo") && (
          <p>
            <strong>DNA mode:</strong> PGS Catalog weights → raw PRS → empirical
            percentile within ancestry reference panel (1000 Genomes EUR/AFR/EAS).
            No Hardy–Weinberg Gaussian CDF. RR<sub>PRS</sub> from empirical Z;
            absolute risk via Chatterjee joint model. Pathogenic screen runs first.
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
