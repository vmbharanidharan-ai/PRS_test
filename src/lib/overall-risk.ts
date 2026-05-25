import type { CancerReport, CancerType, OverallRiskSummary, RiskTier } from "./types";

function tierScore(tier: RiskTier): number {
  switch (tier) {
    case "low":
      return 25;
    case "average":
      return 50;
    case "moderate":
      return 72;
    case "high":
      return 90;
  }
}

function scoreToTier(score: number): RiskTier {
  if (score < 35) return "low";
  if (score < 58) return "average";
  if (score < 78) return "moderate";
  return "high";
}

const OVERALL_LABELS: Record<RiskTier, string> = {
  low: "Below average",
  average: "Average",
  moderate: "Somewhat elevated",
  high: "Elevated",
};

/**
 * Executive risk index: max percentile across cancers (not arithmetic mean).
 * Prevents masking of a single high-liability cancer behind unrelated averages.
 */
export function computeOverallRisk(reports: CancerReport[]): OverallRiskSummary {
  if (reports.length === 0) {
    return {
      tier: "average",
      label: "Average",
      barPercent: 50,
      executiveIndexPercentile: 50,
      summary:
        "Insufficient data to summarize overall inherited cancer risk patterns.",
    };
  }

  let maxPercentile = 0;
  let drivingCancer: CancerType | undefined;
  let maxTier: RiskTier = "low";

  for (const r of reports) {
    const pct =
      r.prs?.percentile ?? r.population.centralPercentile ?? 0;
    const tier = r.prs?.riskTier ?? r.population.riskBand;
    if (pct > maxPercentile) {
      maxPercentile = pct;
      drivingCancer = r.cancerType;
      maxTier = tier;
    } else if (pct === maxPercentile && tierScore(tier) > tierScore(maxTier)) {
      maxTier = tier;
      drivingCancer = r.cancerType;
    }
  }

  const barPercent = Math.round(maxPercentile);
  const tier = scoreToTier(tierScore(maxTier) * 0.5 + maxPercentile * 0.5);

  const driverLabel = drivingCancer
    ? drivingCancer.replace(/^./, (c) => c.toUpperCase())
    : "unknown";

  return {
    tier,
    label: OVERALL_LABELS[tier],
    barPercent,
    executiveIndexPercentile: Math.round(maxPercentile),
    drivingCancer,
    summary: `Executive index uses your highest single-cancer signal (${driverLabel}, ~${Math.round(maxPercentile)}th percentile) — not an average across unrelated cancers.`,
  };
}
