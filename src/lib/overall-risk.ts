import type { CancerReport, OverallRiskSummary, RiskTier } from "./types";

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

export function computeOverallRisk(reports: CancerReport[]): OverallRiskSummary {
  if (reports.length === 0) {
    return {
      tier: "average",
      label: "Average",
      barPercent: 50,
      summary:
        "Insufficient data to summarize overall inherited cancer risk patterns.",
    };
  }

  const scores = reports.map((r) => {
    const tier = r.prs?.riskTier ?? r.population.riskBand;
    const pct = r.prs?.percentile ?? r.population.centralPercentile;
    return tierScore(tier) * 0.6 + pct * 0.4;
  });

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const tier = scoreToTier(avg);

  return {
    tier,
    label: OVERALL_LABELS[tier],
    barPercent: Math.round(avg),
    summary: `Across ${reports.length} cancer types in this report, your overall inherited risk pattern is ${OVERALL_LABELS[tier].toLowerCase()} compared with reference population models.`,
  };
}
