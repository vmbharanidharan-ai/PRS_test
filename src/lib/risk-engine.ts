/**
 * Unified risk engine facade — preserves report API contracts.
 *
 * Priority:
 * 1. UK Biobank Cox coefficients (public/models/{cancer}_cox.json)
 * 2. Legacy joint-risk-model (hand-tuned log-linear)
 *
 * log(RR) = Σ β·x  then  P = 1 − (1 − R_base)^RR
 */

import {
  absoluteRiskFromLogRr,
  computeLogRelativeRisk,
  logRelativeRiskToRr,
  resolveBaselineLifetimeRisk,
  type JointRiskInput,
} from "./joint-risk-model";
import { loadCoefficientsSync, type CoxModelCoefficients } from "./cox-coefficients";
import { bootstrapAbsoluteRiskUncertainty } from "./uncertainty";
import type { AbsoluteRiskBreakdown, FamilyHistoryInput, UserProfile } from "./types";
import type { CancerType } from "./types";

export type { JointRiskInput };

export function absoluteLifetimeRisk(
  baselineLifetimeRisk: number,
  logRr: number,
): number {
  return absoluteRiskFromLogRr(baselineLifetimeRisk, logRr);
}

export function rrFromPrsZ(z: number, relativeRiskPerSd: number): number {
  return Math.exp(z * Math.log(relativeRiskPerSd));
}

function encodeFhFeatures(
  cancer: CancerType,
  fh?: FamilyHistoryInput,
): Record<string, number> {
  const x: Record<string, number> = {};
  if (!fh?.provided) return x;
  if (fh.breastFirstDegree) x.fh_breast_first_degree = 1;
  if (fh.colorectalFirstDegree) x.fh_colorectal_first_degree = 1;
  if (fh.prostateFirstDegree) x.fh_prostate_first_degree = 1;
  if (fh.ovarianFirstDegree) x.fh_ovarian_first_degree = 1;
  if (fh.lynchSyndromeConcern) x.fh_lynch = 1;
  return x;
}

function logRrFromCox(
  cox: CoxModelCoefficients,
  features: Record<string, number>,
): { logRr: number; components: Record<string, number> } {
  const components: Record<string, number> = {};
  let logRr = 0;
  for (const [name, beta] of Object.entries(cox.coefficients)) {
    const v = features[name] ?? 0;
    const term = beta * v;
    if (term !== 0) components[name] = term;
    logRr += term;
  }
  return { logRr, components };
}

function buildFeatureVector(
  input: JointRiskInput,
  cox: CoxModelCoefficients,
): Record<string, number> {
  const features: Record<string, number> = {
    ...encodeFhFeatures(input.cancerType, input.profile?.familyHistory),
  };
  if (input.profile?.age != null) {
    features.age = input.profile.age - 50;
  }
  if (input.zScore !== undefined) {
    features.prs = input.zScore;
  }
  if (input.clinicalLogPrior !== undefined) {
    features.clinical_prior = input.clinicalLogPrior;
  }
  const pcs = input.profile?.ancestryPcs;
  if (pcs) {
    for (let i = 0; i < Math.min(pcs.length, 10); i++) {
      features[`pc${i + 1}`] = pcs[i];
    }
  }
  return features;
}

export function buildAbsoluteRiskBreakdown(
  input: JointRiskInput & { method?: string; includeUncertainty?: boolean },
): AbsoluteRiskBreakdown {
  const cox = loadCoefficientsSync(input.cancerType);
  const methodLabel =
    input.method ??
    (cox ? `Cox model (${cox.version})` : "Joint log-risk (legacy fallback)");

  let logRelativeRisk: number;
  let logComponents: AbsoluteRiskBreakdown["logComponents"];
  let baselineLifetimeRisk: number;

  if (cox && !input.clinicalLogPrior) {
    const features = buildFeatureVector(input, cox);
    const { logRr, components } = logRrFromCox(cox, features);
    logRelativeRisk = logRr;
    logComponents = {
      prs: components.prs ?? 0,
      familyHistory:
        (components.fh_breast_first_degree ?? 0) +
        (components.fh_colorectal_first_degree ?? 0) +
        (components.fh_prostate_first_degree ?? 0) +
        (components.fh_lynch ?? 0),
      age: components.age ?? 0,
      ancestry: (components.pc1 ?? 0) + (components.pc2 ?? 0),
      clinicalPrior: components.clinical_prior ?? 0,
    };
    baselineLifetimeRisk = cox.baseline_lifetime_risk;
  } else {
    const legacy = computeLogRelativeRisk(input);
    logRelativeRisk = legacy.total;
    logComponents = {
      prs: legacy.prs,
      familyHistory: legacy.familyHistory,
      age: legacy.age,
      ancestry: legacy.ancestry,
      clinicalPrior: legacy.clinicalPrior,
    };
    baselineLifetimeRisk = resolveBaselineLifetimeRisk(
      input.cancerType,
      input.profile,
    );
  }

  const rrTotal = logRelativeRiskToRr(logRelativeRisk);
  const absoluteLifetimeRisk = absoluteRiskFromLogRr(
    baselineLifetimeRisk,
    logRelativeRisk,
  );

  const uncertainty =
    input.includeUncertainty !== false
      ? bootstrapAbsoluteRiskUncertainty(input)
      : undefined;

  return {
    cancerType: input.cancerType,
    baselineLifetimeRisk,
    rrTotal,
    logRelativeRisk,
    logComponents,
    absoluteLifetimeRisk,
    absoluteLifetimeRiskPercent:
      uncertainty?.lifetimeRiskPercent ??
      Math.round(absoluteLifetimeRisk * 1000) / 10,
    uncertainty,
    method: methodLabel,
  };
}
