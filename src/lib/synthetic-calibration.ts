/**
 * Level 4 — Synthetic cohort pseudo-calibration (Path A: research-grade honesty).
 * NOT clinically valid; internally consistent log(RR) mapping from PRS Z.
 */

import type { CancerType } from "./types";
import type { ReferencePopulation } from "./prs-reference-types";

import breastCal from "../../public/models/breast_synthetic_calibration.json";
import colorectalCal from "../../public/models/colorectal_synthetic_calibration.json";
import prostateCal from "../../public/models/prostate_synthetic_calibration.json";
import ovarianCal from "../../public/models/ovarian_synthetic_calibration.json";

export interface PopulationSyntheticCalibration {
  population: string;
  reference_mean: number;
  reference_sd: number;
  reference_method: string;
  literature_beta_prs: number;
  literature_hr_per_sd: number;
  synthetic_intercept_log_odds: number;
  synthetic_slope_log_odds: number;
  synthetic_prevalence_target: number;
  synthetic_n_simulated: number;
  slope_ratio_fitted_vs_literature: number;
}

export interface SyntheticCalibrationModel {
  cancer: string;
  pgs_id: string;
  version: string;
  path: string;
  method: string;
  calibration: string;
  clinically_valid: boolean;
  disclaimer: string;
  literature_anchor: {
    hr_per_sd: number;
    beta_prs_ln_hr: number;
    source: string;
    option: string;
  };
  populations: Record<string, PopulationSyntheticCalibration>;
  default_population: string;
  default_intercept_log_rr: number;
  default_slope_log_rr: number;
  data_layers: Record<string, string>;
  references: string[];
  notes: string[];
}

const BUNDLED: Partial<Record<CancerType, SyntheticCalibrationModel>> = {
  breast: breastCal as SyntheticCalibrationModel,
  colorectal: colorectalCal as SyntheticCalibrationModel,
  prostate: prostateCal as SyntheticCalibrationModel,
  ovarian: ovarianCal as SyntheticCalibrationModel,
};

export function loadSyntheticCalibration(
  cancer: CancerType,
): SyntheticCalibrationModel | null {
  return BUNDLED[cancer] ?? null;
}

export function resolvePopulationCalibration(
  model: SyntheticCalibrationModel,
  population?: ReferencePopulation | string,
): PopulationSyntheticCalibration {
  const pop = population ?? model.default_population;
  return (
    model.populations[pop] ??
    model.populations[model.default_population] ??
    Object.values(model.populations)[0]
  );
}

/**
 * Level 4 PRS contribution on log(RR) scale:
 *   log(RR)_PRS = intercept + slope × Z
 * Intercept absorbed into joint model baseline in production; slope drives relative risk.
 */
export function syntheticPrsLogContribution(
  cancer: CancerType,
  zScore: number,
  population?: ReferencePopulation | string,
): {
  logTerm: number;
  slope: number;
  intercept: number;
  model: SyntheticCalibrationModel;
  popCal: PopulationSyntheticCalibration;
} | null {
  const model = loadSyntheticCalibration(cancer);
  if (!model) return null;
  const popCal = resolvePopulationCalibration(model, population);
  const slope = popCal.synthetic_slope_log_odds;
  const intercept = popCal.synthetic_intercept_log_odds;
  return {
    logTerm: intercept + slope * zScore,
    slope,
    intercept,
    model,
    popCal,
  };
}

/**
 * Level 4 PRS term on log(RR) scale (slope × Z).
 * Returns undefined if synthetic calibration JSON is missing (caller uses literature β).
 */
export function syntheticPrsLogRelativeRisk(
  cancer: CancerType,
  zScore: number,
  population?: ReferencePopulation | string,
): number | undefined {
  const model = loadSyntheticCalibration(cancer);
  if (!model) return undefined;
  const popCal = resolvePopulationCalibration(model, population);
  return popCal.synthetic_slope_log_odds * zScore;
}
