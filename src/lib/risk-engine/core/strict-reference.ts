/**
 * Layer 2 — 1000G reference for Z-score normalization only.
 * No mixture fallback; uncalibrated warning when ancestry does not match.
 */

import type { AncestryGroup, CancerType } from "../../types";
import type {
  PrsReferenceDistribution,
  ReferencePanelSelection,
  ReferencePopulation,
} from "../../prs-reference-types";
import { ANCESTRY_TO_REFERENCE } from "../../prs-reference-types";
import {
  getReferenceDistribution,
  listReferencePopulations,
} from "../../prs-reference-loader";

export type ReferenceCalibrationStatus =
  | "calibrated_1kg"
  | "uncalibrated_reference_warning";

const MIN_ANCESTRY_CONFIDENCE = 0.7;

export function selectStrictReferencePanel(
  cancerType: CancerType,
  pgsId: string,
  ancestry?: AncestryGroup,
  ancestryConfidence = 0.85,
): ReferencePanelSelection & { status: ReferenceCalibrationStatus } {
  const warnings: string[] = [];

  if (
    !ancestry ||
    ancestry === "unknown" ||
    ancestry === "other" ||
    ancestryConfidence < MIN_ANCESTRY_CONFIDENCE
  ) {
    warnings.push(
      "Ancestry not specified or confidence too low — PRS Z-score and percentile require a matched 1000 Genomes reference panel.",
    );
    return {
      population: "EUR",
      ancestryConfidence,
      usedMixture: false,
      warnings,
      status: "uncalibrated_reference_warning",
    };
  }

  const mapped = ANCESTRY_TO_REFERENCE[ancestry];
  if (mapped === "MULTI") {
    warnings.push("Ancestry group cannot be mapped to a single 1000G super-population.");
    return {
      population: "EUR",
      ancestryConfidence,
      usedMixture: false,
      warnings,
      status: "uncalibrated_reference_warning",
    };
  }

  const pop = mapped as ReferencePopulation;
  const ref = getReferenceDistribution(cancerType, pgsId, pop);
  if (!ref) {
    const available = listReferencePopulations(cancerType, pgsId).join(", ");
    warnings.push(
      `No bundled ${pop} reference for ${pgsId}. Available: ${available || "none"}.`,
    );
    return {
      population: pop,
      ancestryConfidence,
      usedMixture: false,
      warnings,
      status: "uncalibrated_reference_warning",
    };
  }

  return {
    population: pop,
    ancestryConfidence,
    usedMixture: false,
    warnings,
    status: "calibrated_1kg",
  };
}

export function getStrictReference(
  cancerType: CancerType,
  pgsId: string,
  selection: ReferencePanelSelection & { status: ReferenceCalibrationStatus },
): PrsReferenceDistribution | undefined {
  if (selection.status !== "calibrated_1kg") return undefined;
  return getReferenceDistribution(cancerType, pgsId, selection.population);
}
