import type { CancerType, PrsScoreDefinition } from "./types";

import breastWeights from "@/data/prs/breast.json";
import colorectalWeights from "@/data/prs/colorectal.json";
import prostateWeights from "@/data/prs/prostate.json";
import ovarianWeights from "@/data/prs/ovarian.json";

const BUNDLED: PrsScoreDefinition[] = [
  breastWeights as PrsScoreDefinition,
  colorectalWeights as PrsScoreDefinition,
  prostateWeights as PrsScoreDefinition,
  ovarianWeights as PrsScoreDefinition,
];

/** PGS Catalog IDs used when you run `npm run prepare-data` */
export const PGS_CATALOG_IDS: Record<CancerType, string> = {
  breast: "PGS005104",
  colorectal: "PGS004240",
  prostate: "PGS000662",
  ovarian: "PGS000048",
};

export function getActivePrsScores(): PrsScoreDefinition[] {
  return BUNDLED.filter((s) => s.variants.length > 0);
}

export function getScoreByCancer(type: CancerType): PrsScoreDefinition | undefined {
  return BUNDLED.find((s) => s.cancerType === type);
}
