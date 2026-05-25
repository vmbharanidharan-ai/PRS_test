import type { AncestryGroup, CancerType } from "./types";

/** 1000 Genomes super-population codes */
export type ReferencePopulation = "EUR" | "AFR" | "EAS" | "SAS" | "AMR" | "MULTI";

export type ReferenceCalibrationMethod =
  | "1kg_empirical_plink"
  | "1kg_empirical_vcf"
  | "af_monte_carlo_bootstrap"
  | "legacy_hwe";

export interface PrsReferenceDistribution {
  pgsId: string;
  cancerType: CancerType;
  population: ReferencePopulation;
  source: string;
  build: string;
  nIndividuals: number;
  calibrationMethod: ReferenceCalibrationMethod;
  /** Empirical mean of reference PRS values */
  mean: number;
  /** Empirical std of reference PRS values */
  sd: number;
  min: number;
  max: number;
  /**
   * Percentile anchors: keys "0".."100" → PRS value at that empirical percentile.
   * User percentile = rank via interpolation in this ladder.
   */
  quantiles: Record<string, number>;
  ldClumpedScore: boolean;
  qcVersion?: string;
  notes?: string[];
}

export interface ReferencePanelSelection {
  population: ReferencePopulation;
  /** 0–1 confidence in ancestry assignment */
  ancestryConfidence: number;
  usedMixture: boolean;
  mixtureWeights?: Partial<Record<ReferencePopulation, number>>;
  warnings: string[];
}

export const ANCESTRY_TO_REFERENCE: Record<
  AncestryGroup,
  ReferencePopulation | "MULTI"
> = {
  european: "EUR",
  african: "AFR",
  asian: "EAS",
  hispanic: "AMR",
  other: "MULTI",
  unknown: "MULTI",
};
