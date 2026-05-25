/**
 * Production risk engine — three-layer stack (Path A).
 *
 * Layer 1: PGS Catalog → PRS_raw
 * Layer 2: 1000 Genomes → Z-score (strict ancestry match)
 * Layer 3: Literature β = ln(HR/SD) → log(RR), RR = exp(log RR)
 *
 * DISABLED: synthetic cohort calibration, personalized absolute risk P = 1-(1-R_base)^RR
 * See validity-config.ts and risk-engine/demo/ for demo-only simulation.
 */

export type { JointRiskInput } from "./joint-risk-model";

export {
  buildRiskInterpretation,
  buildAbsoluteRiskBreakdown,
  populationBaselinePercent,
} from "./risk-engine/core/build-interpretation";

export {
  computeProductionLogRelativeRisk,
  logRelativeRiskToRr,
  literatureBetaPrs,
} from "./risk-engine/core/literature-relative-risk";

/** @deprecated Absolute personalized risk disabled */
export function absoluteLifetimeRisk(
  _baselineLifetimeRisk: number,
  logRr: number,
): number {
  return logRelativeRiskToRr(logRr) > 0 ? 0 : 0;
}

export function rrFromPrsZ(z: number, relativeRiskPerSd: number): number {
  return Math.exp(z * Math.log(relativeRiskPerSd));
}

import { logRelativeRiskToRr } from "./risk-engine/core/literature-relative-risk";
