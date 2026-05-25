/**
 * Joint epidemiological absolute risk (Chatterjee et al., 2016; Lewis et al., 2021).
 *
 * P(Disease) = 1 - (1 - R_base)^RR_total
 * RR_total = RR_clinical × RR_prs
 * RR_prs = exp(Z × ln(relativeRiskPerSd))
 */

import type {
  AbsoluteRiskBreakdown,
  CancerType,
  UserProfile,
} from "./types";
import { baselineFor } from "./epidemiology-baselines";

export type { AbsoluteRiskBreakdown };

export function rrFromPrsZ(z: number, relativeRiskPerSd: number): number {
  if (relativeRiskPerSd <= 0) return 1;
  return Math.exp(z * Math.log(relativeRiskPerSd));
}

export function absoluteLifetimeRisk(
  baselineLifetimeRisk: number,
  rrTotal: number,
): number {
  const rBase = clamp(baselineLifetimeRisk, 0.0001, 0.99);
  const rr = Math.max(0.01, rrTotal);
  return 1 - Math.pow(1 - rBase, rr);
}

export function buildAbsoluteRiskBreakdown(params: {
  cancerType: CancerType;
  zScore?: number;
  rrClinical: number;
  profile?: UserProfile;
  method: string;
}): AbsoluteRiskBreakdown {
  const base = baselineFor(params.cancerType);
  const sex = params.profile?.sex;
  const rBase =
    sex === "male"
      ? base.lifetimeRiskMale
      : sex === "female"
        ? base.lifetimeRiskFemale
        : Math.max(base.lifetimeRiskFemale, base.lifetimeRiskMale);

  const ancestry = params.profile?.ancestry ?? "unknown";
  const ancestryAdj = base.ancestryMultipliers[ancestry] ?? 1;
  const baselineLifetimeRisk = rBase * ancestryAdj;

  const rrPrs =
    params.zScore !== undefined
      ? rrFromPrsZ(params.zScore, base.hazardRatioPerSd)
      : 1;

  const rrClinical = Math.max(0.01, params.rrClinical);
  const rrTotal = rrClinical * rrPrs;
  const absolute = absoluteLifetimeRisk(baselineLifetimeRisk, rrTotal);

  return {
    cancerType: params.cancerType as CancerType,
    baselineLifetimeRisk,
    rrPrs,
    rrClinical,
    rrTotal,
    absoluteLifetimeRisk: absolute,
    absoluteLifetimeRiskPercent: Math.round(absolute * 1000) / 10,
    method: params.method,
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
