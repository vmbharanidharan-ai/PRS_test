import { baselineFor } from "./epidemiology-baselines";
import type {
  CancerType,
  PopulationCancerRisk,
  PrsComputationResult,
  RiskTier,
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
): PopulationCancerRisk {
  const base = baselineFor(prs.cancerType);
  const baseRisk = Math.max(base.lifetimeRiskFemale, base.lifetimeRiskMale) * 100;
  const pct = Math.round(prs.percentile);
  const spread = genetic ? 8 : 15;

  return {
    cancerType: prs.cancerType,
    label: base.label,
    lifetimeRiskPercent: Math.round(baseRisk * 10) / 10,
    riskBand: prs.riskTier,
    percentileLow: Math.max(1, pct - spread),
    percentileHigh: Math.min(99, pct + spread),
    centralPercentile: pct,
    likelihoodLabel: LIKELIHOOD[prs.riskTier],
    confidenceLevel: genetic ? (prs.matchRate >= 0.8 ? "high" : "moderate") : "low",
    isPopulationEstimate: !genetic,
    whatWouldShift: genetic
      ? [
          "Results already use your DNA — highest precision in this app",
          "Clinical genetic testing for rare mutations is separate",
        ]
      : [
          "Upload raw DNA for true polygenic scoring",
          "Add family history for conditional estimates",
        ],
  };
}
