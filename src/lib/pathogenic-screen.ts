/**
 * Targeted pathogenic variant screen for consumer microarray positions.
 * Monogenic risk overrides polygenic interpretation when detected.
 */

import type { PathogenicFinding, PathogenicScreenResult, UserGenotype } from "./types";

interface PathogenicLocus {
  rsid: string;
  gene: string;
  variantLabel: string;
  /** Genotypes that indicate elevated pathogenic carrier status on consumer chips */
  riskGenotypes: string[];
  recommendation: string;
}

/** Ashkenazi founder + high-penetrance ClinVar entries commonly on 23andMe/Ancestry */
const TARGETED_LOCI: PathogenicLocus[] = [
  {
    rsid: "rs80357373",
    gene: "BRCA1",
    variantLabel: "185delAG (founder)",
    riskGenotypes: ["DD", "DI", "II", "del", "--", "I-"],
    recommendation:
      "This position is associated with BRCA1 185delAG. Monogenic risk may override PRS. Seek genetic counseling and clinical confirmatory testing immediately.",
  },
  {
    rsid: "rs80357906",
    gene: "BRCA1",
    variantLabel: "5382insC (founder)",
    riskGenotypes: ["DD", "DI", "II", "ins", "--"],
    recommendation:
      "This position is associated with BRCA1 5382insC. Seek urgent genetic counseling and clinical testing.",
  },
  {
    rsid: "rs80359550",
    gene: "BRCA2",
    variantLabel: "6174delT (founder)",
    riskGenotypes: ["DD", "DI", "II", "del", "--"],
    recommendation:
      "This position is associated with BRCA2 6174delT. Seek urgent genetic counseling and clinical testing.",
  },
  {
    rsid: "rs2303428",
    gene: "MLH1",
    variantLabel: "ClinVar pathogenic proxy (Lynch)",
    riskGenotypes: ["AA", "AG", "GG"],
    recommendation:
      "A ClinVar-catalogued risk allele was detected at an MMR locus. Lynch syndrome assessment is indicated — PRS alone is insufficient.",
  },
  {
    rsid: "rs1800734",
    gene: "MLH1",
    variantLabel: "Promoter variant (Lynch screening)",
    riskGenotypes: ["AA"],
    recommendation:
      "Promoter-region variant flagged for Lynch pathway review. Confirm with clinical genetic testing.",
  },
];

function normalizeGenotype(g: string): string {
  return g.replace(/\s/g, "").toUpperCase();
}

function isRiskGenotype(userGt: string, locus: PathogenicLocus): boolean {
  const g = normalizeGenotype(userGt);
  if (locus.riskGenotypes.some((r) => normalizeGenotype(r) === g)) return true;
  if (g.includes("-") || g === "--") {
    return locus.riskGenotypes.some((r) => r.includes("-") || r === "--");
  }
  return false;
}

export function screenPathogenicVariants(
  genotypes: Map<string, UserGenotype>,
): PathogenicScreenResult {
  const findings: PathogenicFinding[] = [];

  for (const locus of TARGETED_LOCI) {
    const user = genotypes.get(locus.rsid.toLowerCase());
    if (!user) continue;
    if (!isRiskGenotype(user.genotype, locus)) continue;

    findings.push({
      rsid: locus.rsid,
      gene: locus.gene,
      variantLabel: locus.variantLabel,
      userGenotype: user.genotype,
      significance: "pathogenic_founder",
      recommendation: locus.recommendation,
    });
  }

  return {
    findings,
    blocksPrsInterpretation: findings.length > 0,
    screenedLoci: TARGETED_LOCI.length,
  };
}
