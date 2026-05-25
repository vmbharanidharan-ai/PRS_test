import type {
  AnalysisResult,
  CancerReport,
  CancerType,
  GenotypeVendor,
  PrsComputationResult,
} from "./types";
import { buildAncestryConfidence } from "./ancestry-confidence";
import { getFamilyHistorySupplements, summarizeFamilyHistory } from "./family-history";
import { GLOBAL_DISCLAIMER, getScreeningRecommendations } from "./guidelines";
import { buildRiskStory } from "./risk-story";
import { buildScreeningTimeline } from "./screening-timeline";
import type { FamilyHistoryInput } from "./types";
import { computePrsForScore, validateMatchRate } from "./prs-calculator";
import { getActivePrsScores } from "./prs-registry";
import type { UserGenotype } from "./types";

const CANCER_LABELS: Record<CancerType, string> = {
  breast: "Breast cancer",
  colorectal: "Colorectal cancer",
  prostate: "Prostate cancer",
  ovarian: "Ovarian cancer",
};

function plainLanguageSummary(prs: PrsComputationResult): string {
  const tierPhrases: Record<string, string> = {
    low: "lower than most people",
    average: "similar to most people in the reference population",
    moderate: "somewhat higher than most people",
    high: "higher than most people (top ~5% of the reference group)",
  };

  const tier = tierPhrases[prs.riskTier] ?? "within the population range";
  const matchPct = Math.round(prs.matchRate * 100);

  return `Your polygenic risk score for ${CANCER_LABELS[prs.cancerType]} is ${tier}. You are at approximately the ${prs.percentile.toFixed(0)}th percentile compared to the ${prs.name} reference population. This score used ${prs.variantsUsed} of ${prs.variantsTotal} known variants (${matchPct}% match) from your genotype file.`;
}

function limitationsFor(prs: PrsComputationResult): string[] {
  const limits = [
    "Polygenic scores reflect common variant burden, not rare pathogenic mutations.",
    "Reference populations are primarily European-ancestry; accuracy may differ for other ancestries.",
    "Screening guidelines in this report are general; your clinician may recommend different actions based on family history and personal factors.",
  ];

  const matchWarning = validateMatchRate(prs);
  if (matchWarning) limits.unshift(matchWarning);

  return limits;
}

function buildCancerReport(
  prs: PrsComputationResult,
  options?: {
    sex?: "female" | "male";
    age?: number;
    familyHistory?: FamilyHistoryInput;
  },
): CancerReport {
  const base = getScreeningRecommendations(prs.cancerType, prs, options);
  const fhExtra = getFamilyHistorySupplements(prs.cancerType, options?.familyHistory);

  return {
    cancerType: prs.cancerType,
    label: CANCER_LABELS[prs.cancerType],
    prs,
    plainLanguageSummary: plainLanguageSummary(prs),
    riskStory: buildRiskStory(CANCER_LABELS[prs.cancerType], prs),
    timeline: buildScreeningTimeline(prs.cancerType, prs, options),
    ancestryConfidence: buildAncestryConfidence(prs),
    screening: [...base, ...fhExtra],
    limitations: limitationsFor(prs),
  };
}

export function runAnalysis(
  genotypes: Map<string, UserGenotype>,
  options: {
    vendor: GenotypeVendor;
    variantCount: number;
    sex?: "female" | "male";
    age?: number;
    familyHistory?: FamilyHistoryInput;
    mode?: "personal" | "demo" | "shared";
  },
): AnalysisResult {
  const scores = getActivePrsScores();
  const reports: CancerReport[] = [];

  for (const definition of scores) {
    const prs = computePrsForScore(definition, genotypes);
    reports.push(buildCancerReport(prs, options));
  }

  const result: AnalysisResult = {
    analyzedAt: new Date().toISOString(),
    vendor: options.vendor,
    variantsInFile: options.variantCount,
    reports,
    globalDisclaimer: GLOBAL_DISCLAIMER,
    dataNotStored: true,
    mode: options.mode ?? "personal",
  };

  if (options.familyHistory?.provided) {
    result.familyHistory = options.familyHistory;
    result.familyHistorySummary = summarizeFamilyHistory(options.familyHistory);
  }

  return result;
}
