/**
 * Batched PRS scoring + empirical reference calibration (1000 Genomes–stratified).
 */

import type {
  PrsComputationResult,
  PrsScoreDefinition,
  SnpContribution,
  UserGenotype,
} from "./types";
import type { AncestryGroup } from "./types";
import { percentileToRiskTier } from "./prs-calculator-utils";
import { calibratePrsAgainstReference } from "./prs-reference-calibration";
import { zScoreToPercentile } from "./prs-calculator-utils";

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
  options?: {
    ancestry?: AncestryGroup;
    ancestryConfidence?: number;
  },
): PrsComputationResult {
  const n = definition.variants.length;
  let rawScore = 0;
  let variantsUsed = 0;
  const contributions: SnpContribution[] = [];

  for (let i = 0; i < n; i++) {
    const variant = definition.variants[i];
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

  const calibrated = calibratePrsAgainstReference(
    rawScore,
    definition.cancerType,
    definition.pgsId,
    options?.ancestry,
    options?.ancestryConfidence ?? (options?.ancestry ? 0.85 : 0.5),
  );

  let percentile: number;
  let zScore: number;
  let referencePopulation: string | undefined;
  let calibrationMethod: string | undefined;
  let referenceSource: string | undefined;
  let referenceNIndividuals: number | undefined;

  if (calibrated) {
    percentile = calibrated.percentile;
    zScore = calibrated.zScore;
    referencePopulation = calibrated.selection.usedMixture
      ? "MULTI"
      : calibrated.selection.population;
    calibrationMethod = calibrated.reference.calibrationMethod;
    referenceSource = calibrated.reference.source;
    referenceNIndividuals = calibrated.reference.nIndividuals;
  } else {
    const { mean, sd } = definition.population;
    zScore = sd > 0 ? (rawScore - mean) / sd : 0;
    percentile = zScoreToPercentile(zScore);
    calibrationMethod = "legacy_hwe";
    referenceSource = definition.population.source;
  }

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
    referencePopulation,
    calibrationMethod,
    referenceSource,
    referenceNIndividuals,
  };
}
