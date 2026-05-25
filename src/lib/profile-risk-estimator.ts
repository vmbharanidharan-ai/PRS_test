import {
  getFamilyHistorySupplements,
  summarizeFamilyHistory,
} from "./family-history";
import { buildAncestryConfidenceForPopulation } from "./ancestry-confidence";
import { GLOBAL_DISCLAIMER, getScreeningRecommendations } from "./guidelines";
import { buildRiskStoryFromPopulation } from "./risk-story";
import { buildScreeningTimelineFromTier } from "./screening-timeline";
import { computeOverallRisk } from "./overall-risk";
import {
  baselineFor,
  CANCER_BASELINES,
} from "./epidemiology-baselines";
import { gailLiteBreastRisk } from "./clinical-models/gail-lite";
import { tyrerCuzickLiteBreastRisk } from "./clinical-models/tyrer-cuzick-lite";
import { premm5LiteColorectalRisk } from "./clinical-models/premm5-lite";
import { buildAbsoluteRiskBreakdown } from "./absolute-risk";
import { inferAncestryFromSelfReport } from "./ancestry-inference";
import { populationFromClinicalModel } from "./population-from-prs";
import type {
  AnalysisResult,
  CancerReport,
  CancerType,
  RiskTier,
  UserProfile,
} from "./types";

function appliesToSex(
  cancer: CancerType,
  sex?: "female" | "male",
): boolean {
  if (!sex) return true;
  if (cancer === "prostate") return sex === "male";
  if (cancer === "breast" || cancer === "ovarian") return sex === "female";
  return true;
}

function tierFromAbsolutePercent(pct: number, baselinePct: number): RiskTier {
  const ratio = pct / Math.max(baselinePct, 0.1);
  if (ratio < 0.85) return "low";
  if (ratio < 1.15) return "average";
  if (ratio < 1.5) return "moderate";
  return "high";
}

function centralPercentileFromTier(tier: RiskTier): number {
  switch (tier) {
    case "low":
      return 25;
    case "average":
      return 50;
    case "moderate":
      return 82;
    case "high":
      return 96;
  }
}

function enrichProfile(profile: UserProfile): UserProfile {
  const inf = inferAncestryFromSelfReport(profile.ancestry);
  return {
    ...profile,
    ancestryProportions: inf.proportions,
    ancestryConfidence: inf.confidence,
    ancestryInferenceMethod: inf.method,
  };
}

function buildProfileCancerReport(
  profile: UserProfile,
  cancer: CancerType,
): CancerReport {
  const enriched = enrichProfile(profile);
  const base = baselineFor(cancer);
  const baselinePct =
    (enriched.sex === "male"
      ? base.lifetimeRiskMale
      : enriched.sex === "female"
        ? base.lifetimeRiskFemale
        : Math.max(base.lifetimeRiskFemale, base.lifetimeRiskMale)) * 100;

  let modelName = "Joint log-risk (clinical prior, no PRS)";
  let clinicalLogPrior = 0;
  const notes: string[] = [
    "Population-based — not from your DNA.",
    "Clinical models are educational approximations — use NCI BCRAT / PREMM5 for clinical care.",
    "Does not detect BRCA1/2 or Lynch pathogenic variants.",
  ];

  if (cancer === "breast" && enriched.sex !== "male") {
    const tc = tyrerCuzickLiteBreastRisk(enriched);
    const gail = gailLiteBreastRisk(enriched);
    const useTc =
      enriched.familyHistory?.breastFirstDegree ||
      enriched.familyHistory?.ovarianFirstDegree;
    const chosen = useTc ? tc : gail;
    clinicalLogPrior = Math.log(Math.max(0.01, chosen.rrClinical));
    modelName = `${chosen.modelName} → log(RR) prior`;
    notes.push(...chosen.notes);
  } else if (cancer === "colorectal") {
    const premm = premm5LiteColorectalRisk(enriched);
    clinicalLogPrior = Math.log(Math.max(0.01, premm.rrClinical));
    modelName = `${premm.modelName} → log(RR) prior`;
    notes.push(...premm.notes);
  }

  const absoluteRisk = buildAbsoluteRiskBreakdown({
    cancerType: cancer,
    profile: enriched,
    clinicalLogPrior,
    clinicalModelLabel: modelName,
    method: modelName,
    includeUncertainty: true,
  });

  const tier = tierFromAbsolutePercent(
    absoluteRisk.absoluteLifetimeRiskPercent,
    baselinePct,
  );
  const central = centralPercentileFromTier(tier);
  const pop = populationFromClinicalModel(
    cancer,
    absoluteRisk.absoluteLifetimeRiskPercent,
    clinicalLogPrior,
    tier,
    modelName,
    central,
    absoluteRisk.uncertainty,
  );

  const options = {
    sex: enriched.sex,
    age: enriched.age,
    familyHistory: enriched.familyHistory,
  };

  const pseudoPrs = {
    pgsId: "clinical-model",
    cancerType: cancer,
    name: modelName,
    rawScore: 0,
    zScore: 0,
    percentile: central,
    riskTier: tier,
    variantsUsed: 0,
    variantsTotal: 0,
    matchRate: 0,
    citation: modelName,
    topContributors: [],
  };

  return {
    cancerType: cancer,
    label: base.label,
    precision: "population",
    population: pop,
    prs: undefined,
    plainLanguageSummary: `${modelName}: ~${absoluteRisk.absoluteLifetimeRiskPercent}% lifetime (95% CI ${absoluteRisk.uncertainty?.ciLow ?? "?"}–${absoluteRisk.uncertainty?.ciHigh ?? "?"}%). Not from DNA.`,
    riskStory: buildRiskStoryFromPopulation(pop),
    timeline: buildScreeningTimelineFromTier(cancer, tier, options),
    ancestryConfidence: buildAncestryConfidenceForPopulation(enriched, pop),
    screening: [
      ...getScreeningRecommendations(cancer, pseudoPrs, options),
      ...getFamilyHistorySupplements(cancer, enriched.familyHistory),
    ],
    limitations: notes,
  };
}

export function runProfileAnalysis(profile: UserProfile): AnalysisResult {
  const reports: CancerReport[] = [];

  for (const base of CANCER_BASELINES) {
    if (!appliesToSex(base.cancerType, profile.sex)) continue;
    reports.push(buildProfileCancerReport(profile, base.cancerType));
  }

  const result: AnalysisResult = {
    analyzedAt: new Date().toISOString(),
    vendor: "unknown",
    variantsInFile: 0,
    reports,
    globalDisclaimer: GLOBAL_DISCLAIMER,
    dataNotStored: true,
    mode: "profile",
    precisionLevel: "population",
    profile: enrichProfile(profile),
    populationDisclaimer:
      "Joint log-risk model with clinical priors (Gail / Tyrer-Cuzick / PREMM5 approximations) — upload DNA for PRS term.",
    overallRisk: computeOverallRisk(reports),
  };

  if (profile.familyHistory?.provided) {
    result.familyHistory = profile.familyHistory;
    result.familyHistorySummary = summarizeFamilyHistory(profile.familyHistory);
  }

  return result;
}
