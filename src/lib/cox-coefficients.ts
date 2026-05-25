import type { CancerType } from "./types";

export interface CoxModelCoefficients {
  cancer: string;
  version: string;
  source: string;
  coefficients: Record<string, number>;
  baseline_hazard_scale: number;
  baseline_lifetime_risk: number;
  notes?: string[];
}

import breastCox from "../../public/models/breast_cox.json";
import colorectalCox from "../../public/models/colorectal_cox.json";
import prostateCox from "../../public/models/prostate_cox.json";
import ovarianCox from "../../public/models/ovarian_cox.json";

const BUNDLED: Partial<Record<CancerType, CoxModelCoefficients>> = {
  breast: breastCox as CoxModelCoefficients,
  colorectal: colorectalCox as CoxModelCoefficients,
  prostate: prostateCox as CoxModelCoefficients,
  ovarian: ovarianCox as CoxModelCoefficients,
};

export function loadCoefficientsSync(
  cancer: CancerType,
): CoxModelCoefficients | null {
  return BUNDLED[cancer] ?? null;
}

export async function loadCoefficients(
  cancer: CancerType,
): Promise<CoxModelCoefficients | null> {
  return loadCoefficientsSync(cancer);
}
