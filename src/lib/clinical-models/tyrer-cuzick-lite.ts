/**
 * Simplified Tyrer-Cuzick (IBIS) — emphasizes non-linear family-history structure.
 * @see Tyrer J et al., J Med Genet 2004; IBIS v8
 */

import { baselineFor } from "../epidemiology-baselines";
import { VALIDITY_DISCLAIMERS } from "../validity-config";
import type { FamilyHistoryInput, UserProfile } from "../types";

function tyrerCuzickLogRr(fh?: FamilyHistoryInput): number {
  if (!fh?.provided) return 0;

  let logRr = 0;
  if (fh.breastFirstDegree && fh.ovarianFirstDegree) logRr += Math.log(4.5);
  else if (fh.breastFirstDegree) logRr += Math.log(2.5);
  else if (fh.breastSecondDegree) logRr += Math.log(1.6);

  if (fh.ashkenaziJewish) logRr += Math.log(1.35);
  if (fh.youngestAffectedAge != null && fh.youngestAffectedAge < 50) logRr += Math.log(1.25);

  return logRr;
}

export function tyrerCuzickLiteBreastRisk(
  profile: UserProfile,
): import("./gail-lite").ClinicalModelResult {
  const base = baselineFor("breast");
  const rBase = base.lifetimeRiskFemale;
  const ancestry = profile.ancestry ?? "unknown";
  const rBaseAdj = rBase * (base.ancestryMultipliers[ancestry] ?? 1);

  const age = profile.age ?? 45;
  const ageFactor = age < 40 ? 0.85 : age > 60 ? 1.1 : 1;
  const logRr = tyrerCuzickLogRr(profile.familyHistory) + Math.log(ageFactor);
  const rrClinical = Math.exp(logRr);
  return {
    absoluteLifetimeRiskPercent: Math.round(rBaseAdj * 1000) / 10,
    rrClinical,
    modelName: "Tyrer-Cuzick / IBIS (simplified)",
    modelCitation: "Tyrer J et al., J Med Genet 2004; family-history non-linear terms.",
    notes: [
      "IBIS-lite — not comparable to certified IBIS output.",
      VALIDITY_DISCLAIMERS.notPersonalizedProbability,
      "Ovarian + breast FH combined when both reported.",
    ],
  };
}
