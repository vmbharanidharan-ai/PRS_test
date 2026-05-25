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
import { computeOverallRisk } from "./overall-risk";
import { populationFromPrs } from "./population-from-prs";
import { computePrsForScore, validateMatchRate } from "./prs-calculator";
import { getActivePrsScores } from "./prs-registry";
import { buildRiskStory } from "./risk-story";
import { buildScreeningTimeline } from "./screening-timeline";
import type { FamilyHistoryInput, UserGenotype } from "./types";

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
  return `Your personal polygenic score for ${CANCER_LABELS[prs.cancerType]} is ${tier}. You rank about the ${prs.percentile.toFixed(0)}th percentile in the reference population (${matchPct}% variant match).`;
}

function limitationsFor(prs: PrsComputationResult): string[] {
  const limits = [
    "Personal polygenic score from your DNA — common variants only, not BRCA/Lynch.",
    "Reference populations are primarily European-ancestry; accuracy may differ.",
    "Educational only — not medical guidance or a diagnosis.",
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
  const population = populationFromPrs(prs, true);

  return {
    cancerType: prs.cancerType,
    label: CANCER_LABELS[prs.cancerType],
    precision: "genetic",
    population,
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
    mode?: "dna" | "demo" | "shared";
  },
): AnalysisResult {
  const scores = getActivePrsScores();
  const reports: CancerReport[] = [];

  for (const definition of scores) {
    const prs = computePrsForScore(definition, genotypes);
    reports.push(buildCancerReport(prs, options));
  }

  const mode = options.mode ?? "dna";
  const result: AnalysisResult = {
    analyzedAt: new Date().toISOString(),
    vendor: options.vendor,
    variantsInFile: options.variantCount,
    reports,
    globalDisclaimer: GLOBAL_DISCLAIMER,
    dataNotStored: true,
    mode,
    precisionLevel: mode === "demo" ? "demo" : "genetic",
    overallRisk: computeOverallRisk(reports),
  };

  if (options.familyHistory?.provided) {
    result.familyHistory = options.familyHistory;
    result.familyHistorySummary = summarizeFamilyHistory(options.familyHistory);
  }

  return result;
}

export { runProfileAnalysis } from "./profile-risk-estimator";
