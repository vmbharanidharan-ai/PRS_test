/**
 * Global validity boundaries — reduce unvalidated inference layers.
 *
 * Goal: separate measured (PRS) from modeled (epidemiological) outputs.
 * Credibility beats complexity.
 */

export const VALIDITY_MODE = {
  /** Personalized P = 1-(1-R_base)^RR is disabled */
  ABSOLUTE_RISK: "disabled" as const,
  /** Synthetic cohort simulation is demo-only, never production */
  SYNTHETIC_CALIBRATION: false,
  /** Do not claim equivalence to BCRAT, IBIS, PREMM5, etc. */
  CLINICAL_EQUIVALENCE: false,
  /** No multi-population mixture for percentiles */
  ANCESTRY_MIXTURE_FALLBACK: false,
  /** No Hardy–Weinberg Gaussian percentile fallback */
  LEGACY_HWE_FALLBACK: false,
} as const;

export const VALIDITY_DISCLAIMERS = {
  notPersonalizedProbability:
    "DO NOT interpret outputs as individual disease probability or clinical prediction.",
  populationBaselineOnly:
    "Population baseline lifetime risk (SEER-scale) is descriptive context only — not used in personalized probability.",
  relativeRiskOnly:
    "Primary genetic output: relative risk (RR) vs reference distribution from literature HR per SD.",
  uncalibratedReference:
    "PRS percentile unavailable: ancestry-matched 1000 Genomes reference required for Z-score normalization.",
} as const;
