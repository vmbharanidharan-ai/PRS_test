"""
Unified log-linear relative risk — mirrors src/lib/joint-risk-model.ts

log(RR) = beta_prs * Z + sum(beta_fh * FH) + beta_age * (age-50) + ancestry_terms
P = 1 - (1 - R_base) ** exp(log_RR)

Train coefficients on UK Biobank / cohort labels for production (sklearn LogisticRegression or lifelines Cox).
"""

from __future__ import annotations

import math
from dataclasses import dataclass


@dataclass
class JointRiskResult:
    log_rr: float
    rr: float
    absolute_risk: float
    components: dict[str, float]


def log_rr(
    z_prs: float = 0.0,
    beta_prs: float = math.log(1.8),
    fh_log: float = 0.0,
    age: float | None = None,
    ancestry_log: float = 0.0,
    clinical_log_prior: float = 0.0,
) -> JointRiskResult:
    age_term = 0.012 * ((age or 50) - 50)
    log_r = beta_prs * z_prs + fh_log + age_term + ancestry_log + clinical_log_prior
    rr = math.exp(max(-5, min(5, log_r)))
    return JointRiskResult(
        log_rr=log_r,
        rr=rr,
        absolute_risk=0.0,
        components={
            "prs": beta_prs * z_prs,
            "fh": fh_log,
            "age": age_term,
            "ancestry": ancestry_log,
            "clinical_prior": clinical_log_prior,
        },
    )


def absolute_risk(r_base: float, log_r: float) -> float:
    rr = math.exp(max(-5, min(5, log_r)))
    r_base = max(1e-4, min(0.99, r_base))
    return 1 - (1 - r_base) ** rr
