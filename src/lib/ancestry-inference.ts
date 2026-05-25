/**
 * Genetic ancestry for PRS reference weighting.
 *
 * Gold standard: PLINK2 PCA projection on 1000 Genomes (see genomics-pipeline/ancestry_pca.sh).
 * Runtime fallback: self-reported ancestry → proportion vector (clearly labeled).
 */

import type { AncestryGroup } from "./types";
import type { ReferencePopulation } from "./prs-reference-types";

export type AncestryProportions = Partial<
  Record<ReferencePopulation, number>
>;

export interface AncestryInferenceResult {
  proportions: AncestryProportions;
  /** 0–1; low when uniform/mixed or self-report only */
  confidence: number;
  method: "pca_1kg" | "self_report" | "uniform_mixture";
  warnings: string[];
}

const SELF_REPORT_MAP: Record<
  AncestryGroup,
  AncestryProportions
> = {
  european: { EUR: 0.92, AMR: 0.08 },
  african: { AFR: 0.9, EUR: 0.1 },
  asian: { EAS: 0.85, SAS: 0.15 },
  hispanic: { AMR: 0.55, EUR: 0.35, AFR: 0.1 },
  other: { EUR: 0.35, AFR: 0.25, EAS: 0.2, SAS: 0.1, AMR: 0.1 },
  unknown: { EUR: 0.4, AFR: 0.2, EAS: 0.2, SAS: 0.1, AMR: 0.1 },
};

/** Shannon entropy of ancestry vector (normalized 0–1, high = uncertain) */
export function ancestryEntropy(proportions: AncestryProportions): number {
  const vals = Object.values(proportions).filter((v) => v && v > 0) as number[];
  if (vals.length <= 1) return 1;
  const sum = vals.reduce((a, b) => a + b, 0);
  if (sum <= 0) return 1;
  let h = 0;
  for (const p of vals) {
    const q = p / sum;
    if (q > 0) h -= q * Math.log(q);
  }
  const maxH = Math.log(vals.length);
  return maxH > 0 ? h / maxH : 1;
}

export function inferAncestryFromSelfReport(
  ancestry?: AncestryGroup,
): AncestryInferenceResult {
  const group = ancestry ?? "unknown";
  const proportions = { ...SELF_REPORT_MAP[group] };
  const entropy = ancestryEntropy(proportions);
  const confidence = group === "unknown" ? 0.45 : Math.max(0.5, 1 - entropy * 0.5);

  return {
    proportions,
    confidence,
    method: "self_report",
    warnings:
      group === "unknown"
        ? [
            "Ancestry not specified — using multi-population mixture. Run PCA projection (genomics-pipeline) for genetic inference.",
          ]
        : [
            "Ancestry from self-report — genetic PCA projection (1000 Genomes) recommended for PRS calibration.",
          ],
  };
}

/**
 * Future: merge PLINK2 --score eigenvec output into proportions via distance to 1KG centroids.
 */
export function inferAncestryFromPcaProjection(
  pc1: number,
  pc2: number,
  centroids: Record<ReferencePopulation, { pc1: number; pc2: number }>,
): AncestryInferenceResult {
  const dists: AncestryProportions = {};
  let minD = Infinity;
  for (const [pop, c] of Object.entries(centroids)) {
    const d = Math.hypot(pc1 - c.pc1, pc2 - c.pc2);
    dists[pop as ReferencePopulation] = d;
    minD = Math.min(minD, d);
  }
  const inv = Object.entries(dists).map(([pop, d]) => [
    pop,
    1 / (d + 0.01),
  ]) as [ReferencePopulation, number][];
  const sum = inv.reduce((a, [, w]) => a + w, 0);
  const proportions: AncestryProportions = {};
  for (const [pop, w] of inv) {
    proportions[pop] = w / sum;
  }
  const entropy = ancestryEntropy(proportions);
  return {
    proportions,
    confidence: Math.max(0.55, 1 - entropy * 0.6),
    method: "pca_1kg",
    warnings: entropy > 0.75 ? ["PCA position is admixed — PRS precision reduced."] : [],
  };
}
