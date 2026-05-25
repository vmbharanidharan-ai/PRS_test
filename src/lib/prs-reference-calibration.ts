import { empiricalPercentile, empiricalZScore } from "./empirical-percentile";
import {
  getStrictReference,
  selectStrictReferencePanel,
  type ReferenceCalibrationStatus,
} from "./risk-engine/core/strict-reference";
import type { ReferencePanelSelection } from "./prs-reference-types";
import type { AncestryGroup, CancerType } from "./types";
import type { PrsReferenceDistribution } from "./prs-reference-types";

export interface CalibratedPrsStats {
  percentile: number | null;
  zScore: number | null;
  reference: PrsReferenceDistribution | null;
  selection: ReferencePanelSelection & { status: ReferenceCalibrationStatus };
}

export function calibratePrsAgainstReference(
  rawScore: number,
  cancerType: CancerType,
  pgsId: string,
  ancestry?: AncestryGroup,
  ancestryConfidence = 0.85,
): CalibratedPrsStats | null {
  const selection = selectStrictReferencePanel(
    cancerType,
    pgsId,
    ancestry,
    ancestryConfidence,
  );

  if (selection.status === "uncalibrated_reference_warning") {
    return {
      percentile: null,
      zScore: null,
      reference: null,
      selection,
    };
  }

  const ref = getStrictReference(cancerType, pgsId, selection);
  if (!ref) {
    return {
      percentile: null,
      zScore: null,
      reference: null,
      selection: {
        ...selection,
        status: "uncalibrated_reference_warning",
        warnings: [
          ...selection.warnings,
          "Reference distribution missing after panel selection.",
        ],
      },
    };
  }

  return {
    percentile: Math.round(empiricalPercentile(rawScore, ref) * 10) / 10,
    zScore: empiricalZScore(rawScore, ref),
    reference: ref,
    selection,
  };
}
