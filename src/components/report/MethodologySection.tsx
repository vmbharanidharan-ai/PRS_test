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
            <strong>Four-level stack (Path A — research honesty):</strong> (1) PGS
            Catalog + OpenGWAS provenance → raw PRS; (2) 1000 Genomes reference →
            percentile/Z; (3) SEER baseline R<sub>base</sub>; (4) synthetic cohort
            pseudo-calibration (literature HR/SD + simulated outcomes — not UKB
            longitudinal data). Absolute risk: P = 1 − (1 − R<sub>base</sub>
            )<sup>RR</sup>. Not clinically validated.
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
