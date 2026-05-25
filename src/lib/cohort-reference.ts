/**
 * Cohort-derived PRS reference (1000 Genomes PLINK scoring).
 * When present, replaces bridge quantiles in src/data/prs-reference/.
 */

import type { CancerType } from "./types";
import type {
  PrsReferenceDistribution,
  ReferencePopulation,
} from "./prs-reference-types";

import cohortManifest from "@/data/cohort_reference_manifest.json";

interface CohortManifest {
  version: string;
  source: string;
  cancers: Record<
    string,
    Record<string, { path: string; nIndividuals: number }>
  >;
}

const manifest = cohortManifest as CohortManifest;
const cache = new Map<string, PrsReferenceDistribution>();

export function hasCohortReference(): boolean {
  return manifest.version !== "pending";
}

export async function loadCohortReference(
  cancer: CancerType,
  pgsId: string,
  population: ReferencePopulation,
): Promise<PrsReferenceDistribution | null> {
  const key = `${cancer}:${pgsId}:${population}`;
  if (cache.has(key)) return cache.get(key)!;

  const entry = manifest.cancers[cancer]?.[population];
  if (!entry?.path) return null;

  try {
    const mod = await import(`@/data/${entry.path}`);
    const ref = mod.default as PrsReferenceDistribution;
    ref.calibrationMethod = "1kg_empirical_plink";
    cache.set(key, ref);
    return ref;
  } catch {
    return null;
  }
}
