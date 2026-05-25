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
  type AncestryGroup,
  CANCER_BASELINES,
} from "./epidemiology-baselines";
import type {
  AnalysisResult,
  CancerReport,
  CancerType,
  FamilyHistoryInput,
  PopulationCancerRisk,
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

function familyHistoryMultiplier(fh?: FamilyHistoryInput, cancer?: CancerType): number {
  if (!fh?.provided) return 1;
  let m = 1;
  if (cancer === "breast" && (fh.breastFirstDegree || fh.breastSecondDegree)) m *= 1.45;
  if (cancer === "colorectal" && (fh.colorectalFirstDegree || fh.lynchSyndromeConcern))
    m *= 1.5;
  if (cancer === "prostate" && fh.prostateFirstDegree) m *= 1.35;
  if (cancer === "ovarian" && (fh.ovarianFirstDegree || fh.breastFirstDegree)) m *= 1.4;
  if (fh.lynchSyndromeConcern && cancer === "colorectal") m *= 1.25;
  if (fh.youngestAffectedAge != null && fh.youngestAffectedAge < 50) m *= 1.15;
  return m;
}

function ageMultiplier(age?: number): number {
  if (!age) return 1;
  if (age < 40) return 0.85;
  if (age < 55) return 1;
  if (age < 70) return 1.1;
  return 1.15;
}

/** PRS ~ N(0,1) — without DNA we estimate a percentile band */
function percentileBand(
  profile: UserProfile,
  cancer: CancerType,
): { low: number; high: number; central: number; tier: RiskTier } {
  let center = 50;
  const fh = profile.familyHistory;
  if (fh?.provided) {
    if (cancer === "breast" && fh.breastFirstDegree) center = 72;
    else if (cancer === "colorectal" && fh.colorectalFirstDegree) center = 68;
    else if (cancer === "prostate" && fh.prostateFirstDegree) center = 70;
    else if (cancer === "ovarian" && fh.ovarianFirstDegree) center = 75;
    else if (fh.lynchSyndromeConcern) center += 8;
  }

  const ancestry = profile.ancestry ?? "unknown";
  if (ancestry === "african" && (cancer === "prostate" || cancer === "breast"))
    center += 5;

  const spread = fh?.provided ? 18 : 22;
  const low = Math.max(5, center - spread);
  const high = Math.min(95, center + spread);
  const central = Math.round((low + high) / 2);

  let tier: RiskTier = "average";
  if (high < 35) tier = "low";
  else if (low > 80) tier = "high";
  else if (low > 65 || central > 70) tier = "moderate";

  return { low, high, central, tier };
}

function estimatePopulationRisk(
  profile: UserProfile,
  cancer: CancerType,
): PopulationCancerRisk {
  const base = baselineFor(cancer);
  const sex = profile.sex;
  const baseRisk =
    sex === "male"
      ? base.lifetimeRiskMale
      : sex === "female"
        ? base.lifetimeRiskFemale
        : Math.max(base.lifetimeRiskFemale, base.lifetimeRiskMale);

  const ancestry = (profile.ancestry ?? "unknown") as AncestryGroup;
  const adj =
    baseRisk *
    (base.ancestryMultipliers[ancestry] ?? 1) *
    familyHistoryMultiplier(profile.familyHistory, cancer) *
    ageMultiplier(profile.age);

  const band = percentileBand(profile, cancer);
  const lifetimePct = Math.min(0.45, adj * 100);

  const likelihoodLabels: Record<RiskTier, string> = {
    low: "Lower likelihood than typical",
    average: "Typical range for people like you",
    moderate: "Moderately elevated likelihood",
    high: "Higher likelihood than typical",
  };

  return {
    cancerType: cancer,
    label: base.label,
    lifetimeRiskPercent: Math.round(lifetimePct * 10) / 10,
    riskBand: band.tier,
    percentileLow: Math.round(band.low),
    percentileHigh: Math.round(band.high),
    centralPercentile: band.central,
    likelihoodLabel: likelihoodLabels[band.tier],
    confidenceLevel: profile.ancestry && profile.ancestry !== "unknown" ? "moderate" : "low",
    isPopulationEstimate: true,
    whatWouldShift: [
      "Uploading raw DNA data enables true polygenic scoring (highest precision)",
      "Family history details refine conditional estimates",
      "Clinical genetic testing detects rare high-risk mutations (BRCA, Lynch, etc.)",
    ],
  };
}

function buildProfileCancerReport(
  profile: UserProfile,
  cancer: CancerType,
): CancerReport {
  const pop = estimatePopulationRisk(profile, cancer);
  const tier = pop.riskBand;

  const pseudoPrs = {
    pgsId: "population-model",
    cancerType: cancer,
    name: "Population-informed estimate",
    rawScore: 0,
    zScore: 0,
    percentile: pop.centralPercentile,
    riskTier: tier,
    variantsUsed: 0,
    variantsTotal: 0,
    matchRate: 0,
    citation: pop.isPopulationEstimate
      ? "Epidemiological priors (SEER/CDC-scale) + demographic conditioning"
      : "",
    topContributors: [],
  };

  const options = {
    sex: profile.sex,
    age: profile.age,
    familyHistory: profile.familyHistory,
  };

  return {
    cancerType: cancer,
    label: pop.label,
    precision: "population",
    population: pop,
    prs: undefined,
    plainLanguageSummary: `Population-based estimate: ${pop.likelihoodLabel}. Typical PRS percentile range for someone with your profile: ${pop.percentileLow}th–${pop.percentileHigh}th. This is NOT from your DNA.`,
    riskStory: buildRiskStoryFromPopulation(pop),
    timeline: buildScreeningTimelineFromTier(cancer, tier, options),
    ancestryConfidence: buildAncestryConfidenceForPopulation(profile, pop),
    screening: [
      ...getScreeningRecommendations(cancer, pseudoPrs, options),
      ...getFamilyHistorySupplements(cancer, profile.familyHistory),
    ],
    limitations: [
      "This is a population-based estimate, not a personal genetic result from your DNA.",
      "True polygenic scores require a raw genotype file.",
      "Does not detect BRCA1/2, Lynch syndrome, or other pathogenic variants.",
      "U.S.-oriented epidemiological priors; not medical advice.",
    ],
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
      "This report uses population and epidemiological modeling — not your personal genetic data. Upload DNA for polygenic precision.",
    overallRisk: computeOverallRisk(reports),
  };

  if (profile.familyHistory?.provided) {
    result.familyHistory = profile.familyHistory;
    result.familyHistorySummary = summarizeFamilyHistory(profile.familyHistory);
  }

  return result;
}
