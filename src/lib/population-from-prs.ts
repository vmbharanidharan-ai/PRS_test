import { buildRiskInterpretation } from "./absolute-risk";
import { inferAncestryFromSelfReport } from "./ancestry-inference";
import { baselineFor } from "./epidemiology-baselines";
import { VALIDITY_DISCLAIMERS } from "./validity-config";
import type {
  CancerType,
  PopulationCancerRisk,
  PrsComputationResult,
  RiskTier,
  UserProfile,
} from "./types";

const LIKELIHOOD: Record<RiskTier, string> = {
  low: "Lower than typical reference distribution",
  average: "Typical range vs reference distribution",
  moderate: "Somewhat above reference distribution",
  high: "Above reference distribution (upper tail)",
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
  const pct = prs.percentile != null ? Math.round(prs.percentile) : null;
  const spread = genetic ? 8 : 15;
  const enriched = profileWithAncestry(profile);

  const interpretation = buildRiskInterpretation({
    cancerType: prs.cancerType,
    zScore: prs.zScore ?? undefined,
    matchRate: prs.matchRate,
    profile: enriched,
    referencePopulation: prs.referencePopulation,
    referenceCalibrationStatus: prs.referenceCalibrationStatus,
    referenceWarnings: prs.referenceWarnings,
    method: genetic
      ? "Three-layer: PGS → 1KG Z → literature RR (absolute risk disabled)"
      : "Population prior",
    includeUncertainty: true,
  });

  const u = interpretation.uncertainty;
  const popBaseline = interpretation.populationBaselineLifetimePercent;

  return {
    cancerType: prs.cancerType,
    label: base.label,
    relativeRisk: interpretation.relativeRisk,
    populationBaselineLifetimePercent: popBaseline,
    lifetimeRiskPercent: popBaseline,
    riskBand: prs.riskTier,
    percentileLow: pct != null ? Math.max(1, pct - spread) : 0,
    percentileHigh: pct != null ? Math.min(99, pct + spread) : 0,
    centralPercentile: pct ?? 0,
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
    referenceCalibrationStatus: prs.referenceCalibrationStatus,
    referenceWarnings: prs.referenceWarnings,
    whatWouldShift: genetic
      ? [
          VALIDITY_DISCLAIMERS.relativeRiskOnly,
          VALIDITY_DISCLAIMERS.populationBaselineOnly,
          prs.referenceCalibrationStatus === "uncalibrated_reference_warning"
            ? VALIDITY_DISCLAIMERS.uncalibratedReference
            : "1000G panel used for Z normalization only",
        ]
      : [
          "Upload raw DNA for polygenic scoring",
          "Specify ancestry matching a 1000G reference panel",
        ],
    absoluteRisk: interpretation,
    uncertainty: u,
  };
}

export function populationFromClinicalModel(
  cancerType: CancerType,
  _absolutePercent: number,
  logPrior: number,
  tier: RiskTier,
  modelName: string,
  centralPercentile: number,
  uncertainty?: import("./types").RiskUncertainty,
): PopulationCancerRisk {
  const base = baselineFor(cancerType);
  const spread = 12;
  const rr = Math.exp(logPrior);
  const popBaseline =
    Math.round(
      Math.max(base.lifetimeRiskFemale, base.lifetimeRiskMale) * 1000,
    ) / 10;

  return {
    cancerType,
    label: base.label,
    relativeRisk: Math.round(rr * 100) / 100,
    populationBaselineLifetimePercent: popBaseline,
    lifetimeRiskPercent: popBaseline,
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
      "Upload DNA for PRS + literature RR",
      "Not comparable to certified Gail/PREMM5 outputs",
    ],
    absoluteRisk: {
      baselineLifetimeRisk: Math.max(
        base.lifetimeRiskFemale,
        base.lifetimeRiskMale,
      ),
      rrTotal: rr,
      relativeRisk: rr,
      logRelativeRisk: logPrior,
      populationBaselineLifetimePercent: popBaseline,
      absoluteLifetimeRisk: 0,
      absoluteLifetimeRiskPercent: popBaseline,
      uncertainty,
      method: modelName,
      outputMode: "relative_risk_only",
      absoluteRiskDisabled: true,
      validityNote: VALIDITY_DISCLAIMERS.notPersonalizedProbability,
    },
  };
}
