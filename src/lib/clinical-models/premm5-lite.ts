/**
 * Simplified PREMM5 — Lynch syndrome / MMR germline mutation probability proxy.
 * @see Kastrinos F et al., Gastroenterology 2017 (PREMM5)
 */

import { absoluteLifetimeRisk } from "../absolute-risk";
import { baselineFor } from "../epidemiology-baselines";
import type { FamilyHistoryInput, UserProfile } from "../types";
import type { ClinicalModelResult } from "./gail-lite";

function premm5LogOdds(fh?: FamilyHistoryInput, age?: number): number {
  if (!fh?.provided) return -3;

  let logOdds = -2.5;
  if (fh.colorectalFirstDegree) logOdds += 1.2;
  if (fh.lynchSyndromeConcern) logOdds += 1.8;
  if (fh.youngestAffectedAge != null && fh.youngestAffectedAge < 50) logOdds += 0.6;
  if (age != null && age > 50) logOdds += 0.2;

  return logOdds;
}

/** PREMM5 mutation probability (0–1), not lifetime CRC risk directly */
export function premm5LynchProbability(profile: UserProfile): number {
  const logOdds = premm5LogOdds(profile.familyHistory, profile.age);
  return 1 / (1 + Math.exp(-logOdds));
}

export function premm5LiteColorectalRisk(profile: UserProfile): ClinicalModelResult {
  const base = baselineFor("colorectal");
  const sex = profile.sex;
  const rBase =
    sex === "male"
      ? base.lifetimeRiskMale
      : sex === "female"
        ? base.lifetimeRiskFemale
        : Math.max(base.lifetimeRiskFemale, base.lifetimeRiskMale);

  const ancestry = profile.ancestry ?? "unknown";
  const rBaseAdj = rBase * (base.ancestryMultipliers[ancestry] ?? 1);

  const lynchProb = premm5LynchProbability(profile);
  const rrClinical = 1 + lynchProb * 4 + (profile.familyHistory?.colorectalFirstDegree ? 1.2 : 0);
  const absolute = absoluteLifetimeRisk(rBaseAdj, rrClinical);

  return {
    absoluteLifetimeRiskPercent: Math.round(absolute * 1000) / 10,
    rrClinical,
    modelName: "PREMM5-inspired (Lynch + CRC FH)",
    modelCitation: "Kastrinos F et al., Gastroenterology 2017 (PREMM5).",
    notes: [
      `Estimated Lynch/MMR carrier probability (educational): ~${Math.round(lynchProb * 100)}%.`,
      "Not a germline test — discuss genetic counseling if elevated.",
    ],
  };
}
