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
import {
  computePrsForScore,
  validateMatchRateResult,
} from "./prs-calculator";
import { getActivePrsScores } from "./prs-registry";
import { buildRiskStory } from "./risk-story";
import { buildScreeningTimeline } from "./screening-timeline";
import { screenPathogenicVariants } from "./pathogenic-screen";
import type { FamilyHistoryInput, UserGenotype, UserProfile } from "./types";

const CANCER_LABELS: Record<CancerType, string> = {
  breast: "Breast cancer",
  colorectal: "Colorectal cancer",
  prostate: "Prostate cancer",
  ovarian: "Ovarian cancer",
};

function plainLanguageSummary(prs: PrsComputationResult, popPct: number): string {
  const tierPhrases: Record<string, string> = {
    low: "lower than most people",
    average: "similar to most people in the reference population",
    moderate: "somewhat higher than most people",
    high: "higher than most people (top ~5% of the reference group)",
  };
  const tier = tierPhrases[prs.riskTier] ?? "within the population range";
  const matchPct = Math.round(prs.matchRate * 100);
  return `Your polygenic score ranks about the ${prs.percentile.toFixed(0)}th percentile (${tier}). Calibrated absolute lifetime risk ~${popPct}% (Chatterjee joint model). ${matchPct}% variant match.`;
}

function limitationsFor(prs: PrsComputationResult): string[] {
  const limits = [
    "Personal polygenic score from your DNA — common variants only, not BRCA/Lynch unless flagged in pathogenic screen.",
    prs.calibrationMethod === "legacy_hwe"
      ? "Warning: empirical reference panel missing — using legacy HWE fallback."
      : `Percentile empirically ranked within ${prs.referencePopulation ?? "reference"} panel (${prs.calibrationMethod}).`,
    "Educational only — not medical guidance or a diagnosis.",
  ];
  const matchWarning = validateMatchRateResult(prs);
  if (matchWarning) limits.unshift(matchWarning);
  return limits;
}

function buildCancerReport(
  prs: PrsComputationResult,
  options?: {
    sex?: "female" | "male";
    age?: number;
    familyHistory?: FamilyHistoryInput;
    profile?: UserProfile;
  },
): CancerReport {
  const profile: UserProfile = {
    sex: options?.sex,
    age: options?.age,
    familyHistory: options?.familyHistory,
  };
  const population = populationFromPrs(prs, true, profile);
  const base = getScreeningRecommendations(prs.cancerType, prs, options);
  const fhExtra = getFamilyHistorySupplements(prs.cancerType, options?.familyHistory);

  return {
    cancerType: prs.cancerType,
    label: CANCER_LABELS[prs.cancerType],
    precision: "genetic",
    population,
    prs,
    plainLanguageSummary: plainLanguageSummary(
      prs,
      population.lifetimeRiskPercent,
    ),
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
    ancestry?: UserProfile["ancestry"];
    ancestryConfidence?: number;
    familyHistory?: FamilyHistoryInput;
    mode?: "dna" | "demo" | "shared";
  },
): AnalysisResult {
  const pathogenicScreen = screenPathogenicVariants(genotypes);

  const scores = getActivePrsScores();
  const reports: CancerReport[] = [];

  if (!pathogenicScreen.blocksPrsInterpretation) {
    for (const definition of scores) {
      const prs = computePrsForScore(definition, genotypes, {
        ancestry: options.ancestry,
        ancestryConfidence:
          options.ancestryConfidence ?? (options.ancestry ? 0.85 : 0.5),
      });
      reports.push(
        buildCancerReport(prs, {
          ...options,
          profile: {
            sex: options.sex,
            age: options.age,
            familyHistory: options.familyHistory,
            ancestry: options.ancestry,
          },
        }),
      );
    }
  }

  const mode = options.mode ?? "dna";
  const overallRisk =
    reports.length > 0
      ? computeOverallRisk(reports)
      : pathogenicScreen.blocksPrsInterpretation
        ? {
            tier: "high" as const,
            label: "Clinical follow-up required",
            barPercent: 95,
            executiveIndexPercentile: 95,
            summary:
              "Pathogenic or high-penetrance variant signal detected. Polygenic reports withheld — seek genetic counseling.",
          }
        : computeOverallRisk(reports);

  const result: AnalysisResult = {
    analyzedAt: new Date().toISOString(),
    vendor: options.vendor,
    variantsInFile: options.variantCount,
    reports,
    globalDisclaimer: GLOBAL_DISCLAIMER,
    dataNotStored: true,
    mode,
    precisionLevel: mode === "demo" ? "demo" : "genetic",
    overallRisk,
    pathogenicScreen,
  };

  if (options.familyHistory?.provided) {
    result.familyHistory = options.familyHistory;
    result.familyHistorySummary = summarizeFamilyHistory(options.familyHistory);
  }

  return result;
}

export { runProfileAnalysis } from "./profile-risk-estimator";
