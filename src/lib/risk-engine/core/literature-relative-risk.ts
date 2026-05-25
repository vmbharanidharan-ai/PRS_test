/**
 * Production pipeline — Layer 3: Interpretation
 * β_prs = ln(HR per SD) from literature; log(RR)_PRS = β_prs × Z
 * No synthetic cohort fitting.
 */

import { baselineFor } from "../../epidemiology-baselines";
import {
  encodeAgeLog,
  encodeAncestryLog,
  encodeFamilyHistoryLog,
  type JointRiskInput,
  type LogRiskComponents,
} from "../../joint-risk-model";

export function literatureBetaPrs(cancer: import("../../types").CancerType): number {
  return Math.log(baselineFor(cancer).hazardRatioPerSd);
}

export function computeProductionLogRelativeRisk(
  input: JointRiskInput,
): LogRiskComponents {
  let prs = 0;
  if (input.zScore !== undefined) {
    prs = literatureBetaPrs(input.cancerType) * input.zScore;
  }

  const familyHistory =
    input.clinicalLogPrior !== undefined
      ? 0
      : encodeFamilyHistoryLog(input.cancerType, input.profile?.familyHistory);

  const age = encodeAgeLog(input.profile?.age);
  const ancestry = encodeAncestryLog(
    input.cancerType,
    input.ancestryProportions,
  );
  const clinicalPrior = input.clinicalLogPrior ?? 0;
  const total = prs + familyHistory + age + ancestry + clinicalPrior;

  return { prs, familyHistory, age, ancestry, clinicalPrior, total };
}

export function logRelativeRiskToRr(logRr: number): number {
  return Math.exp(Math.max(-5, Math.min(5, logRr)));
}
