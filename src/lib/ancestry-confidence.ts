import type { AncestryConfidence, PrsComputationResult } from "./types";

export function buildAncestryConfidence(
  prs: PrsComputationResult,
): AncestryConfidence {
  const matchPercent = Math.round(prs.matchRate * 100);
  const warnings: string[] = [];

  // Scores calibrated primarily on European-ancestry GWAS cohorts
  let applicabilityPercent = 85;
  if (matchPercent < 70) {
    applicabilityPercent -= 25;
    warnings.push(
      "Many score variants were missing from your file — results may be less reliable.",
    );
  } else if (matchPercent < 85) {
    applicabilityPercent -= 10;
  }

  applicabilityPercent = Math.max(20, Math.min(95, applicabilityPercent));

  let level: AncestryConfidence["level"] = "moderate";
  if (matchPercent >= 85 && applicabilityPercent >= 75) level = "high";
  else if (matchPercent < 60 || applicabilityPercent < 50) level = "low";

  warnings.push(
    "These scores were developed mainly in European-ancestry research cohorts. Accuracy may differ if your genetic ancestry differs.",
  );

  const label =
    level === "high"
      ? "Reasonable fit for reference model"
      : level === "moderate"
        ? "Interpret with caution"
        : "Limited confidence — discuss with a clinician";

  return {
    level,
    label,
    matchPercent,
    applicabilityPercent,
    populationNote:
      "Model confidence reflects variant match and known ancestry limits of published PRS — not a measurement of your personal ancestry.",
    warnings,
  };
}
