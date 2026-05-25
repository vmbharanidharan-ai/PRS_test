/**
 * PRS scoring backend selector — preserves computePrsForScore API.
 *
 * SCORING_BACKEND env (or default pgs_catalog):
 *   pgs_catalog — bundled PGS Catalog weights (browser default)
 *   prs_cs       — LD-aware weights from genomics-pipeline/data/prs_cs/
 */

import type { CancerType, PrsScoreDefinition, PrsVariant } from "./types";
import { getScoreByCancer } from "./prs-registry";

export type ScoringBackend = "pgs_catalog" | "prs_cs" | "ldpred2";

export function getScoringBackend(): ScoringBackend {
  const v = process.env.NEXT_PUBLIC_SCORING_BACKEND ?? "pgs_catalog";
  if (v === "prs_cs" || v === "ldpred2") return v;
  return "pgs_catalog";
}

/** Returns variants + weights for dot-product scoring */
export function getScoringDefinition(cancer: CancerType): {
  definition: PrsScoreDefinition;
  backend: ScoringBackend;
} | null {
  const definition = getScoreByCancer(cancer);
  if (!definition) return null;

  const backend = getScoringBackend();
  if (backend === "pgs_catalog") {
    return { definition, backend };
  }

  // PRS-CS / LDpred2: merge weights from TSV when present (server/build time)
  const merged = mergeLdAwareWeights(definition, cancer, backend);
  return { definition: merged, backend };
}

function mergeLdAwareWeights(
  definition: PrsScoreDefinition,
  cancer: CancerType,
  backend: ScoringBackend,
): PrsScoreDefinition {
  // Browser build: LD weights must be pre-bundled into src/data/prs_cs/*.json at build time
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ld = require(`@/data/prs_cs/${cancer}.json`) as {
      weights: Record<string, number>;
    };
    const variants: PrsVariant[] = definition.variants
      .map((v) => ({
        ...v,
        weight: ld.weights[v.rsid.toLowerCase()] ?? v.weight,
      }))
      .filter((v) => ld.weights[v.rsid.toLowerCase()] !== undefined);
    if (variants.length > 0) {
      return {
        ...definition,
        name: `${definition.name} (${backend})`,
        variants,
      };
    }
  } catch {
    /* prs_cs bundle not built — fall back to catalog */
  }
  return definition;
}
