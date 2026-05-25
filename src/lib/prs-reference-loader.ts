import type { AncestryGroup, CancerType } from "./types";
import type {
  PrsReferenceDistribution,
  ReferencePanelSelection,
  ReferencePopulation,
} from "./prs-reference-types";
import { ANCESTRY_TO_REFERENCE } from "./prs-reference-types";

import breastEur from "@/data/prs-reference/breast/PGS005104/EUR.json";
import breastAfr from "@/data/prs-reference/breast/PGS005104/AFR.json";
import breastEas from "@/data/prs-reference/breast/PGS005104/EAS.json";
import colorectalEur from "@/data/prs-reference/colorectal/PGS004240/EUR.json";
import colorectalAfr from "@/data/prs-reference/colorectal/PGS004240/AFR.json";
import prostateEur from "@/data/prs-reference/prostate/PGS000662/EUR.json";
import prostateAfr from "@/data/prs-reference/prostate/PGS000662/AFR.json";
import ovarianEur from "@/data/prs-reference/ovarian/PGS000048/EUR.json";

const BUNDLED: PrsReferenceDistribution[] = [
  breastEur as PrsReferenceDistribution,
  breastAfr as PrsReferenceDistribution,
  breastEas as PrsReferenceDistribution,
  colorectalEur as PrsReferenceDistribution,
  colorectalAfr as PrsReferenceDistribution,
  prostateEur as PrsReferenceDistribution,
  prostateAfr as PrsReferenceDistribution,
  ovarianEur as PrsReferenceDistribution,
];

const BY_KEY = new Map<string, PrsReferenceDistribution>();
for (const ref of BUNDLED) {
  BY_KEY.set(`${ref.cancerType}:${ref.pgsId}:${ref.population}`, ref);
}

export function listReferencePopulations(
  cancerType: CancerType,
  pgsId: string,
): ReferencePopulation[] {
  const pops: ReferencePopulation[] = [];
  for (const ref of BUNDLED) {
    if (ref.cancerType === cancerType && ref.pgsId === pgsId) {
      pops.push(ref.population);
    }
  }
  return pops;
}

export function getReferenceDistribution(
  cancerType: CancerType,
  pgsId: string,
  population: ReferencePopulation,
): PrsReferenceDistribution | undefined {
  return BY_KEY.get(`${cancerType}:${pgsId}:${population}`);
}

const MIXTURE_DEFAULT: Partial<Record<ReferencePopulation, number>> = {
  EUR: 0.5,
  AFR: 0.2,
  EAS: 0.15,
  SAS: 0.1,
  AMR: 0.05,
};

/**
 * Select reference panel from user ancestry; use mixture when confidence is low.
 */
export function selectReferencePanel(
  cancerType: CancerType,
  pgsId: string,
  ancestry?: AncestryGroup,
  ancestryConfidence = 0.85,
): ReferencePanelSelection {
  const warnings: string[] = [];
  const mapped = ancestry ? ANCESTRY_TO_REFERENCE[ancestry] : "MULTI";

  if (ancestryConfidence < 0.7 || mapped === "MULTI" || !ancestry) {
    warnings.push(
      "Ancestry uncertain or mixed — PRS percentile uses a multi-population reference mixture; precision is reduced.",
    );
    const primary = getReferenceDistribution(cancerType, pgsId, "EUR");
    if (!primary) {
      warnings.push("Reference panel missing; using best available population.");
    }
    return {
      population: "MULTI",
      ancestryConfidence,
      usedMixture: true,
      mixtureWeights: MIXTURE_DEFAULT,
      warnings,
    };
  }

  const pop = mapped as ReferencePopulation;
  const ref = getReferenceDistribution(cancerType, pgsId, pop);
  if (!ref) {
    warnings.push(
      `${pop} reference not bundled — falling back to EUR reference panel.`,
    );
    return {
      population: "EUR",
      ancestryConfidence,
      usedMixture: false,
      warnings,
    };
  }

  return {
    population: pop,
    ancestryConfidence,
    usedMixture: false,
    warnings,
  };
}

export function getPrimaryReference(
  cancerType: CancerType,
  pgsId: string,
  selection: ReferencePanelSelection,
): PrsReferenceDistribution | undefined {
  if (!selection.usedMixture) {
    return getReferenceDistribution(cancerType, pgsId, selection.population);
  }
  return getReferenceDistribution(cancerType, pgsId, "EUR");
}
