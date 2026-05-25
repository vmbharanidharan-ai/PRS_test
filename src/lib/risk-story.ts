import type {
  CancerType,
  PrsComputationResult,
  RiskStory,
  RiskTier,
} from "./types";

const TIER_HEADLINES: Record<RiskTier, string> = {
  low: "Below typical population levels",
  average: "Similar to most people",
  moderate: "Somewhat above typical levels",
  high: "Higher than most people in the reference group",
};

export function buildRiskStory(
  cancerLabel: string,
  prs: PrsComputationResult,
): RiskStory {
  const pct = Math.round(prs.percentile);
  const rankOf100 = Math.min(100, Math.max(1, pct));

  const lifetimeFraming = lifetimePhrase(prs.riskTier);
  const populationComparison = `Compared with 100 people from the score's reference population, your polygenic pattern ranks about ${rankOf100}th for ${cancerLabel.toLowerCase()} risk.`;

  const plainMeaning = plainMeaningFor(prs.cancerType, prs.riskTier, pct);

  return {
    headline: TIER_HEADLINES[prs.riskTier],
    lifetimeFraming,
    populationComparison,
    plainMeaning,
    emphasis:
      prs.riskTier === "high"
        ? "attention"
        : prs.riskTier === "low"
          ? "reassuring"
          : "neutral",
  };
}

function lifetimePhrase(tier: RiskTier): string {
  switch (tier) {
    case "low":
      return "Your polygenic pattern suggests a lifetime risk estimate that is slightly below average for this reference group.";
    case "average":
      return "Your polygenic pattern suggests a lifetime risk estimate that is around average for this reference group.";
    case "moderate":
      return "Your polygenic pattern suggests a lifetime risk estimate that is somewhat above average for this reference group.";
    case "high":
      return "Your polygenic pattern suggests a lifetime risk estimate that is higher than most people in this reference group (not a diagnosis).";
  }
}

function plainMeaningFor(
  cancer: CancerType,
  tier: RiskTier,
  percentile: number,
): string {
  const base =
    "This reflects common DNA variants together — not a single gene test and not a cancer diagnosis.";

  const cancerNote: Record<CancerType, string> = {
    breast:
      "Many factors (family history, lifestyle, rare genes) also matter for breast cancer.",
    colorectal:
      "Colon cancer risk is strongly influenced by screening, family history, and age.",
    prostate:
      "Prostate cancer risk varies with age, ancestry, and family history beyond PRS.",
    ovarian:
      "Ovarian cancer PRS is less actionable alone; family history and BRCA testing matter more clinically.",
  };

  const tierNote =
    tier === "high"
      ? `At the ${percentile}th percentile, this is worth discussing with a clinician in context — not acting on alone.`
      : tier === "moderate"
        ? `At the ${percentile}th percentile, this is a moderate statistical signal — context matters.`
        : `At the ${percentile}th percentile, this is within a typical range for the reference population.`;

  return `${tierNote} ${cancerNote[cancer]} ${base}`;
}
