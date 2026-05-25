/**
 * Production risk interpretation — RR + percentile + informational population baseline.
 * Absolute personalized probability is DISABLED (see validity-config).
 */

import { baselineFor } from "../../epidemiology-baselines";
import { seerBaselineLifetimeRisk } from "../../seer-baseline";
import { computeDeterministicUncertainty } from "../../uncertainty";
import { VALIDITY_MODE, VALIDITY_DISCLAIMERS } from "../../validity-config";
import type {
  AbsoluteRiskBreakdown,
  CancerType,
  UserProfile,
} from "../../types";
import type { JointRiskInput } from "../../joint-risk-model";
import {
  computeProductionLogRelativeRisk,
  logRelativeRiskToRr,
  literatureBetaPrs,
} from "./literature-relative-risk";

export function populationBaselinePercent(
  cancerType: CancerType,
  profile?: UserProfile,
): number {
  return Math.round(seerBaselineLifetimeRisk(cancerType, profile) * 1000) / 10;
}

export function buildRiskInterpretation(
  input: JointRiskInput & {
    method?: string;
    includeUncertainty?: boolean;
    referenceCalibrationStatus?: "calibrated_1kg" | "uncalibrated_reference_warning";
    referenceWarnings?: string[];
  },
): AbsoluteRiskBreakdown {
  const logComponents = computeProductionLogRelativeRisk(input);
  const logRelativeRisk = logComponents.total;
  const rrTotal = logRelativeRiskToRr(logRelativeRisk);
  const baselineLifetimeRisk = seerBaselineLifetimeRisk(
    input.cancerType,
    input.profile,
  );

  const uncertainty =
    input.includeUncertainty !== false
      ? computeDeterministicUncertainty(input, logRelativeRisk, rrTotal)
      : undefined;

  const status = input.referenceCalibrationStatus ?? "calibrated_1kg";
  const methodLabel =
    input.method ??
    (status === "uncalibrated_reference_warning"
      ? "Literature RR (Z unavailable — reference mismatch)"
      : "Three-layer: PGS → 1KG Z → literature β·Z (+ FH/age)");

  return {
    cancerType: input.cancerType,
    baselineLifetimeRisk,
    rrTotal,
    logRelativeRisk,
    logComponents: {
      prs: logComponents.prs,
      familyHistory: logComponents.familyHistory,
      age: logComponents.age,
      ancestry: logComponents.ancestry,
      clinicalPrior: logComponents.clinicalPrior,
    },
    /** @deprecated Not computed when ABSOLUTE_RISK disabled — always 0 */
    absoluteLifetimeRisk: 0,
    absoluteLifetimeRiskPercent: populationBaselinePercent(
      input.cancerType,
      input.profile,
    ),
    uncertainty,
    method: methodLabel,
    outputMode: "relative_risk_only",
    populationBaselineLifetimePercent: populationBaselinePercent(
      input.cancerType,
      input.profile,
    ),
    relativeRisk: rrTotal,
    literatureBetaPrs: literatureBetaPrs(input.cancerType),
    referenceCalibrationStatus: status,
    referenceWarnings: input.referenceWarnings,
    validityNote: VALIDITY_DISCLAIMERS.notPersonalizedProbability,
    absoluteRiskDisabled: VALIDITY_MODE.ABSOLUTE_RISK === "disabled",
  };
}

/** API alias preserved for report-generator */
export const buildAbsoluteRiskBreakdown = buildRiskInterpretation;
