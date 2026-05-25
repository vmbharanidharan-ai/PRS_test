import type {
  AncestryConfidence,
  PopulationCancerRisk,
  PrsComputationResult,
  UserProfile,
} from "./types";

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
    "PRS percentiles are mapped to ancestry-stratified reference panels (1000 Genomes–style). Uncertain ancestry reduces calibration precision.",
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

export function buildAncestryConfidenceForPopulation(
  profile: UserProfile,
  pop: PopulationCancerRisk,
): AncestryConfidence {
  const ancestry = profile.ancestry ?? "unknown";
  let applicabilityPercent = ancestry === "unknown" ? 45 : 65;
  if (ancestry !== "european" && ancestry !== "unknown") applicabilityPercent -= 10;

  const warnings = [
    "Without DNA data, ancestry applicability is inferred from your selection only.",
    "Published PRS models are primarily calibrated in European-ancestry cohorts.",
    "This is a population-informed estimate — not a personal genetic measurement.",
  ];

  return {
    level: pop.confidenceLevel,
    label:
      pop.confidenceLevel === "high"
        ? "Moderate model fit (profile only)"
        : "Limited — upload DNA for precision",
    matchPercent: 0,
    applicabilityPercent,
    populationNote:
      ancestry === "unknown"
        ? "Select ancestry or upload DNA to improve applicability estimates."
        : `Profile ancestry: ${ancestry}. Applicability meter reflects epidemiological priors.`,
    warnings,
  };
}
