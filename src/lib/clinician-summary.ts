import { PGS_CATALOG_IDS } from "./prs-registry";
import {
  loadSyntheticCalibration,
  resolvePopulationCalibration,
} from "./synthetic-calibration";
import type { AnalysisResult, CancerReport } from "./types";

export interface ClinicianPdfBlock {
  title?: string;
  lines: string[];
  bold?: boolean;
}

function modeDescription(result: AnalysisResult): string {
  switch (result.mode) {
    case "dna":
      return "consumer genotype file analyzed locally in-browser";
    case "demo":
      return "synthetic demonstration genotype (not a real person)";
    case "profile":
      return "questionnaire-only epidemiologic estimate (no genotype file)";
    case "shared":
      return "shared educational summary (genotype not re-analyzed on this device)";
  }
}

export function buildClinicianLetterIntro(result: AnalysisResult): string[] {
  const date = new Date(result.analyzedAt).toLocaleString();
  return [
    "GeneScope Research Summary",
    "",
    "Document type: structured research summary (educational).",
    "",
    "The user ran GeneScope, an educational research application, to model inherited cancer risk from public polygenic scores. This export summarizes computed metrics and limitations. It is not a laboratory report, genetic test result, or standalone clinical decision tool.",
    "",
    `Session date: ${date}`,
    `Input: ${modeDescription(result)}`,
    `Vendor label: ${result.vendor}`,
    `Variants parsed from file: ${result.variantsInFile.toLocaleString()}`,
    `Precision level: ${result.precisionLevel}`,
    "",
    "Polygenic metrics below should be interpreted only alongside complete clinical context, family-history pedigrees, and certified testing where indicated. GeneScope does not replace NCI BCRAT, IBIS, PREMM5, or certified germline diagnostics.",
  ];
}

export function buildClinicianLimitationsBlock(): string[] {
  return [
    "Critical limitations (patient acknowledged before viewing DNA-based output)",
    "",
    "• A low polygenic percentile or modeled risk does NOT imply safety from cancer.",
    "• This tool screens only a tiny set of consumer-chip SNP proxies; >99% of hereditary cancer mutations are not assessed.",
    "• Family history captured here is self-reported and incomplete versus a formal pedigree.",
    "• Absolute risk percentages are literature-calibrated educational mappings (PGS Catalog + SEER-scale baseline + published HRs), not individually validated predictions.",
    "• Ancestry calibration uses public reference panels; misclassification can distort percentiles.",
  ];
}

export function buildClinicianCancerBlock(report: CancerReport): string[] {
  const pgsId = report.prs?.pgsId ?? PGS_CATALOG_IDS[report.cancerType];
  const lines: string[] = [
    `--- ${report.label} ---`,
    `Public polygenic score ID: ${pgsId}`,
  ];

  const synCal = loadSyntheticCalibration(report.cancerType);
  if (synCal) {
    const pop = report.prs?.referencePopulation ?? synCal.default_population;
    const pc = resolvePopulationCalibration(synCal, pop);
    lines.push(
      `Level 4 synthetic calibration: ${synCal.version} (${synCal.method})`,
      `  Literature HR/SD anchor: ${pc.literature_hr_per_sd} → β_lit = ${pc.literature_beta_prs.toFixed(4)}`,
      `  Synthetic cohort fit (log-odds slope): ${pc.synthetic_slope_log_odds.toFixed(4)}`,
      `  Slope ratio (fitted/literature): ${pc.slope_ratio_fitted_vs_literature}`,
      `  Clinically valid: ${synCal.clinically_valid ? "yes" : "NO — educational only"}`,
      `  ${synCal.disclaimer}`,
    );
  }

  if (report.prs) {
    lines.push(
      `Raw PRS sum (Σ dosage×β, PGS Catalog weights): ${report.prs.rawScore.toFixed(4)}`,
      `Reference population panel: ${report.prs.referencePopulation ?? "not specified"}`,
      `Empirical percentile vs reference: ${report.prs.percentile.toFixed(1)}`,
      `Z-score (reference μ/σ): ${report.prs.zScore.toFixed(3)}`,
      `Variant match rate for score: ${(report.prs.matchRate * 100).toFixed(1)}%`,
      `Calibration method: ${report.prs.calibrationMethod ?? "unknown"}`,
      `PGS citation: ${report.prs.citation}`,
    );
  } else {
    lines.push(
      "No personal PRS computed (population/questionnaire pathway or PRS blocked).",
    );
  }

  const pop = report.population;
  lines.push(
    `Risk tier label (educational banding): ${pop.riskBand}`,
    `Modeled lifetime risk estimate (educational; Chatterjee mapping): ${pop.lifetimeRiskPercent}%`,
  );

  if (pop.uncertainty) {
    lines.push(
      `95% bootstrap interval (coverage/ancestry uncertainty): ${pop.uncertainty.ciLow}% – ${pop.uncertainty.ciHigh}%`,
      `Model confidence score (heuristic): ${pop.uncertainty.confidenceScore}`,
      `PRS SNP coverage factor: ${pop.uncertainty.prsCoverage}`,
    );
  }

  if (pop.absoluteRisk) {
    lines.push(
      `Joint model: ${pop.absoluteRisk.method}`,
      `log(RR) = ${pop.absoluteRisk.logRelativeRisk.toFixed(4)} → RR = ${pop.absoluteRisk.rrTotal.toFixed(3)}`,
      `Baseline R_base ≈ ${(pop.absoluteRisk.baselineLifetimeRisk * 100).toFixed(2)}%`,
    );
  }

  if (report.prs?.topContributors?.length) {
    lines.push("Top weighted SNP contributors (for manual lookup):");
    for (const c of report.prs.topContributors.slice(0, 5)) {
      lines.push(
        `  • ${c.rsid} genotype ${c.userGenotype} → contribution ${c.contribution.toFixed(4)} (${c.effectAllele} allele, β=${c.weight})`,
      );
    }
  }

  lines.push(
    "Screening references cited in app (educational; not personalized orders):",
  );
  for (const rec of report.screening.slice(0, 4)) {
    lines.push(`  [${rec.source}] ${rec.guideline}: ${rec.recommendation}`);
  }

  return lines;
}

