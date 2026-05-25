import type { RiskTier } from "./types";

/** Standard normal CDF approximation */
export function zScoreToPercentile(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  const cdf = z >= 0 ? 1 - p : p;
  return Math.round(cdf * 1000) / 10;
}

export function percentileToRiskTier(percentile: number): RiskTier {
  if (percentile < 20) return "low";
  if (percentile < 80) return "average";
  if (percentile < 95) return "moderate";
  return "high";
}

export function validateMatchRate(
  matchRate: number,
  minRate = 0.5,
): string | null {
  if (matchRate < minRate) {
    return `Only ${Math.round(matchRate * 100)}% of PRS variants were found in your file. Results may be unreliable. Consider re-downloading your raw data.`;
  }
  return null;
}
