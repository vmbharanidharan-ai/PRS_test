import type { AncestryGroup, CancerType } from "./types";
import type {
  PrsReferenceDistribution,
  ReferencePanelSelection,
  ReferencePopulation,
} from "./prs-reference-types";
import { ANCESTRY_TO_REFERENCE } from "./prs-reference-types";
import {
  getStrictReference,
  selectStrictReferencePanel,
} from "./risk-engine/core/strict-reference";

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

/** Strict ancestry-matched panel only — no mixture (see validity-config). */
export function selectReferencePanel(
  cancerType: CancerType,
  pgsId: string,
  ancestry?: AncestryGroup,
  ancestryConfidence = 0.85,
): ReferencePanelSelection {
  const strict = selectStrictReferencePanel(
    cancerType,
    pgsId,
    ancestry,
    ancestryConfidence,
  );
  return {
    population: strict.population,
    ancestryConfidence: strict.ancestryConfidence,
    usedMixture: false,
    warnings: strict.warnings,
  };
}

export function getPrimaryReference(
  cancerType: CancerType,
  pgsId: string,
  selection: ReferencePanelSelection,
): PrsReferenceDistribution | undefined {
  return getReferenceDistribution(cancerType, pgsId, selection.population);
}

export { ANCESTRY_TO_REFERENCE };
