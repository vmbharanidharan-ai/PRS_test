/**
 * Simplified Gail Model (BCRAT) — NCI breast cancer risk assessment.
 * Uses core Gail predictors with defaults for missing reproductive history.
 * @see https://www.cancer.gov/bcrisktool/
 */

import { absoluteLifetimeRisk } from "../absolute-risk";
import { baselineFor } from "../epidemiology-baselines";
import type { FamilyHistoryInput, UserProfile } from "../types";

const DEFAULT_MENARCHE = 12;
const DEFAULT_FIRST_BIRTH = 25;

function countBreastRelatives(fh?: FamilyHistoryInput): number {
  if (!fh?.provided) return 0;
  if (fh.breastFirstDegree) return 1;
  if (fh.breastSecondDegree) return 0.5;
  return 0;
}

/**
 * Logistic relative risk from Gail-style covariates (white population coefficients, scaled).
 * Full BCRAT uses race-specific tables; we document European-ancestry calibration.
 */
function gailLogRelativeRisk(profile: UserProfile): number {
  const age = profile.age ?? 45;
  const relatives = countBreastRelatives(profile.familyHistory);
  const menarche = DEFAULT_MENARCHE;
  const firstBirth = DEFAULT_FIRST_BIRTH;

  const ageTerm = 0.012 * (age - 50);
  const menarcheTerm = 0.02 * (menarche - 12);
  const birthTerm = firstBirth < 20 ? -0.2 : firstBirth > 29 ? 0.15 : 0;
  const relativeTerm = Math.log(1 + relatives * 1.8);
  const biopsyTerm = 0;

  return ageTerm + menarcheTerm + birthTerm + relativeTerm + biopsyTerm;
}

export interface ClinicalModelResult {
  absoluteLifetimeRiskPercent: number;
  rrClinical: number;
  modelName: string;
  modelCitation: string;
  notes: string[];
}

export function gailLiteBreastRisk(profile: UserProfile): ClinicalModelResult {
  const base = baselineFor("breast");
  const sex = profile.sex;
  const rBase =
    sex === "male"
      ? base.lifetimeRiskMale
      : base.lifetimeRiskFemale;

  const ancestry = profile.ancestry ?? "unknown";
  const rBaseAdj = rBase * (base.ancestryMultipliers[ancestry] ?? 1);

  const logRr = gailLogRelativeRisk(profile);
  const rrClinical = Math.exp(logRr);
  const absolute = absoluteLifetimeRisk(rBaseAdj, logRr);

  return {
    absoluteLifetimeRiskPercent: Math.round(absolute * 1000) / 10,
    rrClinical,
    modelName: "Gail Model (simplified BCRAT)",
    modelCitation: "Gail MH et al.; NCI BCRAT. Defaults used for menarche/parity if not collected.",
    notes: [
      "Simplified Gail implementation — not a substitute for NCI BCRAT web tool.",
      "Reproductive history defaults: menarche 12, first live birth age 25.",
    ],
  };
}
