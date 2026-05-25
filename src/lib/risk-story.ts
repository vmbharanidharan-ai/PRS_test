import type {
  CancerType,
  PopulationCancerRisk,
  PrsComputationResult,
  RiskStory,
  RiskTier,
} from "./types";

const TIER_HEADLINES: Record<RiskTier, string> = {
  low: "Below typical reference distribution",
  average: "Similar to reference distribution",
  moderate: "Somewhat above reference distribution",
  high: "Above reference distribution (upper tail)",
};

export function buildRiskStory(
  cancerLabel: string,
  prs: PrsComputationResult,
  relativeRisk?: number,
): RiskStory {
  const pct =
    prs.percentile != null ? Math.round(prs.percentile) : null;
  const rankOf100 =
    pct != null ? Math.min(100, Math.max(1, pct)) : null;

  const lifetimeFraming =
    prs.referenceCalibrationStatus === "uncalibrated_reference_warning"
      ? "Percentile and Z-score require an ancestry-matched 1000 Genomes reference panel. Relative risk from literature β is not shown without Z."
      : relativeRisk != null
        ? `Compared with the reference distribution, modeled relative risk is approximately ${relativeRisk.toFixed(2)} (literature HR per SD × Z). This is not a personalized lifetime probability.`
        : "Relative risk interpretation requires calibrated Z-score.";

  const populationComparison =
    rankOf100 != null
      ? `Compared with 100 people from the score's reference population, this polygenic pattern ranks about ${rankOf100}th for ${cancerLabel.toLowerCase()} liability.`
      : `Reference percentile unavailable — specify ancestry matching EUR, AFR, or EAS panels.`;

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

function plainMeaningFor(
  cancer: CancerType,
  tier: RiskTier,
  percentile: number | null,
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
    percentile == null
      ? "Reference calibration incomplete — interpret raw PRS with caution."
      : tier === "high"
        ? `At the ${percentile}th percentile, this is a statistical tail signal — context matters; not a diagnosis.`
        : tier === "moderate"
          ? `At the ${percentile}th percentile, moderate signal vs reference — not personalized probability.`
          : `At the ${percentile}th percentile, within typical reference range.`;

  return `${tierNote} ${cancerNote[cancer]} ${base}`;
}

export function buildRiskStoryFromPopulation(pop: PopulationCancerRisk): RiskStory {
  const tier = pop.riskBand;
  return {
    headline: pop.likelihoodLabel,
    lifetimeFraming: `U.S. population baseline lifetime risk for this cancer is on the order of ${pop.populationBaselineLifetimePercent}% (SEER-scale context only). Modeled relative risk ≈ ${pop.relativeRisk.toFixed(2)}. Not from your DNA unless PRS is present.`,
    populationComparison: `Educational demographic model — central percentile estimate ~${pop.centralPercentile}th when PRS absent.`,
    plainMeaning:
      "Population-contextualized risk indicator only — not a diagnosis. Upload DNA for PRS percentile and literature-based relative risk.",
    emphasis:
      tier === "high" ? "attention" : tier === "low" ? "reassuring" : "neutral",
  };
}
