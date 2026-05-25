/**
 * Uncertainty layers: PRS coverage, ancestry entropy, bootstrap on log-risk.
 */

import {
  absoluteRiskFromLogRr,
  computeLogRelativeRisk,
  resolveBaselineLifetimeRisk,
  type JointRiskInput,
} from "./joint-risk-model";
import { ancestryEntropy } from "./ancestry-inference";
import type { RiskUncertainty } from "./types";

const BOOTSTRAP_N = 80;

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/** Inflate Z uncertainty when SNP coverage is low */
export function prsCoverageScore(matchRate: number): number {
  return Math.max(0, Math.min(1, matchRate));
}

export function zStandardError(matchRate: number): number {
  const coverage = prsCoverageScore(matchRate);
  if (coverage >= 0.95) return 0.08;
  if (coverage >= 0.8) return 0.15;
  return 0.15 + (1 - coverage) * 0.5;
}

export function bootstrapAbsoluteRiskUncertainty(
  input: JointRiskInput,
  seed = 42,
): RiskUncertainty {
  const rng = seededRandom(seed);
  const baseRisk = resolveBaselineLifetimeRisk(input.cancerType, input.profile);
  const zSe =
    input.zScore !== undefined && input.matchRate !== undefined
      ? zStandardError(input.matchRate)
      : 0.2;

  const risks: number[] = [];
  for (let i = 0; i < BOOTSTRAP_N; i++) {
    const zBoot =
      input.zScore !== undefined
        ? input.zScore + (rng() - 0.5) * 2 * zSe
        : undefined;
    const logRr = computeLogRelativeRisk({ ...input, zScore: zBoot }).total;
    risks.push(absoluteRiskFromLogRr(baseRisk, logRr) * 100);
  }

  risks.sort((a, b) => a - b);
  const lo = risks[Math.floor(BOOTSTRAP_N * 0.025)];
  const hi = risks[Math.floor(BOOTSTRAP_N * 0.975)];
  const mid = risks[Math.floor(BOOTSTRAP_N * 0.5)];

  const coverage = input.matchRate !== undefined ? prsCoverageScore(input.matchRate) : 0.5;
  const ancEntropy = input.profile?.ancestryProportions
    ? ancestryEntropy(input.profile.ancestryProportions)
    : 0.6;
  const ancestryConf =
    input.profile?.ancestryConfidence ?? 1 - ancEntropy * 0.5;

  const confidenceScore = Math.max(
    0.2,
    Math.min(0.95, coverage * 0.45 + ancestryConf * 0.35 + 0.2),
  );

  return {
    lifetimeRiskPercent: Math.round(mid * 10) / 10,
    ciLow: Math.round(lo * 10) / 10,
    ciHigh: Math.round(hi * 10) / 10,
    confidenceScore: Math.round(confidenceScore * 100) / 100,
    prsCoverage: Math.round(coverage * 100) / 100,
    ancestryConfidence: Math.round(ancestryConf * 100) / 100,
    method: "bootstrap_log_risk_80",
  };
}
