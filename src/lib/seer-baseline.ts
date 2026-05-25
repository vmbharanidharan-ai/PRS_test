/**
 * SEER-informed baseline risk adjustments (Layer 2).
 * UK Biobank not required — order-of-magnitude U.S. population priors.
 *
 * Full age-specific cumulative incidence tables can replace this scalar
 * when SEER API or Stat Facts tables are ingested offline.
 */

import { baselineFor } from "./epidemiology-baselines";
import type { CancerType, UserProfile } from "./types";

/**
 * Age multiplier on baseline lifetime risk — incidence rises mid/late life.
 * Simplified epidemiological curve; not individual SEER life table lookup.
 */
export function seerAgeBaselineMultiplier(age?: number): number {
  if (!age) return 1;
  if (age < 40) return 0.65;
  if (age < 50) return 0.85;
  if (age < 60) return 1;
  if (age < 70) return 1.15;
  return 1.25;
}

export function seerBaselineLifetimeRisk(
  cancerType: CancerType,
  profile?: UserProfile,
): number {
  const base = baselineFor(cancerType);
  const sex = profile?.sex;
  let r =
    sex === "male"
      ? base.lifetimeRiskMale
      : sex === "female"
        ? base.lifetimeRiskFemale
        : Math.max(base.lifetimeRiskFemale, base.lifetimeRiskMale);

  const ancestry = profile?.ancestry ?? "unknown";
  r *= base.ancestryMultipliers[ancestry] ?? 1;
  r *= seerAgeBaselineMultiplier(profile?.age);

  return Math.min(0.45, Math.max(0.0001, r));
}
