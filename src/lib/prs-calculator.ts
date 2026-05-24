import type {
  PrsComputationResult,
  PrsScoreDefinition,
  PrsVariant,
  RiskTier,
  UserGenotype,
} from "./types";

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

  // Strand flip: try complement alleles
  const ce1 = complement(e1);
  const ce2 = complement(e2);
  const countEffectFlip = alleles.filter((a) => a === ce1).length;
  const countOtherFlip = alleles.filter((a) => a === ce2).length;
  if (countEffectFlip + countOtherFlip === 2) return countEffectFlip;

  return null;
}

export function computePrsForScore(
  definition: PrsScoreDefinition,
  genotypes: Map<string, UserGenotype>,
): PrsComputationResult {
  let rawScore = 0;
  let variantsUsed = 0;

  for (const variant of definition.variants) {
    const user = genotypes.get(variant.rsid.toLowerCase());
    if (!user) continue;

    const dosage = dosageOfEffectAllele(
      user.genotype,
      variant.effectAllele,
      variant.otherAllele,
    );
    if (dosage === null) continue;

    rawScore += dosage * variant.weight;
    variantsUsed++;
  }

  const variantsTotal = definition.variants.length;
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
    relativeRiskPerSd: 1.3,
    citation: definition.citation,
  };
}

/** Standard normal CDF approximation */
function zScoreToPercentile(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  const cdf = z >= 0 ? 1 - p : p;
  return Math.round(cdf * 1000) / 10;
}

function percentileToRiskTier(percentile: number): RiskTier {
  if (percentile < 20) return "low";
  if (percentile < 80) return "average";
  if (percentile < 95) return "moderate";
  return "high";
}

export function validateMatchRate(
  result: PrsComputationResult,
  minRate = 0.5,
): string | null {
  if (result.matchRate < minRate) {
    return `Only ${Math.round(result.matchRate * 100)}% of PRS variants were found in your file. Results may be unreliable. Consider re-downloading your raw data.`;
  }
  return null;
}