export function buildClinicianPathogenicBlock(result: AnalysisResult): string[] {
  const screen = result.pathogenicScreen;
  if (!screen) return ["Pathogenic proxy screen: not run."];
  const lines = [
    `Targeted pathogenic proxy screen (${screen.screenedLoci} loci on consumer chip):`,
    `PRS interpretation blocked: ${screen.blocksPrsInterpretation ? "YES — see findings" : "no"}`,
  ];
  if (screen.findings.length === 0) {
    lines.push("No flagged proxy alleles at screened positions (does NOT rule out pathogenic variants).");
  } else {
    for (const f of screen.findings) {
      lines.push(
        `  • ${f.gene} ${f.variantLabel} (${f.rsid}) genotype ${f.userGenotype} — ${f.recommendation}`,
      );
    }
  }
  return lines;
}

export function buildClinicianOverallBlock(result: AnalysisResult): string[] {
  const o = result.overallRisk;
  return [
    "Aggregate polygenic signal (executive index)",
    "",
    `Highest single-cancer empirical percentile: ${o.executiveIndexPercentile}th`,
    o.drivingCancer
      ? `Driving cancer type for max percentile: ${o.drivingCancer}`
      : "No DNA-based cancer blocks available.",
    `Educational tier label: ${o.label}`,
    o.summary,
  ];
}

export function buildClinicianFamilyHistoryBlock(
  result: AnalysisResult,
): string[] {
  if (!result.familyHistorySummary?.length) {
    return ["Family history: none provided or skipped by user."];
  }
  return [
    "Family history (self-reported by user — verify clinically):",
    ...result.familyHistorySummary.map((l) => `  • ${l}`),
  ];
}

export function buildClinicianClosing(): string[] {
  return [
    "",
    "Closing note",
    "",
    "This summary was generated automatically by GeneScope for educational modeling of public polygenic scores. Validation requires clinical-grade germline testing and formal risk models (BCRAT, IBIS, PREMM5, etc.) where guidelines and pedigree indicate.",
    "",
    "— GeneScope Research Summary (automated; not signed by a licensed clinician)",
  ];
}

/** Flatten entire letter for PDF export */
export function buildClinicianPdfBlocks(
  result: AnalysisResult,
): ClinicianPdfBlock[] {
  const blocks: ClinicianPdfBlock[] = [
    { lines: buildClinicianLetterIntro(result), bold: true },
    { title: "Limitations", lines: buildClinicianLimitationsBlock() },
    { title: "Pathogenic proxy screen", lines: buildClinicianPathogenicBlock(result) },
    { title: "Family history", lines: buildClinicianFamilyHistoryBlock(result) },
    { title: "Overall signal", lines: buildClinicianOverallBlock(result) },
  ];

  for (const report of result.reports) {
    blocks.push({
      title: report.label,
      lines: buildClinicianCancerBlock(report),
    });
  }

  blocks.push({ title: "Closing", lines: buildClinicianClosing() });
  blocks.push({
    lines: [result.globalDisclaimer],
  });

  return blocks;
}
