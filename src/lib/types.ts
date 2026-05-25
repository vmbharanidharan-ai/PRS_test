export type CancerType =
  | "breast"
  | "colorectal"
  | "prostate"
  | "ovarian";

export type RiskTier = "low" | "average" | "moderate" | "high";

export type GenotypeVendor = "23andme" | "ancestry" | "unknown";

export type PrecisionLevel = "population" | "genetic" | "demo";

export type AnalysisMode = "demo" | "dna" | "profile" | "shared";

export type AncestryGroup =
  | "european"
  | "african"
  | "asian"
  | "hispanic"
  | "other"
  | "unknown";

export interface UserProfile {
  age?: number;
  sex?: "female" | "male";
  ancestry?: AncestryGroup;
  familyHistory?: FamilyHistoryInput;
}

export interface AbsoluteRiskBreakdown {
  cancerType?: CancerType;
  baselineLifetimeRisk: number;
  rrPrs: number;
  rrClinical: number;
  rrTotal: number;
  absoluteLifetimeRisk: number;
  absoluteLifetimeRiskPercent: number;
  method: string;
}

export interface PopulationCancerRisk {
  cancerType: CancerType;
  label: string;
  lifetimeRiskPercent: number;
  riskBand: RiskTier;
  percentileLow: number;
  percentileHigh: number;
  centralPercentile: number;
  likelihoodLabel: string;
  confidenceLevel: "low" | "moderate" | "high";
  isPopulationEstimate: boolean;
  whatWouldShift: string[];
  absoluteRisk?: AbsoluteRiskBreakdown;
  clinicalModel?: string;
}

export interface PathogenicFinding {
  rsid: string;
  gene: string;
  variantLabel: string;
  userGenotype: string;
  significance: "pathogenic_founder" | "clinvar_pathogenic";
  recommendation: string;
}

export interface PathogenicScreenResult {
  findings: PathogenicFinding[];
  blocksPrsInterpretation: boolean;
  screenedLoci: number;
}

export interface OverallRiskSummary {
  tier: RiskTier;
  label: string;
  /** 0–100 visual bar position */
  barPercent: number;
  summary: string;
  /** Executive index: driven by highest single-cancer liability */
  executiveIndexPercentile: number;
  drivingCancer?: CancerType;
}

export interface PrsVariant {
  rsid: string;
  effectAllele: string;
  otherAllele: string;
  weight: number;
  chr?: string;
  pos?: number;
}

export interface PrsScoreDefinition {
  pgsId: string;
  cancerType: CancerType;
  name: string;
  trait: string;
  genomeBuild: string;
  weightType: string;
  citation: string;
  variants: PrsVariant[];
  population: PopulationReference;
}

export interface PopulationReference {
  mean: number;
  sd: number;
  baselineLifetimeRisk?: number;
  ancestry: string;
  source: string;
}

export interface SnpContribution {
  rsid: string;
  effectAllele: string;
  userGenotype: string;
  dosage: number;
  weight: number;
  contribution: number;
}

export interface PrsComputationResult {
  pgsId: string;
  cancerType: CancerType;
  name: string;
  rawScore: number;
  zScore: number;
  percentile: number;
  riskTier: RiskTier;
  variantsUsed: number;
  variantsTotal: number;
  matchRate: number;
  relativeRiskPerSd?: number;
  citation: string;
  topContributors: SnpContribution[];
  /** Empirical reference panel used for percentile (not Gaussian HWE) */
  referencePopulation?: string;
  calibrationMethod?: string;
  referenceSource?: string;
  referenceNIndividuals?: number;
}

export interface RiskStory {
  headline: string;
  lifetimeFraming: string;
  populationComparison: string;
  plainMeaning: string;
  emphasis: "reassuring" | "neutral" | "attention";
}

export interface ScreeningTimelineItem {
  age: number;
  label: string;
  description: string;
  source: "NCCN" | "USPSTF" | "ACS" | "general";
  framing: "general_guideline" | "educational";
}

export interface AncestryConfidence {
  level: "high" | "moderate" | "low";
  label: string;
  matchPercent: number;
  applicabilityPercent: number;
  populationNote: string;
  warnings: string[];
}

export interface ScreeningRecommendation {
  source: "NCCN" | "USPSTF" | "ACS" | "general";
  guideline: string;
  recommendation: string;
  rationale: string;
}

export interface CancerReport {
  cancerType: CancerType;
  label: string;
  precision: "population" | "genetic";
  population: PopulationCancerRisk;
  prs?: PrsComputationResult;
  plainLanguageSummary: string;
  riskStory: RiskStory;
  timeline: ScreeningTimelineItem[];
  ancestryConfidence: AncestryConfidence;
  screening: ScreeningRecommendation[];
  limitations: string[];
}

export interface FamilyHistoryInput {
  provided: true;
  breastFirstDegree?: boolean;
  breastSecondDegree?: boolean;
  ovarianFirstDegree?: boolean;
  colorectalFirstDegree?: boolean;
  prostateFirstDegree?: boolean;
  lynchSyndromeConcern?: boolean;
  ashkenaziJewish?: boolean;
  youngestAffectedAge?: number;
}

export interface AnalysisResult {
  analyzedAt: string;
  vendor: GenotypeVendor;
  variantsInFile: number;
  reports: CancerReport[];
  globalDisclaimer: string;
  dataNotStored: boolean;
  mode: AnalysisMode;
  precisionLevel: PrecisionLevel;
  overallRisk: OverallRiskSummary;
  profile?: UserProfile;
  populationDisclaimer?: string;
  familyHistory?: FamilyHistoryInput;
  familyHistorySummary?: string[];
  pathogenicScreen?: PathogenicScreenResult;
}

export interface UserGenotype {
  rsid: string;
  chromosome: string;
  position: number;
  genotype: string;
}
