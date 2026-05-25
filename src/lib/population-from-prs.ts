import { buildAbsoluteRiskBreakdown } from "./absolute-risk";
import { inferAncestryFromSelfReport } from "./ancestry-inference";
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

function profileWithAncestry(profile?: UserProfile): UserProfile | undefined {
  if (!profile) return undefined;
  if (profile.ancestryProportions) return profile;
  const inf = inferAncestryFromSelfReport(profile.ancestry);
  return {
    ...profile,
    ancestryProportions: inf.proportions,
    ancestryConfidence: inf.confidence,
    ancestryInferenceMethod: inf.method,
  };
}

export function populationFromPrs(
  prs: PrsComputationResult,
  genetic: boolean,
  profile?: UserProfile,
): PopulationCancerRisk {
  const base = baselineFor(prs.cancerType);
  const pct = Math.round(prs.percentile);
  const spread = genetic ? 8 : 15;
  const enriched = profileWithAncestry(profile);

  const absoluteRisk = buildAbsoluteRiskBreakdown({
    cancerType: prs.cancerType,
    zScore: prs.zScore,
    matchRate: prs.matchRate,
    profile: enriched,
    method: genetic
      ? "Log-linear joint model: log(RR)=β·Z+FH+age+ancestry; P=1−(1−R_base)^RR"
      : "Population prior",
    includeUncertainty: true,
  });

  const u = absoluteRisk.uncertainty;

  return {
    cancerType: prs.cancerType,
    label: base.label,
    lifetimeRiskPercent: absoluteRisk.absoluteLifetimeRiskPercent,
    riskBand: prs.riskTier,
    percentileLow: Math.max(1, pct - spread),
    percentileHigh: Math.min(99, pct + spread),
    centralPercentile: pct,
    likelihoodLabel: LIKELIHOOD[prs.riskTier],
    confidenceLevel: u
      ? u.confidenceScore >= 0.75
        ? "high"
        : u.confidenceScore >= 0.5
          ? "moderate"
          : "low"
      : genetic
        ? prs.matchRate >= 0.8
          ? "high"
          : "moderate"
        : "low",
    isPopulationEstimate: !genetic,
    whatWouldShift: genetic
      ? [
          "Joint log-risk model (not multiplicative RR stacking)",
          "Genetic PCA on 1000 Genomes improves ancestry weighting",
          "Clinical germline testing is separate from PRS",
        ]
      : [
          "Upload raw DNA for polygenic scoring",
          "Add family history for joint log-risk terms",
        ],
    absoluteRisk,
    uncertainty: u,
  };
}

export function populationFromClinicalModel(
  cancerType: CancerType,
  absolutePercent: number,
  logPrior: number,
  tier: RiskTier,
  modelName: string,
  centralPercentile: number,
  uncertainty?: import("./types").RiskUncertainty,
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
    uncertainty,
    whatWouldShift: [
      "Upload DNA for PRS term in joint log-risk model",
      "Certified Gail/PREMM5 tools for clinical decisions",
    ],
    absoluteRisk: {
      baselineLifetimeRisk: Math.max(
        base.lifetimeRiskFemale,
        base.lifetimeRiskMale,
      ),
      rrTotal: Math.exp(logPrior),
      logRelativeRisk: logPrior,
      absoluteLifetimeRisk: absolutePercent / 100,
      absoluteLifetimeRiskPercent: absolutePercent,
      uncertainty,
      method: modelName,
    },
  };
}
