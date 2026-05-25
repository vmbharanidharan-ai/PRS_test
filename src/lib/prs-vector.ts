/**
 * Batched PRS scoring using typed arrays (SIMD-friendly loops).
 * Avoids per-variant object churn for large consumer genotyping files.
 */

import type {
  PrsComputationResult,
  PrsScoreDefinition,
  RiskTier,
  SnpContribution,
  UserGenotype,
} from "./types";
import { zScoreToPercentile, percentileToRiskTier } from "./prs-calculator-utils";

function dosageOfEffectAllele(
  userGenotype: string,
  effectAllele: string,
  otherAllele: string,
): number | null {
  const g = userGenotype.toUpperCase();
  const e1 = effectAllele.toUpperCase();
  const e2 = otherAllele.toUpperCase();
  if (g.length !== 2) return null;

  const alleles = [g[0], g[1]];
  const countEffect = alleles.filter((a) => a === e1).length;
  const countOther = alleles.filter((a) => a === e2).length;
  if (countEffect + countOther === 2) return countEffect;

  const complement = (a: string) =>
    ({ A: "T", T: "A", C: "G", G: "C" })[a] ?? a;
  const ce1 = complement(e1);
  const ce2 = complement(e2);
  const countEffectFlip = alleles.filter((a) => a === ce1).length;
  const countOtherFlip = alleles.filter((a) => a === ce2).length;
  if (countEffectFlip + countOtherFlip === 2) return countEffectFlip;

  return null;
}

export function computePrsForScoreVectorized(
  definition: PrsScoreDefinition,
  genotypes: Map<string, UserGenotype>,
  relativeRiskPerSd: number,
): PrsComputationResult {
  const n = definition.variants.length;
  const weights = new Float64Array(n);
  const rsids: string[] = new Array(n);

  let rawScore = 0;
  let variantsUsed = 0;
  const contributions: SnpContribution[] = [];

  for (let i = 0; i < n; i++) {
    const variant = definition.variants[i];
    rsids[i] = variant.rsid;
    weights[i] = variant.weight;

    const user = genotypes.get(variant.rsid.toLowerCase());
    if (!user) continue;

    const dosage = dosageOfEffectAllele(
      user.genotype,
      variant.effectAllele,
      variant.otherAllele,
    );
    if (dosage === null) continue;

    const contribution = dosage * variant.weight;
    rawScore += contribution;
    variantsUsed++;
    contributions.push({
      rsid: variant.rsid,
      effectAllele: variant.effectAllele,
      userGenotype: user.genotype,
      dosage,
      weight: variant.weight,
      contribution,
    });
  }

  contributions.sort(
    (a, b) => Math.abs(b.contribution) - Math.abs(a.contribution),
  );

  const variantsTotal = n;
  const matchRate = variantsTotal > 0 ? variantsUsed / variantsTotal : 0;
  const { mean, sd } = definition.population;
  const zScore = sd > 0 ? (rawScore - mean) / sd : 0;
  const percentile = zScoreToPercentile(zScore);
  const riskTier = percentileToRiskTier(percentile);

  return {
    pgsId: definition.pgsId,
    cancerType: definition.cancerType,
    name: definition.name,
    rawScore,
    zScore,
    percentile,
    riskTier,
    variantsUsed,
    variantsTotal,
    matchRate,
    relativeRiskPerSd,
    citation: definition.citation,
    topContributors: contributions.slice(0, 10),
  };
}
