import type { GenotypeVendor, UserGenotype } from "./types";

const RSID_PATTERN = /^rs\d+$/i;

export interface ParseResult {
  genotypes: Map<string, UserGenotype>;
  vendor: GenotypeVendor;
  variantCount: number;
  errors: string[];
}

function detectVendor(headerLines: string[]): GenotypeVendor {
  const joined = headerLines.join("\n").toLowerCase();
  if (joined.includes("23andme")) return "23andme";
  if (joined.includes("ancestry")) return "ancestry";
  return "unknown";
}

function parseGenotypeLine(
  line: string,
  lineNumber: number,
  errors: string[],
): UserGenotype | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;

  const parts = trimmed.split(/\s+/);
  if (parts.length < 4) {
    if (parts.length >= 3 && RSID_PATTERN.test(parts[0])) {
      errors.push(`Line ${lineNumber}: missing genotype column`);
    }
    return null;
  }

  const [rsidRaw, chr, posRaw, genotypeRaw] = parts;
  const rsid = rsidRaw.toLowerCase();
  if (!RSID_PATTERN.test(rsid)) return null;

  const position = parseInt(posRaw, 10);
  if (Number.isNaN(position)) return null;

  const genotype = genotypeRaw.replace(/-/g, "").toUpperCase();
  if (!/^[ACGT]{1,2}$/i.test(genotype)) return null;

  return {
    rsid,
    chromosome: chr.replace(/^chr/i, ""),
    position,
    genotype,
  };
}

/**
 * Parse 23andMe or AncestryDNA raw genotype export files.
 * Supports tab- or space-delimited formats with optional header comments.
 */
export function parseGenotypeFile(content: string): ParseResult {
  const lines = content.split(/\r?\n/);
  const headerLines = lines.filter((l) => l.startsWith("#")).slice(0, 30);
  const vendor = detectVendor(headerLines);

  const genotypes = new Map<string, UserGenotype>();
  const errors: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const parsed = parseGenotypeLine(lines[i], i + 1, errors);
    if (parsed) {
      genotypes.set(parsed.rsid, parsed);
    }
  }

  if (genotypes.size === 0) {
    errors.push(
      "No valid SNPs found. Ensure you uploaded a raw genotype file (not a PDF report).",
    );
  }

  return {
    genotypes,
    vendor,
    variantCount: genotypes.size,
    errors: errors.slice(0, 5),
  };
}
