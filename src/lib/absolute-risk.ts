/**
 * Absolute risk — delegates to risk-engine (Cox UKB → legacy joint fallback).
 * API contract unchanged for report-generator.
 */

export {
  buildAbsoluteRiskBreakdown,
  absoluteLifetimeRisk,
  rrFromPrsZ,
} from "./risk-engine";

export type { AbsoluteRiskBreakdown } from "./types";
export type { JointRiskInput } from "./risk-engine";
