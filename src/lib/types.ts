export type CancerType =
  | "breast"
  | "colorectal"
  | "prostate"
  | "ovarian";

export type RiskTier = "low" | "average" | "moderate" | "high";

export type GenotypeVendor = "23andme" | "ancestry" | "unknown";

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
  /** Mean PRS in reference population (same scale as computed score) */
  mean: number;
  sd: number;
  /** Approximate lifetime risk at population mean (for context) */
  baselineLifetimeRisk?: number;
  ancestry: string;
  source: string;
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
  prs: PrsComputationResult;
  plainLanguageSummary: string;
  screening: ScreeningRecommendation[];
  limitations: string[];
}

/** Optional; only set when user expands and completes the family-history section. */
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
  /** Present only when user opted into the optional questionnaire */
  familyHistory?: FamilyHistoryInput;
  familyHistorySummary?: string[];
}

export interface UserGenotype {
  rsid: string;
  chromosome: string;
  position: number;
  genotype: string;
}
