import type { CancerType, FamilyHistoryInput, ScreeningRecommendation } from "./types";

/** Returns extra screening notes when user opted in and provided family history. */
export function getFamilyHistorySupplements(
  cancerType: CancerType,
  fh: FamilyHistoryInput | undefined,
): ScreeningRecommendation[] {
  if (!fh?.provided) return [];

  const out: ScreeningRecommendation[] = [];

  switch (cancerType) {
    case "breast":
      if (fh.breastFirstDegree) {
        out.push({
          source: "NCCN",
          guideline: "NCCN — family history + PRS",
          recommendation:
            "A first-degree relative with breast cancer increases baseline risk. Combined with your PRS, discuss genetic counseling for BRCA1/2/PALB2 and whether to start mammography before age 40 or add breast MRI.",
          rationale:
            "NCCN recommends genetic risk assessment when family history meets criteria; PRS does not replace germline testing.",
        });
      }
      if (fh.breastSecondDegree && !fh.breastFirstDegree) {
        out.push({
          source: "NCCN",
          guideline: "NCCN — second-degree family history",
          recommendation:
            "Second-degree breast cancer relatives may warrant earlier mammography discussion. Pair this with your PRS percentile when deciding screening age.",
          rationale:
            "Family history modifies screening thresholds independent of polygenic score.",
        });
      }
      if (fh.ashkenaziJewish) {
        out.push({
          source: "NCCN",
          guideline: "NCCN — Ashkenazi Jewish ancestry",
          recommendation:
            "Discuss BRCA1/2 testing (≈1 in 40 carrier frequency in Ashkenazi Jewish populations) regardless of PRS, per NCCN genetic/familial high-risk guidelines.",
          rationale:
            "Founder mutations are not captured by common-variant PRS.",
        });
      }
      break;

    case "ovarian":
      if (fh.ovarianFirstDegree || fh.breastFirstDegree) {
        out.push({
          source: "NCCN",
          guideline: "NCCN — ovarian / breast family history",
          recommendation:
            "Family history of ovarian or breast cancer may meet criteria for BRCA1/2 genetic testing. There is no effective routine ovarian screening for average-risk women; pathogenic variant testing changes prevention options.",
          rationale:
            "Elevated PRS plus family history strengthens indication for genetic counseling, not ultrasound screening alone.",
        });
      }
      if (fh.lynchSyndromeConcern) {
        out.push({
          source: "NCCN",
          guideline: "NCCN — Lynch syndrome assessment",
          recommendation:
            "If you selected concern for Lynch syndrome (colon/uterine cancer in relatives), discuss mismatch repair (MMR) genetic testing and colonoscopy intervals with your clinician.",
          rationale:
            "Lynch syndrome is a monogenic condition not detected by PRS.",
        });
      }
      break;

    case "colorectal":
      if (fh.colorectalFirstDegree) {
        out.push({
          source: "NCCN",
          guideline: "NCCN — colorectal family history",
          recommendation:
            "First-degree relative with colorectal cancer: screening often starts at age 40 or 10 years before the youngest diagnosis, whichever is earlier — typically colonoscopy, not stool tests alone.",
          rationale:
            "Family history is a stronger risk factor than PRS alone for screening start age.",
        });
      }
      if (fh.lynchSyndromeConcern) {
        out.push({
          source: "NCCN",
          guideline: "NCCN — Lynch syndrome",
          recommendation:
            "Consider genetic evaluation for Lynch syndrome (MLH1, MSH2, MSH6, PMS2, EPCAM). Surveillance may include colonoscopy every 1–2 years starting at age 20–25 if Lynch is confirmed.",
          rationale:
            "Lynch overrides average-risk PRS-based intervals.",
        });
      }
      if (fh.youngestAffectedAge != null && fh.youngestAffectedAge < 50) {
        out.push({
          source: "general",
          guideline: "Early-onset family history",
          recommendation: `Youngest affected relative diagnosed before age 50 (${fh.youngestAffectedAge}). Discuss earlier colonoscopy and germline testing with your clinician.`,
          rationale:
            "Early-onset cancers in relatives increase likelihood of hereditary syndromes.",
        });
      }
      break;

    case "prostate":
      if (fh.prostateFirstDegree) {
        out.push({
          source: "NCCN",
          guideline: "NCCN — prostate family history",
          recommendation:
            "First-degree relative with prostate cancer: consider discussing PSA starting at age 40–45. Aggressive family history (multiple relatives or early death) may warrant earlier shared decision-making.",
          rationale:
            "Family history lowers the threshold for PSA discussion beyond PRS alone.",
        });
      }
      break;
  }

  return out;
}

export function summarizeFamilyHistory(fh: FamilyHistoryInput): string[] {
  if (!fh.provided) return [];
  const lines: string[] = [];
  if (fh.breastFirstDegree) lines.push("First-degree relative with breast cancer");
  if (fh.breastSecondDegree) lines.push("Second-degree relative with breast cancer");
  if (fh.ovarianFirstDegree) lines.push("First-degree relative with ovarian cancer");
  if (fh.colorectalFirstDegree) lines.push("First-degree relative with colorectal cancer");
  if (fh.prostateFirstDegree) lines.push("First-degree relative with prostate cancer");
  if (fh.lynchSyndromeConcern) lines.push("Concern for Lynch syndrome pattern in family");
  if (fh.ashkenaziJewish) lines.push("Ashkenazi Jewish ancestry");
  if (fh.youngestAffectedAge != null)
    lines.push(`Youngest affected relative diagnosed at age ${fh.youngestAffectedAge}`);
  return lines;
}
