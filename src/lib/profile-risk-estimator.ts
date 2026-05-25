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
import { clinicalRelativeRisk } from "./clinical-risk";
import { populationFromClinicalModel } from "./population-from-prs";
import type {
  AnalysisResult,
  CancerReport,
  CancerType,
  FamilyHistoryInput,
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

function buildProfileCancerReport(
  profile: UserProfile,
  cancer: CancerType,
): CancerReport {
  const base = baselineFor(cancer);
  const baselinePct =
    (profile.sex === "male"
      ? base.lifetimeRiskMale
      : profile.sex === "female"
        ? base.lifetimeRiskFemale
        : Math.max(base.lifetimeRiskFemale, base.lifetimeRiskMale)) * 100;

  let modelName = "Chatterjee clinical RR (no DNA)";
  let absolutePercent: number;
  let rrClinical: number;
  let notes: string[] = [
    "Population-based clinical model — not from your DNA.",
    "Does not detect BRCA1/2, Lynch syndrome, or other pathogenic variants.",
  ];

  if (cancer === "breast" && profile.sex !== "male") {
    const tc = tyrerCuzickLiteBreastRisk(profile);
    const gail = gailLiteBreastRisk(profile);
    const useTc =
      (profile.familyHistory?.breastFirstDegree ||
        profile.familyHistory?.ovarianFirstDegree) ??
      false;
    const chosen = useTc ? tc : gail;
    absolutePercent = chosen.absoluteLifetimeRiskPercent;
    rrClinical = chosen.rrClinical;
    modelName = chosen.modelName;
    notes = [...chosen.notes, ...notes];
  } else if (cancer === "colorectal") {
    const premm = premm5LiteColorectalRisk(profile);
    absolutePercent = premm.absoluteLifetimeRiskPercent;
    rrClinical = premm.rrClinical;
    modelName = premm.modelName;
    notes = [...premm.notes, ...notes];
  } else {
    rrClinical = clinicalRelativeRisk(cancer, profile.familyHistory);
    const abs = buildAbsoluteRiskBreakdown({
      cancerType: cancer,
      rrClinical,
      profile,
      method: "Chatterjee: clinical RR only (no PRS Z-score)",
    });
    absolutePercent = abs.absoluteLifetimeRiskPercent;
  }

  const tier = tierFromAbsolutePercent(absolutePercent, baselinePct);
  const central = centralPercentileFromTier(tier);

  const pop = populationFromClinicalModel(
    cancer,
    absolutePercent,
    rrClinical,
    tier,
    modelName,
    central,
  );

  const options = {
    sex: profile.sex,
    age: profile.age,
    familyHistory: profile.familyHistory,
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
    citation: pop.clinicalModel ?? modelName,
    topContributors: [],
  };

  return {
    cancerType: cancer,
    label: base.label,
    precision: "population",
    population: pop,
    prs: undefined,
    plainLanguageSummary: `${modelName}: calibrated lifetime risk ~${absolutePercent}% (${tier} vs U.S. baseline ~${Math.round(baselinePct * 10) / 10}%). Not from your DNA.`,
    riskStory: buildRiskStoryFromPopulation(pop),
    timeline: buildScreeningTimelineFromTier(cancer, tier, options),
    ancestryConfidence: buildAncestryConfidenceForPopulation(profile, pop),
    screening: [
      ...getScreeningRecommendations(cancer, pseudoPrs, options),
      ...getFamilyHistorySupplements(cancer, profile.familyHistory),
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
    profile,
    populationDisclaimer:
      "Clinical consensus models (Gail / Tyrer-Cuzick / PREMM5-lite) — not your personal genotype. Upload DNA for polygenic calibration.",
    overallRisk: computeOverallRisk(reports),
  };

  if (profile.familyHistory?.provided) {
    result.familyHistory = profile.familyHistory;
    result.familyHistorySummary = summarizeFamilyHistory(profile.familyHistory);
  }

  return result;
}
