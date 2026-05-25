import type {
  PrsComputationResult,
  PrsScoreDefinition,
  UserGenotype,
} from "./types";
import { baselineFor } from "./epidemiology-baselines";
import {
  percentileToRiskTier,
  validateMatchRate,
  zScoreToPercentile,
} from "./prs-calculator-utils";
import { computePrsForScoreVectorized } from "./prs-vector";

export { zScoreToPercentile, percentileToRiskTier, validateMatchRate };

function complement(allele: string): string {
  const map: Record<string, string> = {
    A: "T",
    T: "A",
    C: "G",
    G: "C",
  };
  return allele
    .toUpperCase()
    .split("")
    .map((a) => map[a] ?? a)
    .join("");
}

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

  const ce1 = complement(e1);
  const ce2 = complement(e2);
  const countEffectFlip = alleles.filter((a) => a === ce1).length;
  const countOtherFlip = alleles.filter((a) => a === ce2).length;
  if (countEffectFlip + countOtherFlip === 2) return countEffectFlip;

  return null;
}

/** Legacy loop scorer — delegates to vectorized path for performance */
export function computePrsForScore(
  definition: PrsScoreDefinition,
  genotypes: Map<string, UserGenotype>,
): PrsComputationResult {
  const hr = baselineFor(definition.cancerType).hazardRatioPerSd;
  return computePrsForScoreVectorized(definition, genotypes, hr);
}

export function validateMatchRateResult(
  result: PrsComputationResult,
  minRate = 0.5,
): string | null {
  return validateMatchRate(result.matchRate, minRate);
}
