/**
 * DEMO ONLY — synthetic cohort simulation engine.
 * NOT used in production risk outputs when VALIDITY_MODE.SYNTHETIC_CALIBRATION is false.
 *
 * Run offline: python3 genomics-pipeline/calibration/synthetic_cohort_calibration.py
 */

import { VALIDITY_MODE } from "../../validity-config";

export function isSyntheticCalibrationEnabled(): boolean {
  return VALIDITY_MODE.SYNTHETIC_CALIBRATION;
}

/** Throws if called while production flag is off */
export function assertDemoOnlySynthetic(): void {
  if (!isSyntheticCalibrationEnabled()) {
    throw new Error(
      "Synthetic cohort calibration is demo-only and disabled in production (VALIDITY_MODE.SYNTHETIC_CALIBRATION=false).",
    );
  }
}
