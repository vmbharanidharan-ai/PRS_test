/**
 * Unified log-linear relative risk model (single predictor on log-risk scale).
 *
 *   log(RR) = β_PRS·Z_PRS + β_FH·FH + β_ancestry·X_anc + β_age·X_age + clinical_log_prior
 *   RR = exp(log(RR))
 *   Personalized absolute risk P = 1−(1−R_base)^RR is DISABLED (validity-config).
 *
 * Do NOT multiply RR_PRS × RR_FH × RR_clinical — that is statistically invalid stacking.
 */

import { baselineFor } from "./epidemiology-baselines";
import {
  computeProductionLogRelativeRisk,
  logRelativeRiskToRr,
} from "./risk-engine/core/literature-relative-risk";
import { VALIDITY_MODE } from "./validity-config";
import type {
  AncestryGroup,
  CancerType,
  FamilyHistoryInput,
  ReferenceCalibrationStatus,
  UserProfile,
} from "./types";
import type { AncestryProportions } from "./ancestry-inference";

export interface JointRiskInput {
  cancerType: CancerType;
  profile?: UserProfile;
  zScore?: number;
  matchRate?: number;
  ancestryProportions?: AncestryProportions;
  /** 1000G panel used for PRS Z (Level 2) */
  referencePopulation?: string;
  referenceCalibrationStatus?: ReferenceCalibrationStatus;
  /** Profile mode: additive log-RR from external clinical model (Gail/TC/PREMM5), not multiplied */
  clinicalLogPrior?: number;
  clinicalModelLabel?: string;
}

export interface LogRiskComponents {
  prs: number;
  familyHistory: number;
  age: number;
  ancestry: number;
  clinicalPrior: number;
  total: number;
}

/** Additive FH terms on log-risk scale (not multiplicative RR) */
export function encodeFamilyHistoryLog(
  cancer: CancerType,
  fh?: FamilyHistoryInput,
): number {
  if (!fh?.provided) return 0;

  let logRr = 0;
  switch (cancer) {
    case "breast":
      if (fh.breastFirstDegree) logRr += Math.log(2.0);
      else if (fh.breastSecondDegree) logRr += Math.log(1.4);
      if (fh.ovarianFirstDegree) logRr += Math.log(1.35);
      if (fh.ashkenaziJewish) logRr += Math.log(1.25);
      break;
    case "colorectal":
      if (fh.colorectalFirstDegree) logRr += Math.log(2.1);
      if (fh.lynchSyndromeConcern) logRr += Math.log(2.5);
      break;
    case "prostate":
      if (fh.prostateFirstDegree) logRr += Math.log(2.0);
      break;
    case "ovarian":
      if (fh.ovarianFirstDegree) logRr += Math.log(3.0);
      if (fh.breastFirstDegree) logRr += Math.log(1.5);
      if (fh.ashkenaziJewish) logRr += Math.log(1.3);
      break;
  }
  if (fh.youngestAffectedAge != null && fh.youngestAffectedAge < 50) {
    logRr += Math.log(1.15);
  }
  return logRr;
}

/** Age centered at 50 — small log-risk slope per year */
export function encodeAgeLog(age?: number): number {
  if (!age) return 0;
  return 0.012 * (age - 50);
}

/**
 * Ancestry as weighted log-risk offsets vs EUR reference (from inferred proportions).
 */
export function encodeAncestryLog(
  cancer: CancerType,
  proportions?: AncestryProportions,
): number {
  if (!proportions) return 0;

  const base = baselineFor(cancer);
  const eurMult = base.ancestryMultipliers.european ?? 1;
  let logRr = 0;

  const pops: (keyof AncestryProportions)[] = [
    "EUR",
    "AFR",
    "EAS",
    "SAS",
    "AMR",
  ];
  const map: Record<string, AncestryGroup> = {
    EUR: "european",
    AFR: "african",
    EAS: "asian",
    SAS: "asian",
    AMR: "hispanic",
  };

  for (const pop of pops) {
    const w = proportions[pop] ?? 0;
    if (w <= 0) continue;
    const group = map[pop];
    const mult = base.ancestryMultipliers[group] ?? 1;
    logRr += w * Math.log(mult / eurMult);
  }

  return logRr;
}

/** Production log-risk — delegates to core (literature β only). */
export function computeLogRelativeRisk(input: JointRiskInput): LogRiskComponents {
  return computeProductionLogRelativeRisk(input);
}

export { logRelativeRiskToRr };

/**
 * @deprecated Personalized absolute risk disabled (VALIDITY_MODE.ABSOLUTE_RISK).
 * Returns 0 — use relativeRisk from buildRiskInterpretation instead.
 */
export function absoluteRiskFromLogRr(
  _baselineLifetimeRisk: number,
  logRr: number,
): number {
  if (VALIDITY_MODE.ABSOLUTE_RISK === "disabled") {
    return 0;
  }
  const rr = logRelativeRiskToRr(logRr);
  const rBase = Math.min(0.99, Math.max(0.0001, _baselineLifetimeRisk));
  return 1 - Math.pow(1 - rBase, rr);
}

export function resolveBaselineLifetimeRisk(
  cancerType: CancerType,
  profile?: UserProfile,
): number {
  const base = baselineFor(cancerType);
  const sex = profile?.sex;
  const rBase =
    sex === "male"
      ? base.lifetimeRiskMale
      : sex === "female"
        ? base.lifetimeRiskFemale
        : Math.max(base.lifetimeRiskFemale, base.lifetimeRiskMale);

  const props = profile?.ancestryProportions;
  if (props) {
    let mult = 0;
    const map: Record<string, AncestryGroup> = {
      EUR: "european",
      AFR: "african",
      EAS: "asian",
      SAS: "asian",
      AMR: "hispanic",
    };
    for (const [pop, w] of Object.entries(props)) {
      if (!w) continue;
      const g = map[pop];
      if (g) mult += w * (base.ancestryMultipliers[g] ?? 1);
    }
    if (mult > 0) return rBase * mult;
  }

  const ancestry = profile?.ancestry ?? "unknown";
  return rBase * (base.ancestryMultipliers[ancestry] ?? 1);
}
