import type { CancerType } from "./types";

export type AncestryGroup =
  | "european"
  | "african"
  | "asian"
  | "hispanic"
  | "other"
  | "unknown";

export interface CancerBaseline {
  cancerType: CancerType;
  label: string;
  /** Approximate U.S. lifetime risk (SEER-informed order of magnitude) */
  lifetimeRiskFemale: number;
  lifetimeRiskMale: number;
  /** Hazard ratio per 1 SD of PRS (Lewis et al., 2021; cancer-specific GWAS) */
  hazardRatioPerSd: number;
  sdPRS: number;
  ancestryMultipliers: Record<AncestryGroup, number>;
  source: string;
}

/** Epidemiological priors — educational modeling, not individual diagnosis */
export const CANCER_BASELINES: CancerBaseline[] = [
  {
    cancerType: "breast",
    label: "Breast cancer",
    lifetimeRiskFemale: 0.13,
    lifetimeRiskMale: 0.001,
    hazardRatioPerSd: 1.8,
    sdPRS: 1,
    ancestryMultipliers: {
      european: 1,
      african: 1.15,
      asian: 0.85,
      hispanic: 0.95,
      other: 1,
      unknown: 1,
    },
    source: "SEER / CDC order-of-magnitude lifetime risk (U.S.)",
  },
  {
    cancerType: "colorectal",
    label: "Colorectal cancer",
    lifetimeRiskFemale: 0.04,
    lifetimeRiskMale: 0.042,
    hazardRatioPerSd: 1.45,
    sdPRS: 1,
    ancestryMultipliers: {
      european: 1,
      african: 1.2,
      asian: 0.8,
      hispanic: 1.05,
      other: 1,
      unknown: 1,
    },
    source: "SEER / CDC order-of-magnitude lifetime risk (U.S.)",
  },
  {
    cancerType: "prostate",
    label: "Prostate cancer",
    lifetimeRiskFemale: 0,
    lifetimeRiskMale: 0.125,
    hazardRatioPerSd: 1.5,
    sdPRS: 1,
    ancestryMultipliers: {
      european: 1,
      african: 1.75,
      asian: 0.6,
      hispanic: 1.1,
      other: 1,
      unknown: 1,
    },
    source: "SEER / CDC order-of-magnitude lifetime risk (U.S.)",
  },
  {
    cancerType: "ovarian",
    label: "Ovarian cancer",
    lifetimeRiskFemale: 0.012,
    lifetimeRiskMale: 0,
    hazardRatioPerSd: 1.35,
    sdPRS: 1,
    ancestryMultipliers: {
      european: 1,
      african: 0.9,
      asian: 0.85,
      hispanic: 1,
      other: 1,
      unknown: 1,
    },
    source: "SEER / CDC order-of-magnitude lifetime risk (U.S.)",
  },
];

export function baselineFor(type: CancerType): CancerBaseline {
  const b = CANCER_BASELINES.find((c) => c.cancerType === type);
  if (!b) throw new Error(`No baseline for ${type}`);
  return b;
}
