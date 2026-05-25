/**
 * @deprecated Moved to risk-engine/demo — disabled in production.
 * Literature β only: see risk-engine/core/literature-relative-risk.ts
 */

import { VALIDITY_MODE } from "./validity-config";

export function loadSyntheticCalibration() {
  if (!VALIDITY_MODE.SYNTHETIC_CALIBRATION) return null;
  return null;
}

export function syntheticPrsLogRelativeRisk(): undefined {
  return undefined;
}
