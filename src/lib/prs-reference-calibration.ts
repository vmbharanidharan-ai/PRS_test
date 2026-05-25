import { empiricalPercentile, empiricalZScore } from "./empirical-percentile";
import {
  getPrimaryReference,
  getReferenceDistribution,
  selectReferencePanel,
} from "./prs-reference-loader";
import type { ReferencePanelSelection } from "./prs-reference-types";
import type { AncestryGroup, CancerType } from "./types";
import type { PrsReferenceDistribution } from "./prs-reference-types";

export interface CalibratedPrsStats {
  percentile: number;
  zScore: number;
  reference: PrsReferenceDistribution;
  selection: ReferencePanelSelection;
}

function mixturePercentile(
  prsValue: number,
  cancerType: CancerType,
  pgsId: string,
  weights: Partial<Record<string, number>>,
): { percentile: number; reference: PrsReferenceDistribution } | null {
  let total = 0;
  let pct = 0;
  let primary: PrsReferenceDistribution | null = null;
  let maxWeight = 0;

  for (const [pop, w] of Object.entries(weights)) {
    if (!w || w <= 0) continue;
    const ref = getReferenceDistribution(
      cancerType,
      pgsId,
      pop as PrsReferenceDistribution["population"],
    );
    if (!ref) continue;
    const p = empiricalPercentile(prsValue, ref);
    pct += w * p;
    total += w;
    if (w > maxWeight) {
      maxWeight = w;
      primary = ref;
    }
  }

  if (!primary || total === 0) return null;
  return { percentile: pct / total, reference: primary };
}

export function calibratePrsAgainstReference(
  rawScore: number,
  cancerType: CancerType,
  pgsId: string,
  ancestry?: AncestryGroup,
  ancestryConfidence = 0.85,
): CalibratedPrsStats | null {
  const selection = selectReferencePanel(
    cancerType,
    pgsId,
    ancestry,
    ancestryConfidence,
  );

  if (selection.usedMixture && selection.mixtureWeights) {
    const mixed = mixturePercentile(
      rawScore,
      cancerType,
      pgsId,
      selection.mixtureWeights,
    );
    if (!mixed) return null;
    return {
      percentile: Math.round(mixed.percentile * 10) / 10,
      zScore: empiricalZScore(rawScore, mixed.reference),
      reference: mixed.reference,
      selection,
    };
  }

  const ref = getPrimaryReference(cancerType, pgsId, selection);
  if (!ref) return null;

  return {
    percentile: empiricalPercentile(rawScore, ref),
    zScore: empiricalZScore(rawScore, ref),
    reference: ref,
    selection,
  };
}
