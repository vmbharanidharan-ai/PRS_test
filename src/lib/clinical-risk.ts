/**
 * Clinical relative-risk factors for Chatterjee joint model (multiplicative RR_clinical).
 * Coefficients are literature-informed order-of-magnitude; profile mode uses Gail/PREMM5 instead where noted.
 */

import type { CancerType, FamilyHistoryInput } from "./types";

export function clinicalRelativeRisk(
  cancer: CancerType,
  fh?: FamilyHistoryInput,
): number {
  if (!fh?.provided) return 1;

  let rr = 1;

  switch (cancer) {
    case "breast":
      if (fh.breastFirstDegree) rr *= 2.0;
      else if (fh.breastSecondDegree) rr *= 1.4;
      if (fh.ovarianFirstDegree) rr *= 1.35;
      if (fh.ashkenaziJewish) rr *= 1.25;
      break;
    case "colorectal":
      if (fh.colorectalFirstDegree) rr *= 2.1;
      if (fh.lynchSyndromeConcern) rr *= 2.5;
      break;
    case "prostate":
      if (fh.prostateFirstDegree) rr *= 2.0;
      break;
    case "ovarian":
      if (fh.ovarianFirstDegree) rr *= 3.0;
      if (fh.breastFirstDegree) rr *= 1.5;
      if (fh.ashkenaziJewish) rr *= 1.3;
      break;
  }

  if (fh.youngestAffectedAge != null && fh.youngestAffectedAge < 50) {
    rr *= 1.15;
  }

  return rr;
}
