/**
 * Absolute risk via unified log-linear joint model (see joint-risk-model.ts).
 * Legacy multiplicative RR_PRS × RR_clinical removed.
 */

import {
  absoluteRiskFromLogRr,
  computeLogRelativeRisk,
  logRelativeRiskToRr,
  resolveBaselineLifetimeRisk,
  type JointRiskInput,
} from "./joint-risk-model";
import { bootstrapAbsoluteRiskUncertainty } from "./uncertainty";
import type { AbsoluteRiskBreakdown } from "./types";

export type { AbsoluteRiskBreakdown };

export function buildAbsoluteRiskBreakdown(
  input: JointRiskInput & { method: string; includeUncertainty?: boolean },
): AbsoluteRiskBreakdown {
  const baselineLifetimeRisk = resolveBaselineLifetimeRisk(
    input.cancerType,
    input.profile,
  );
  const components = computeLogRelativeRisk(input);
  const logRelativeRisk = components.total;
  const rrTotal = logRelativeRiskToRr(logRelativeRisk);
  const absoluteLifetimeRisk = absoluteRiskFromLogRr(
    baselineLifetimeRisk,
    logRelativeRisk,
  );

  const uncertainty =
    input.includeUncertainty !== false
      ? bootstrapAbsoluteRiskUncertainty(input)
      : undefined;

  const absoluteLifetimeRiskPercent =
    uncertainty?.lifetimeRiskPercent ??
    Math.round(absoluteLifetimeRisk * 1000) / 10;

  return {
    cancerType: input.cancerType,
    baselineLifetimeRisk,
    rrTotal,
    logRelativeRisk,
    logComponents: {
      prs: components.prs,
      familyHistory: components.familyHistory,
      age: components.age,
      ancestry: components.ancestry,
      clinicalPrior: components.clinicalPrior,
    },
    absoluteLifetimeRisk,
    absoluteLifetimeRiskPercent,
    uncertainty,
    method: input.method,
  };
}

/** @deprecated Use log-linear joint model — kept for migration references */
export function rrFromPrsZ(z: number, relativeRiskPerSd: number): number {
  return Math.exp(z * Math.log(relativeRiskPerSd));
}

export function absoluteLifetimeRisk(
  baselineLifetimeRisk: number,
  logRr: number,
): number {
  return absoluteRiskFromLogRr(baselineLifetimeRisk, logRr);
}
