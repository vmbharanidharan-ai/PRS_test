/**
 * Deterministic uncertainty from coverage + ancestry match — no bootstrap Z resampling.
 */

import { ancestryEntropy } from "./ancestry-inference";
import type { JointRiskInput } from "./joint-risk-model";
import {
  computeProductionLogRelativeRisk,
  logRelativeRiskToRr,
} from "./risk-engine/core/literature-relative-risk";
import type { RiskUncertainty } from "./types";

export function prsCoverageScore(matchRate: number): number {
  return Math.max(0, Math.min(1, matchRate));
}

/** SE grows when SNP match rate is low or ancestry reference is weak */
export function logRrStandardError(
  matchRate: number,
  ancestryConfidence: number,
  ancestryDistance = 0,
): number {
  const coverage = prsCoverageScore(matchRate);
  const base =
    coverage >= 0.95 ? 0.06 : coverage >= 0.8 ? 0.12 : 0.12 + (1 - coverage) * 0.35;
  const ancPenalty = (1 - ancestryConfidence) * 0.15 + ancestryDistance * 0.1;
  return base + ancPenalty;
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export function computeConfidenceScore(
  matchRate: number,
  ancestryConfidence: number,
): number {
  const a = 2.2;
  const b = 1.4;
  const raw = a * prsCoverageScore(matchRate) + b * ancestryConfidence - 1.2;
  return Math.max(0.15, Math.min(0.95, sigmoid(raw)));
}

/**
 * Propagate SE on log(RR) → RR interval (no fake cohort resampling).
 */
export function computeDeterministicUncertainty(
  input: JointRiskInput,
  logRr: number,
  rrTotal: number,
): RiskUncertainty {
  const matchRate = input.matchRate ?? 0.5;
  const ancEntropy = input.profile?.ancestryProportions
    ? ancestryEntropy(input.profile.ancestryProportions)
    : 0.5;
  const ancestryConf =
    input.profile?.ancestryConfidence ?? Math.max(0.3, 1 - ancEntropy * 0.5);

  const uncalibrated =
    input.referenceCalibrationStatus === "uncalibrated_reference_warning";
  const se = uncalibrated
    ? 0.45
    : logRrStandardError(matchRate, ancestryConf);

  const logLo = logRr - 1.96 * se;
  const logHi = logRr + 1.96 * se;
  const rrLo = logRelativeRiskToRr(logLo);
  const rrHi = logRelativeRiskToRr(logHi);

  const confidenceScore = computeConfidenceScore(matchRate, ancestryConf);

  return {
    relativeRisk: Math.round(rrTotal * 100) / 100,
    relativeRiskCiLow: Math.round(rrLo * 100) / 100,
    relativeRiskCiHigh: Math.round(rrHi * 100) / 100,
    confidenceScore: Math.round(confidenceScore * 100) / 100,
    prsCoverage: Math.round(prsCoverageScore(matchRate) * 100) / 100,
    ancestryConfidence: Math.round(ancestryConf * 100) / 100,
    method: "deterministic_log_rr_se",
  };
}

/** @deprecated Use computeDeterministicUncertainty */
export function bootstrapAbsoluteRiskUncertainty(
  input: JointRiskInput,
): RiskUncertainty {
  const logRr = computeProductionLogRelativeRisk(input).total;
  const rr = logRelativeRiskToRr(logRr);
  return computeDeterministicUncertainty(input, logRr, rr);
}
