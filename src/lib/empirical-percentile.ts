import type { PrsReferenceDistribution } from "./prs-reference-types";

/**
 * Empirical percentile: rank user PRS within reference cohort distribution.
 * No Gaussian CDF — uses precomputed quantile ladder from real (or built) reference panel.
 */
export function empiricalPercentile(
  prsValue: number,
  reference: PrsReferenceDistribution,
): number {
  const keys = Object.keys(reference.quantiles)
    .map((k) => parseInt(k, 10))
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);

  if (keys.length === 0) {
    return 50;
  }

  if (prsValue <= reference.quantiles[String(keys[0])]) {
    return keys[0];
  }
  const last = keys[keys.length - 1];
  if (prsValue >= reference.quantiles[String(last)]) {
    return last;
  }

  for (let i = 0; i < keys.length - 1; i++) {
    const p0 = keys[i];
    const p1 = keys[i + 1];
    const v0 = reference.quantiles[String(p0)];
    const v1 = reference.quantiles[String(p1)];
    if (prsValue >= v0 && prsValue <= v1) {
      if (v1 === v0) return (p0 + p1) / 2;
      const frac = (prsValue - v0) / (v1 - v0);
      return p0 + frac * (p1 - p0);
    }
  }

  return 50;
}

export function empiricalZScore(
  prsValue: number,
  reference: PrsReferenceDistribution,
): number {
  const sd = reference.sd > 0 ? reference.sd : 1;
  return (prsValue - reference.mean) / sd;
}
