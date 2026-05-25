/**
 * Absolute risk — delegates to risk-engine (literature Cox → legacy joint fallback).
 * API contract unchanged for report-generator.
 */

export {
  buildRiskInterpretation,
  buildAbsoluteRiskBreakdown,
  absoluteLifetimeRisk,
  rrFromPrsZ,
} from "./risk-engine";

export type { AbsoluteRiskBreakdown } from "./types";
export type { JointRiskInput } from "./risk-engine";
