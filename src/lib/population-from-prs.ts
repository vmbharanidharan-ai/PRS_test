import { buildAbsoluteRiskBreakdown } from "./absolute-risk";
import { clinicalRelativeRisk } from "./clinical-risk";
import { baselineFor } from "./epidemiology-baselines";
import type {
  CancerType,
  PopulationCancerRisk,
  PrsComputationResult,
  RiskTier,
  UserProfile,
} from "./types";

const LIKELIHOOD: Record<RiskTier, string> = {
  low: "Lower likelihood than typical",
  average: "Typical range for people like you",
  moderate: "Moderately elevated likelihood",
  high: "Higher likelihood than typical",
};

export function populationFromPrs(
  prs: PrsComputationResult,
  genetic: boolean,
  profile?: UserProfile,
): PopulationCancerRisk {
  const base = baselineFor(prs.cancerType);
  const pct = Math.round(prs.percentile);
  const spread = genetic ? 8 : 15;

  const rrClinical = clinicalRelativeRisk(prs.cancerType, profile?.familyHistory);
  const absoluteRisk = buildAbsoluteRiskBreakdown({
    cancerType: prs.cancerType,
    zScore: prs.zScore,
    rrClinical,
    profile,
    method: genetic
      ? "Chatterjee joint model: P = 1 − (1 − R_base)^(RR_clinical × RR_PRS)"
      : "Population prior",
  });

  return {
    cancerType: prs.cancerType,
    label: base.label,
    lifetimeRiskPercent: absoluteRisk.absoluteLifetimeRiskPercent,
    riskBand: prs.riskTier,
    percentileLow: Math.max(1, pct - spread),
    percentileHigh: Math.min(99, pct + spread),
    centralPercentile: pct,
    likelihoodLabel: LIKELIHOOD[prs.riskTier],
    confidenceLevel: genetic ? (prs.matchRate >= 0.8 ? "high" : "moderate") : "low",
    isPopulationEstimate: !genetic,
    whatWouldShift: genetic
      ? [
          "Calibrated absolute risk uses SEER baseline + PRS Z-score (Lewis et al., 2021)",
          "Clinical genetic testing for rare mutations is separate",
        ]
      : [
          "Upload raw DNA for true polygenic scoring",
          "Add family history for conditional estimates",
        ],
    absoluteRisk,
  };
}

export function populationFromClinicalModel(
  cancerType: CancerType,
  absolutePercent: number,
  rrClinical: number,
  tier: RiskTier,
  modelName: string,
  centralPercentile: number,
): PopulationCancerRisk {
  const base = baselineFor(cancerType);
  const spread = 12;

  return {
    cancerType,
    label: base.label,
    lifetimeRiskPercent: absolutePercent,
    riskBand: tier,
    percentileLow: Math.max(5, centralPercentile - spread),
    percentileHigh: Math.min(95, centralPercentile + spread),
    centralPercentile,
    likelihoodLabel: LIKELIHOOD[tier],
    confidenceLevel: "moderate",
    isPopulationEstimate: true,
    clinicalModel: modelName,
    whatWouldShift: [
      "Upload DNA for polygenic calibration (Chatterjee joint model)",
      "Clinical germline testing where guidelines recommend",
    ],
    absoluteRisk: {
      baselineLifetimeRisk: Math.max(base.lifetimeRiskFemale, base.lifetimeRiskMale),
      rrPrs: 1,
      rrClinical,
      rrTotal: rrClinical,
      absoluteLifetimeRisk: absolutePercent / 100,
      absoluteLifetimeRiskPercent: absolutePercent,
      method: modelName,
    },
  };
}
